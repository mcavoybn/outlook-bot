// vim: ts=4:sw=4:expandtab

"use strict";

const BotAtlasClient = require("./atlas_client");
const cache = require("./cache");
const relay = require("librelay");
const PGStore = require("./pgstore");
const uuid4 = require("uuid/v4");
const uuid5 = require("uuid/v5");
const moment = require("moment");
const words = require("./authwords");
const _ = require('lodash');

const AUTH_FAIL_THRESHOLD = 10;


function terms2regex(terms) {
    return String.raw`\b(` + terms.split('\n').map(x => x.trim().replace(/\s+/g, String.raw`\s+`)).filter(x => !!x).join('|') + String.raw`)\b`;
}

const regexes = {
    help: new RegExp(terms2regex(`help \n commands \n list`), 'i'),
    replay: new RegExp(terms2regex(`original \n repeat \n replay \n again \n pardon \n message \n what \n one more time`), 'i'),
    stats: new RegExp(terms2regex(`stats \n statistics \n score \n scorecard \n score card \n hits`), 'i'),
    up: new RegExp(terms2regex(`emphasize \n matter \n matters \n upvote \n good \n up \n more \n like \n thanks \n useful \n yes`), 'i'),
    down: new RegExp(terms2regex(`ignore \n downvote \n distraction \n bad \n down \n less \n dislike \n noise \n no \n useless`), 'i'),
    add: new RegExp(terms2regex(`add \n include`), 'i'),
    remove: new RegExp(terms2regex(`remove \n subtract \n exclude`), 'i'),
};

async function sleep(ms) { 
    return await new Promise(resolve => setTimeout(resolve, ms)); 
}

class ForstaBot {
    async start() {
        const ourId = await relay.storage.getState('addr');
        if (!ourId) {
            console.warn('bot is not yet registered');
            return;
        }
        await this.migrate();
        console.info('Starting message receiver for:', ourId);
        this.pgStore = new PGStore('compliance_monitor');
        await this.pgStore.initialize();
        this.atlas = await BotAtlasClient.factory();
        this.getUsers = cache.ttl(60, this.atlas.getUsers.bind(this.atlas));
        this.resolveTags = cache.ttl(
            60,
            this.atlas.resolveTags.bind(this.atlas)
        );
        this.msgReceiver = await relay.MessageReceiver.factory();
        this.msgReceiver.addEventListener(
            'keychange',
            this.onKeyChange.bind(this)
        );
        this.msgReceiver.addEventListener(
            'message',
            ev => this.onMessage(ev),
            null
        );
        this.msgReceiver.addEventListener('error', this.onError.bind(this));

        this.msgSender = await relay.MessageSender.factory();

        await this.loadTriggers();
        this.botUserId = await relay.storage.getState("botUser");
        this.botUser = (await this.getUsers([this.botUserId]))[0];
        this.notificationThread = {}; // threads being monitored for feedback

        await this.msgReceiver.connect();
    }

    async migrate() {
    }

    async stop() {
        if (this.msgReceiver) {
            console.warn('Stopping message receiver');
            this.msgReceiver.close();
            this.msgReceiver = null;
        }
        await this.pgStore.shutdown();
    }

    async restart() {
        await this.stop();
        await this.start();
    }

    async onKeyChange(ev) {
        console.warn('Auto-accepting new identity key for:', ev.addr);
        await ev.accept();
    }

    onError(e) {
        console.error('Message Error', e, e.stack);
    }

    fqTag(user) { return `@${user.tag.slug}:${user.org.slug}`; }
    fqName(user) { return [user.first_name, user.middle_name, user.last_name].map(s => (s || '').trim()).filter(s => !!s).join(' '); }
    fqLabel(user) { return `${this.fqTag(user)} (${this.fqName(user)})`; }

    bodyText(message) { 
        const tmpBody = message.data && message.data.body;
        const tmpText = tmpBody && tmpBody.find(x => x.type === 'text/plain');
        return tmpText && tmpText.value;
    }


