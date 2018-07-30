'use strict';

const BotAtlasClient = require('./atlas_client');
const cache = require('./cache');
const relay = require('librelay');
const uuid4 = require('uuid/v4');
const moment = require('moment');
const words = require("./authwords");

const AUTH_FAIL_THRESHOLD = 10;

class ForstaBot {

    async start() {
        const ourId = await relay.storage.getState('addr');
        if (!ourId) {
            console.warn("bot is not yet registered");
            return;
        }
        this.atlas = await BotAtlasClient.factory();
        this.getUsers = cache.ttl(60, this.atlas.getUsers.bind(this.atlas));
        this.resolveTags = cache.ttl(60, this.atlas.resolveTags.bind(this.atlas));
        this.msgReceiver = await relay.MessageReceiver.factory();
        this.msgReceiver.addEventListener('keychange', this.onKeyChange.bind(this));
        this.msgReceiver.addEventListener('message', ev => this.onMessage(ev), null);
        this.msgReceiver.addEventListener('error', this.onError.bind(this));
        this.msgSender = await relay.MessageSender.factory();
        await this.msgReceiver.connect();

        let secret = await relay.storage.get('authentication', 'jwtsecret');
        console.log(secret);
        
        this.waitingForResponse = false;
    }

    async onMessage(ev) {
        let msg = this.parseEv(ev);
        if(!msg) console.error("Received unsupported message!");
        const dist = await this.resolveTags(msg.distribution.expression);
        console.log('msg.distribution.expression');
        console.log(msg.distribution.expression);
        console.log('dist : ');
        console.log(dist);
        const threadId = msg.threadId;
        const msgTxt = msg.data.body[0].value;

        if(msgTxt == "init"){
            this.sendMessage(dist, threadId, "Initializing question set!");
            this.businessHours = await relay.storage.get('live-chat-bot', 'business-hours');
            this.questions = await relay.storage.get('live-chat-bot', 'questions');
            this.currentQuestion = this.questions[0];
            if(this.outOfOffice()){
                this.sendMessage(dist, threadId, this.businessHours.message);
            }
        }

        if(this.waitingForResponse){
            this.handleResponse(msgTxt, dist, threadId, msg.sender.userId);
        }
        
        if(!this.questions){
            this.sendMessage(dist, threadId, "Question set not initialized, type 'init' to initialize");
        }else{
            this.sendMessage(dist, threadId, this.currentQuestion.prompt)
                .then(msg => {
                    if(this.currentQuestion.type == 'Free Response') return;
                    let promptId = JSON.parse(msg.message.dataMessage.body)[0].messageId;
                    this.currentQuestion.responses.forEach( (response, index) =>{
                        this.sendResponse(dist, threadId, promptId,`[${index+1}] - ${response.text}`);
                    });
                });
            this.waitingForResponse = true;
        }
    }

    async handleResponse(msgTxt, dist, threadId, userId){
        let response = {};

        if(this.currentQuestion.type == 'Free Response'){
            let currentQuestionIndex = this.questions.indexOf(this.currentQuestion);
            if(currentQuestionIndex == this.questions.length - 1){
                response.action = 'End of Question Set';   
            }else{
                response.action = 'Forward to Question';
                response.actionOption = 'Question ' + (currentQuestionIndex + 2); 
            }
            response.text = msgTxt;
        }else{
            let responseIndex = -1;
            try{
                responseIndex = Number(msgTxt);
            }catch(error){
                console.log(`Error parsing user response:${error}`);
                this.sendMessage(dist, threadId, `Invalid response - non-number detected`);
                return;
            }
            if(responseIndex > this.currentQuestion.responses.length || responseIndex < 0){
                this.sendMessage(dist, threadId, `Invalid response - response number not available`);
                return;
            }
            response = this.currentQuestion.responses[responseIndex-1];
        }

        if(response.action == "Forward to Distribution")
        {
            this.sendMessage(dist, threadId, `Forwarding to Distribution ${response.actionOption}`);
            this.questions = null;
        }
        else if(response.action == "Forward to User")
        {
            this.sendMessage(dist, threadId, `Forwarding to User ${response.actionOption}`);
            this.questions = null;
        }
        else if(response.action == "Forward to Question")
        {
            let questionNumber = Number(response.actionOption.split(' ')[1]);
            this.currentQuestion = this.questions[questionNumber-1];
        }
        else if(response.action == "End of Question Set")
        {
            this.sendMessage(dist, threadId, `End of question set!`);
            this.questions = null;
        }
        else if(!response.action)
        {
            this.sendMessage(dist, threadId, `ERROR: response action not configured !`);
            response.action = 'ERROR response action not configured !';
            response.text = 'ERROR response action not configured !';
            this.questions = null;
        }
        
        this.saveToMessageHistory(response, userId);
        this.waitingForResponse = false;
    }

