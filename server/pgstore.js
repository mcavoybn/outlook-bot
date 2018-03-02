const { Client } = require("pg");
const uuid4 = require("uuid/v4");


const ARRAY_SEPARATOR = '<=.*-=>';

class PGStore {
    constructor(label) {
        this.prefix = label.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        this.client = new Client({
            connectionString: process.env.DATABASE_URL
        });
        this.queryCreateFlaggedTableIfNeeded = `
            CREATE TABLE IF NOT EXISTS ${this.prefix}_flagged (
                received         timestamp with time zone,

                message_id       uuid PRIMARY KEY,
                thread_id        uuid,
                sender_id        uuid,
                sender_label     text,
                recipient_ids    uuid[],
                recipient_labels text,

                trigger_id       uuid REFERENCES ${this.prefix}_trigger,
                notified_ids     uuid[],
                notified_labels  text,
                feedback         jsonb
            );`;

        this.queryCreateTriggerTableIfNeeded = `
            CREATE TABLE IF NOT EXISTS ${this.prefix}_trigger (
                id               uuid PRIMARY KEY,
                state            text,
                def              jsonb
            );`;


        this.queryAddFlagged = `
            INSERT INTO ${this.prefix}_flagged (
                received,
                message_id,
                thread_id,
                sender_id,
                sender_label,
                recipient_ids,
                recipient_labels,
                trigger_id,
                notified_ids,
                notified_labels,
                feedback
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )`;

        this.queryUpdateFlaggedFeedback = `
            UPDATE ${this.prefix}_flagged
            SET feedback = $2
            WHERE id = $1`;

        this.queryAddTrigger = `
            INSERT INTO ${this.prefix}_trigger (
                id,
                state,
                def
            ) VALUES (
                $1, $2, $3
            )`;

        this.queryUpdateTrigger = `
            UPDATE ${this.prefix}_trigger
            SET state = $2, def = $3
            WHERE id = $1`;
    }

    async initialize() {
        console.log('starting up db stuff');
        await this.client.connect();
        return [
            this.client.query(this.queryCreateTriggerTableIfNeeded),
            this.client.query(this.queryCreateFlaggedTableIfNeeded)
        ];
    }

    async shutdown() {
        console.log('shutting down db stuff');
        await this.client.end();
        this.client = null;
    }

    async addFlagged(entry) {
        const {
            received,
            messageId,
            threadId,
            senderId,
            senderLabel,
            recipientIds,
            recipientLabels,
            triggerId,
            notifiedIds,
            notifiedLabels,
            feedback
        } = entry;

        const result = await this.client.query(this.queryAddFlagged, [
            received,
            messageId,
            threadId,
            senderId,
            senderLabel,
            recipientIds,
            recipientLabels && recipientLabels.join(ARRAY_SEPARATOR),
            triggerId,
            notifiedIds,
            notifiedLabels && notifiedLabels.join(ARRAY_SEPARATOR),
            feedback
        ]);
        if (result.rowCount !== 1)
            throw new Error("Failure in postgres flagged insert");
        
        return result;
    }

    async updateFlaggedFeedback(entry) {
        const {
            messageId,
            feedback
        } = entry;

        const result = await this.client.query(this.queryUpdateFlaggedFeedback, [
            messageId,
            feedback
        ]);
        if (result.rowCount !== 1)
            throw new Error("Failure in postgres flagged feedback update");
        
        return result;
    }

    async getFlagged({ 
            limit, offset, 
            orderby='received', ascending='no', 
            until, since, 
            messageId,
            threadId,
            from, fromId,
            to, toId,
            triggerId,
            notified, notifiedId }) {
        console.warn('TODO: Need to parameterize getFlagged to make it safe!');
        const _selectfrom = `SELECT *, count(*) OVER() AS full_count FROM ${this.prefix}_flagged`;

        const _limit = limit ? `LIMIT ${limit}` : '';
        const _offset = offset ? `OFFSET ${offset}` : '';

        let predicates = [];
        if (until) predicates.push(`received <= '${until}'::timestamp with time zone`);
        if (since) predicates.push(`received >= '${since}'::timestamp with time zone`);
        if (threadId) predicates.push(`thread_id = '${threadId}'`);
        if (messageId) predicates.push(`message_id = '${messageId}'`);
        if (from) predicates.push(`sender_label ILIKE '%${from}%'`);
        if (fromId) predicates.push(`sender_id = '${fromId}'`);
        if (to) predicates.push(`recipient_labels ILIKE '%${to}%'`);
        if (toId) predicates.push(`recipient_ids @> ARRAY['${toId}'::uuid]`);
        if (notified) predicates.push(`notified_labels ILIKE '%${notified}%'`);
        if (notifiedId) predicates.push(`notified_ids @> ARRAY['${notifiedId}'::uuid]`);
        if (triggerId) predicates.push(`trigger_id = '${triggerId}'`);
        const _where = (predicates.length) ? `WHERE ${predicates.join(' AND ')}` : '';

        const _orderby = orderby ? `ORDER BY ${orderby} ${ascending === 'yes' ? 'ASC' : 'DESC'}` : '';

        const query = `${_selectfrom} ${_where} ${_orderby} ${_limit} ${_offset};`;

        console.log('Flagged query:', query);
        const result = await this.client.query(query);
        
        return result.rows.map(row => {
            return {
                received: row.received,
                messageId: row.message_id,
                threadId: row.thread_id,
                senderId: row.sender_id,
                senderLabel: row.sender_label,
                recipientIds: row.recipient_ids,
                recipientLabels: row.recipient_labels.split(ARRAY_SEPARATOR),
                triggerId: row.trigger_id,
                notifiedIds: row.notified_ids,
                notifiedLabels: row.notified_labels.split(ARRAY_SEPARATOR),
                feedback: row.feedback,
                fullCount: row.full_count
            };
        });
    }

    async addTrigger(entry) {
        const { state, def } = entry;

        const result = await this.client.query(this.queryAddTrigger, [
            uuid4(),
            state, 
            def
        ]);
        if (result.rowCount !== 1)
            throw new Error("Failure in postgres trigger insert");

        return result;
    }

    async updateTrigger(entry) {
        const { id, state, def } = entry;

        const result = await this.client.query(this.queryUpdateTrigger, [
            id, 
            state, 
            def
        ]);
        if (result.rowCount !== 1)
            throw new Error("Failure in postgres trigger update");

        return result;
    }

    async getTriggers({ state, state_neq }) {
        const _selectfrom = `SELECT t.id, t.state, t.def, COUNT(trigger_id) FROM ${this.prefix}_trigger t
                             LEFT JOIN ${this.prefix}_flagged m on m.trigger_id = t.id`;
        const _where = state ? `WHERE state = '${state}'` : (state_neq ? `WHERE state <> '${state_neq}'` : '');
        const _group =  `GROUP BY t.id, t.state, t.def`;
        const _orderby = `ORDER BY def->>'label', def->>'notify'`;

        const query = `${_selectfrom} ${_where} ${_group} ${_orderby};`;

        console.log('Flagged query:', query);
        const result = await this.client.query(query);
        
        return result.rows.map(row => {
            return {
                id: row.id,
                state: row.state,
                def: row.def,
                count: row.count
            };
        });
    }
}

module.exports = PGStore;