    async onMessage(ev) {
        const received = new Date(ev.data.timestamp);
        const envelope = JSON.parse(ev.data.message.body);
        const message = envelope.find(x => x.version === 1);
        if (!message) {
            console.error('Dropping unsupported message:', envelope);
            return;
        }
        
        const senderId = message.sender.userId;
        const sender = (await this.getUsers([senderId]))[0];
        const fromInside = sender.org.id === this.botUser.org.id;

        const distribution = await this.resolveTags(message.distribution.expression);
        const recipientIds = distribution.userids;
        const recipients = await this.getUsers(recipientIds);
        const [toInside, toOutside] = recipients.reduce(([toInside, toOutside], recipient) => [toInside || recipient.org.id === this.botUser.org.id, toOutside || recipient.org.id !== this.botUser.org.id], [false, false]);

        let directions = ['any'];
        if (fromInside && toInside && !toOutside) directions.push('internal');
        if (!fromInside && toInside) directions.push('incoming');
        if (fromInside && toOutside) directions.push('outgoing');

        const text = this.bodyText(message);
        const dtext = text.replace(/[^0-9]+/, '');
        const threadId = message.threadId;

        const memo = this.notificationThread[threadId];
        if (memo) {
            await this.processComment({memo, threadId, senderId, sender, distribution, recipientIds, recipients, received, message, text});
            return;
        }

        for (const trigger of this.triggers) {
            if (!directions.includes(trigger.def.direction)) continue;
            const matchText = trigger.def.dflag ? dtext : text;
            const match = (text && trigger.compiledRegex.exec(matchText));
            if (match) await this.flagMessage({senderId, sender, distribution, recipientIds, recipients, received, message, trigger, match, text});
        }
    }

    async processComment({memo, threadId, senderId, sender, distribution, recipientIds, recipients, received, message, text}) {
        if (regexes.help.test(text)) {
            await this.sendHelp({distribution, memo, threadId});
        }
        if (regexes.stats.test(text)) {
            await this.sendStats({distribution, memo, threadId});
        }
        if (regexes.replay.test(text)) {
            await this.replayNotify({distribution, memo, threadId});
        }
        if (regexes.up.test(text)) {
            await this.upvote({distribution, memo, threadId});
        }
        if (regexes.down.test(text)) {
            await this.downvote({distribution, memo, threadId});
        }
    }

    async sendStats({distribution, memo, threadId}) {
        const flagged = await this.pgStore.getFlagged({triggerId: memo.triggerId});
        const grouped = _.groupBy(flagged, 'senderId');
        const counted = Object.keys(grouped).reduce((r, k) => {
            return [{ count: grouped[k].length, label: grouped[k][0].senderLabel }, ...r];
        }, []);
        const sorted = _.orderBy(counted, 'count', 'desc');
        const stats = sorted.map(x => `${x.count} ${x.label}`).join('\n');
        console.log('stats', stats);

        const intro = `Match counts for this trigger:\n\n`;

        this.msgSender.send({
            distribution,
            threadTitle: memo.notificationThreadTitle,
            threadId,
            text: intro + stats
        });
    }

    async replayNotify({distribution, memo, threadId}) {
        this.msgSender.send({
            distribution,
            threadTitle: memo.notificationThreadTitle,
            threadId,
            text: memo.notifyText
        });
    }

    async upvote({distribution, memo, threadId}) {
        this.msgSender.send({
            distribution,
            threadTitle: memo.notificationThreadTitle,
            threadId,
            text: `Thanks for the feedback to notify of future messages like this.`
        });
    }

    async downvote({distribution, memo, threadId}) {
        this.msgSender.send({
            distribution,
            threadTitle: memo.notificationThreadTitle,
            threadId,
            text: `Thanks for the feedback to ignore future messages like this.`
        });
    }

    async sendHelp({distribution, memo, threadId}) {
        this.msgSender.send({
            distribution,
            threadTitle: memo.notificationThreadTitle,
            threadId,
            text: `help/commands/list -- show this list
again/replay/repeat/message/etc. -- show the message again
stats/score/hits/etc. -- show statistics for this message's trigger
up/good/more/like/yes/etc. -- training feedback to notice messages like this one
down/bad/less/noise/no/etc. -- training feedback to ignore messages like this one
`
        });
    }


    async flagMessage({senderId, sender, distribution, recipientIds, recipients, received, message, trigger, match, text}) {
        const senderLabel = this.fqLabel(sender);
        const recipientLabels = recipients.map(user => this.fqLabel(user));

        const notifees = await this.resolveTags(`(${trigger.def.notify})+<${this.botUserId}>`);
        const notifiedIds = notifees.userids;
        const notified = await this.getUsers(notifiedIds);
        const notifiedLabels = notified.map(user => this.fqLabel(user));

        const messageId = message.messageId;
        const threadId = message.threadId;

        const flaggedEntry = {
            received,
            messageId,
            threadId,
            senderId,
            senderLabel,
            recipientIds,
            recipientLabels,
            triggerId: trigger.id,
            notifiedIds,
            notifiedLabels
        };

        await this.pgStore.addFlagged(flaggedEntry);

        const notifyText = `From: ${senderLabel}\nTo: ${distribution.pretty}\n\nFirst text match: "${match[0]}"\n\nFull message text: "${text}"`;

        const notificationThreadTitle = `Compliance Alert: ${trigger.def.label}`;

        this.forgetStaleNotificationThreads();
        const notificationThreadId = uuid5('compliance', messageId);
        this.notificationThread[notificationThreadId] = {
            flaggedEntry,
            message,
            distribution,
            notificationThreadTitle,
            notifyText,
            trigger,
            text,
            match,
        };

        this.msgSender.send({
            distribution: notifees,
            threadTitle: notificationThreadTitle,
            threadId: notificationThreadId,
            text: notifyText
        });
    }