    async saveToMessageHistory(response, userId) {
        let messageData = {
            user: userId,
            prompt: this.currentQuestion.prompt,
            response: response.text,
            action: response.action,
            date: moment().format('MM/DD/YYYY'),
            time: moment().format('hh:mm:ss')
        };
        let messageHistory = (await relay.storage.get('live-chat-bot', 'message-history')) || [];
        messageHistory.push(messageData);
        relay.storage.set('live-chat-bot', 'message-history', messageHistory);
    }

    outOfOffice(){
        let hours = moment().hours();
        let mins = moment().minutes();
        let openHours = Number(this.businessHours.open.split(':')[0]);
        let openMins = Number(this.businessHours.open.split(':')[1]);
        let closeHours = Number(this.businessHours.close.split(':')[0]);
        let closeMins = Number(this.businessHours.close.split(':')[1]);

        if(openHours > closeHours) closeHours += 24;

        if( (hours < openHours) || (hours == openHours && mins < openMins) ){
            return true;
        }
        if( (hours > closeHours) || (hours == closeHours && mins > closeMins) ){
            return true;
        }
        return false;
    }

    parseEv(ev){
        const message = ev.data.message;
        const msgEnvelope = JSON.parse(message.body);
        let msg;
        for (const x of msgEnvelope) {
            if (x.version === 1) {
                msg = x;
                break;
            }
        }
        return msg;
    }

    async sendMessage(dist, threadId, text){
        return this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            html: `${ text }`,
            text: text
        });
    }

    sendResponse(dist, threadId, msgId, text){
        this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            messageRef: msgId,
            html: `${ text }`,
            text: text
        });
    }

    stop() {
        if (this.msgReceiver) {
            console.warn("Stopping message receiver");
            this.msgReceiver.close();
            this.msgReceiver = null;
        }
    }

    async restart() {
        this.stop();
        await this.start();
    }

    async onKeyChange(ev) {
        console.warn("Auto-accepting new identity key for:", ev.addr);
        await ev.accept();
    }

    onError(e) {
        console.error('Message Error', e, e.stack);
    }

    fqTag(user) { 
        return `@${user.tag.slug}:${user.org.slug}`; 
    }

    fqName(user) {
        const fqInfo = [user.first_name, user.middle_name, user.last_name]; 
        return fqInfo.map(s => (s || '').trim()).filter(s => !!s).join(' '); 
    }

    fqLabel(user) { 
        return `${this.fqTag(user)} (${this.fqName(user)})`; 
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
            console.log(auth, resolved);
            this.msgSender.send({
                distribution: resolved,
                threadTitle: 'Message Bot Login',
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
        console.log(userId, code);
        let pending = await relay.storage.get('authentication', 'pending', {});
        pending = this.removeExpiredAuthCodes(pending);
        const auth = pending[userId];
        if (!auth) {
            throw { statusCode: 403, info: { code: ['no authentication pending, please start over'] } }; 
        }
        if (auth.code != code) {
            this.incrementAuthFailCount();
            await relay.util.sleep(.5); // throttle guessers
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
}

module.exports = ForstaBot;