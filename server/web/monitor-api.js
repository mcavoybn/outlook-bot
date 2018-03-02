
'use strict';

const APIHandler = require('./api').APIHandler;

class VaultAPIv1 extends APIHandler {

    constructor(options) {
        super(options);
        this.router.get('/flagged/v1', this.asyncRoute(this.onGetFlagged));
        this.router.put('/flagged/v1/:id', this.asyncRoute(this.onUpdateFlaggedFeedback));
        this.router.get('/trigger/v1', this.asyncRoute(this.onGetTriggers));
        this.router.post('/trigger/v1', this.asyncRoute(this.onCreateTrigger));
        this.router.put('/trigger/v1/:id', this.asyncRoute(this.onUpdateTrigger));
    }

    async onGetFlagged(req, res, next) {
        console.log('query parameters are', req.query);
        const rows = await this.server.bot.pgStore.getFlagged(req.query);
        res.status(200).json({flagged: rows});
    }

    async onUpdateFlaggedFeedback(req, res, next, userId) {
        const id = req.params.id;
        if (!id) {
            res.status(412).json({
                error: 'missing_arg',
                message: 'Missing URL param: id'
            });
            return;
        }

        const feedback = req.body.feedback;
        if (!feedback) {
            res.status(400).json({ feedback: ['feedback is required'] });
        }

        try {
            const rows = await this.server.bot.updateFlaggedFeedback({id, feedback});
            res.status(200).json({ flagged: rows });
            return;
        } catch (e) {
            console.log('problem in update flagged feedback', e);
            res.status(e.statusCode || 500).json(e.info || { message: 'internal error'});
            return;
        }
    }

    async onGetTriggers(req, res, next) {
        console.log('query parameters are', req.query);
        const rows = await this.server.bot.pgStore.getTriggers(req.query);
        res.status(200).json({triggers: rows});
    }

    async onCreateTrigger(req, res, next, userId) {
        const state = req.body.trigger.state;
        const label = req.body.trigger.label;
        const type = req.body.trigger.type;
        const pattern = req.body.trigger.pattern;
        const iflag = req.body.trigger.iflag;
        const dflag = req.body.trigger.dflag;
        const notify = req.body.trigger.notify;
        const direction = req.body.trigger.direction;

        if (!state) {
            res.status(400).json({ state: ['state is required'] });
            return;
        }
        if (!label) {
            res.status(400).json({ label: ['label is required'] });
            return;
        }
        if (!type) {
            res.status(400).json({ type: ['type is required'] });
            return;
        }
        if (!pattern) {
            res.status(400).json({ pattern: ['pattern is required'] });
            return;
        }
        if (iflag === undefined) {
            res.status(400).json({ iflag: ['iflag is required'] });
            return;
        }
        if (!dflag === undefined) {
            res.status(400).json({ dflag: ['dflag is required'] });
            return;
        }
        if (!notify) {
            res.status(400).json({ notify: ['notify is required'] });
            return;
        }
        if (!direction) {
            res.status(400).json({ direction: ['direction is required'] });
            return;
        }

        try {
            const rows = await this.server.bot.addTrigger({state, label, direction, type, pattern, iflag, dflag, notify, creatorId: userId});
            res.status(200).json({ triggers: rows });
            return;
        } catch (e) {
            console.log('problem in add trigger', e);
            res.status(e.statusCode || 500).json(e.info || { message: 'internal error'});
            return;
        }
    }

    async onUpdateTrigger(req, res, next, userId) {
        const id = req.params.id;

        const state = req.body.trigger.state;
        const label = req.body.trigger.label;
        const type = req.body.trigger.type;
        const pattern = req.body.trigger.pattern;
        const iflag = req.body.trigger.iflag;
        const dflag = req.body.trigger.dflag;
        const notify = req.body.trigger.notify;
        const direction = req.body.trigger.direction;

        if (!id) {
            res.status(400).json({ id: ['id is required'] });
            return;
        }
        if (!state) {
            res.status(400).json({ state: ['state is required'] });
            return;
        }
        if (!label) {
            res.status(400).json({ label: ['label is required'] });
            return;
        }
        if (!type) {
            res.status(400).json({ pattern: ['type is required'] });
            return;
        }
        if (!pattern) {
            res.status(400).json({ pattern: ['pattern is required'] });
            return;
        }
        if (iflag === undefined) {
            res.status(400).json({ pattern: ['iflag is required'] });
            return;
        }
        if (dflag === undefined) {
            res.status(400).json({ pattern: ['dflag is required'] });
            return;
        }
        if (!notify) {
            res.status(400).json({ notify: ['notify is required'] });
            return;
        }
        if (!direction) {
            res.status(400).json({ direction: ['direction is required'] });
            return;
        }

        try {
            const rows = await this.server.bot.updateTrigger({id, state, label, direction, type, pattern, iflag, dflag, notify, creatorId: userId});
            res.status(200).json({ triggers: rows });
            return;
        } catch (e) {
            console.log('problem in update trigger', e);
            res.status(e.statusCode || 500).json(e.info || { message: 'internal error'});
            return;
        }
    }

}


module.exports = {
    VaultAPIv1
};