    forgetStaleNotificationThreads() {
        let tooOld = new Date();
        tooOld.setDate(tooOld.getDate() - 7);

        Object.keys(this.notificationThread).forEach(n => {
            if (this.notificationThread[n].flaggedEntry.received < tooOld) {
                delete this.notificationThread[n];
            }
        });
        console.log('stale notification threads removed. currently tracking:', Object.assign({}, this.notificationThread));
    }

    async incrementAuthFailCount() {
        let fails = await relay.storage.get('authentication', 'fails', {count: 0, since: new Date()});
        fails.count++;

        if (fails.count >= AUTH_FAIL_THRESHOLD) {
            await this.broadcastNotice({
                note: `SECURITY ALERT!\n\n${fails.count} failed login attempts (last successful login was ${moment(fails.since).fromNow()})`
            });
        }

        await relay.storage.set('authentication', 'fails', fails);
    }

    async resetAuthFailCount() {
        await relay.storage.set('authentication', 'fails', {count: 0, since: new Date()});
    }

    async getSoloAuthThreadId() {
        let id = await relay.storage.get('authentication', 'soloThreadId');
        if (!id) {
            id = uuid4();
            relay.storage.set('authentication', 'soloThreadId', id);
        }

        return id;
    }

    async getGroupAuthThreadId() {
        let id = await relay.storage.get('authentication', 'groupThreadId');
        if (!id) {
            id = uuid4();
            relay.storage.set('authentication', 'groupThreadId', id);
        }

        return id;
    }

    genAuthCode(expirationMinutes) {
        const code = `${words.adjective()} ${words.noun()}`;
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + expirationMinutes);
        return { code, expires };
    }

    removeExpiredAuthCodes(pending) {
        const now = new Date();

        Object.keys(pending).forEach(uid => {
            pending[uid].expires = new Date(pending[uid].expires);
            if (pending[uid].expires < now) {
                delete pending[uid];
            }
        });

        return pending;
    }

    async sendAuthCode(tag) {
        tag = (tag && tag[0] === '@') ? tag : '@' + tag;
        const resolved = await this.resolveTags(tag);
        if (resolved.userids.length === 1 && resolved.warnings.length === 0) {
            const uid = resolved.userids[0];
            const adminIds = await relay.storage.get('authentication', 'adminIds');
            if (!adminIds.includes(uid)) {
                throw { statusCode: 403, info: { tag: ['not an authorized user'] } }; 
            }

            const auth = this.genAuthCode(1);
            this.msgSender.send({
                distribution: resolved,
                threadTitle: 'Compliance Login',
                threadId: await this.getGroupAuthThreadId(),
                text: `codewords: ${auth.code}\n(valid for one minute)`
            });
            const pending = await relay.storage.get('authentication', 'pending', {});
            pending[uid] = auth;
            await relay.storage.set('authentication', 'pending', pending);
            
            return resolved.userids[0];
        } else {
            throw { statusCode: 400, info: { tag: ['not a recognized tag, please try again'] } }; 
        }
    }

    async validateAuthCode(userId, code) {
        let pending = await relay.storage.get('authentication', 'pending', {});
        pending = this.removeExpiredAuthCodes(pending);
        const auth = pending[userId];
        if (!auth) {
            throw { statusCode: 403, info: { code: ['no authentication pending, please start over'] } }; 
        }
        if (auth.code != code) {
            this.incrementAuthFailCount();
            await sleep(500); // throttle guessers
            throw { statusCode: 403, info: { code: ['incorrect codewords, please try again'] } }; 
        }

        delete pending[userId];
        relay.storage.set('authentication', 'pending', pending);

        await this.broadcastNotice({note: 'LOGIN', actorUserId: userId, listAll: false});
        await this.resetAuthFailCount();
        return true;
    }

    async getAdministrators() {
        const adminIds = await relay.storage.get('authentication', 'adminIds', []);
        const adminUsers = await this.getUsers(adminIds);
        const admins = adminUsers.map(u => {
            return {
                id: u.id,
                label: this.fqLabel(u)
            };
        });
        return admins;
    }

    async broadcastNotice({note, actorUserId, listAll=true}) {
        const adminIds = await relay.storage.get('authentication', 'adminIds', []);
        let added = false;
        if (actorUserId && !adminIds.includes(actorUserId)) {
            adminIds.push(actorUserId);
            added = true;
        }
        const adminUsers = await this.getUsers(adminIds);
        const actor = adminUsers.find(u => u.id === actorUserId);
        const actorLabel = actor ? this.fqLabel(actor) : '<unknown>';
        const expression = adminUsers.map(u => this.fqTag(u)).join(' + ');
        const distribution = await this.resolveTags(expression);

        const adminList = adminUsers.filter(u => !(added && u.id === actorUserId)).map(u => this.fqLabel(u)).join('\n');

        let fullMessage = note;
        fullMessage += actorUserId ? `\n\nPerformed by ${actorLabel}` : '';
        fullMessage += listAll ? `\n\nCurrent authorized users:\n${adminList}` : '';
        fullMessage = fullMessage.replace(/<<([^>]*)>>/g, (_, id) => {
            const user = adminUsers.find(x => x.id === id);
            return this.fqLabel(user);
        });

        this.msgSender.send({
            distribution,
            threadTitle: 'Compliance Alerts',
            threadId: await this.getSoloAuthThreadId(),
            text: fullMessage
        });
    }

    async addAdministrator({addTag, actorUserId}) {
        const tag = (addTag && addTag[0] === '@') ? addTag : '@' + addTag;
        const resolved = await this.resolveTags(tag);
        if (resolved.userids.length === 1 && resolved.warnings.length === 0) {
            const uid = resolved.userids[0];
            const adminIds = await relay.storage.get('authentication', 'adminIds');
            if (!adminIds.includes(uid)) {
                adminIds.push(uid);
                await relay.storage.set('authentication', 'adminIds', adminIds);
            }
            await this.broadcastNotice({note: `ADDED <<${uid}>> to authorized users`, actorUserId});
            return this.getAdministrators();
        }
        throw { statusCode: 400, info: { tag: ['not a recognized tag, please try again'] } }; 
    }

    async removeAdministrator({removeId, actorUserId}) {
        const adminIds = await relay.storage.get('authentication', 'adminIds', []);
        const idx = adminIds.indexOf(removeId);

        if (idx < 0) {
            throw { statusCode: 400, info: { id: ['administrator id not found'] } };
        }
        adminIds.splice(idx, 1);
        await this.broadcastNotice({note: `REMOVING <<${removeId}>> from authorized users`, actorUserId});
        await relay.storage.set('authentication', 'adminIds', adminIds);

        return this.getAdministrators();
    }


    async updateFlaggedFeedback({id, feedback}) {
        return this.pgStore.updateFlaggedFeedback({id, feedback});
    }

    async resolve(expression) {
        const resolved = await this.resolveTags(expression);
        const warnings = resolved.warnings.map(w => `${w.kind}: ${w.cue}`);
        if (warnings.length) {
            throw { statusCode: 400, info: { notify: warnings } }; 
        }
        if (resolved.includedTagids.length === 0) {
            throw { statusCode: 400, info: { notify: ['no tags provided'] } }; 
        }

        return [resolved.pretty, resolved.universal];
    }

    async addTrigger({state, label, type, pattern, direction, iflag, dflag, notify, userId: creatorId}) {
        const [pretty, universal] = await this.resolve(notify);
        const result = await this.pgStore.addTrigger({state, def: {
            label,
            type,
            pattern,
            direction,
            iflag,
            dflag,
            notify: pretty,
            notifyUniversal: universal,
            creatorId
        }});
        await this.loadTriggers();
        return result;
    }
    async updateTrigger({id, state, label, direction, type, pattern, iflag, dflag, notify, userId: creatorId}) {
        const [pretty, universal] = await this.resolve(notify);
        const result = await this.pgStore.updateTrigger({id, state, def: {
            label,
            type,
            pattern,
            direction,
            iflag,
            dflag,
            notify: pretty,
            notifyUniversal: universal,
            creatorId
        }});
        await this.loadTriggers();
        return result;
    }

    async loadTriggers() {
        this.triggers = await this.pgStore.getTriggers({state: 'active'});
        this.triggers.forEach(t => {
            const regex = t.type === 'regex' ? t.def.pattern : terms2regex(t.def.pattern);
            t.compiledRegex = new RegExp(regex, t.def.iflag ? 'i' : '');
        });
        console.log('(re)loaded triggers');
    }
}

module.exports = ForstaBot;
