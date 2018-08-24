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
        this.ourId = await relay.storage.getState('addr');
        if (!this.ourId) {
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

        this.threadStatus = {};
        this.outgoingThreadId = uuid4();
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

    async onMessage(ev) {
        let msg = this.parseEv(ev);
        if(!msg) console.error("Received unsupported message!");

        if(!this.threadStatus[msg.threadId]){ //initialize
            let businessHours = await relay.storage.get('live-chat-bot', 'business-hours');
            if(businessHours && this.outOfOffice(businessHours)){
                this.sendMessage(dist, msg.threadId, businessHours.message);
            }
            let questions = await relay.storage.get('live-chat-bot', 'questions');
            this.threadStatus[msg.threadId] = {
                questions,
                currentQuestion: questions[0],
                waitingForDistTakeover: null,
                waitingForResponse: null
            };
        }

        const dist = await this.resolveTags(msg.distribution.expression);
        if(msg.data.action 
        && this.threadStatus[msg.data.action] 
        && this.threadStatus[msg.data.action].waitingForDistTakeover){
            this.handleDistTakeover(msg, dist);
            return;
        }else if(this.threadStatus[msg.threadId].waitingForResponse){
            let validResponse = await this.handleResponse(msg, dist);
            if(!validResponse) return;
        }

        if(this.threadStatus[msg.threadId].currentQuestion.type == 'Free Response') return;
        this.threadStatus[msg.threadId].waitingForResponse = true;
        let actions = this.threadStatus[msg.threadId].currentQuestion.responses.map( (response, index) => {
            return {title: response.text, color: this.lowercaseFirst(response.color), action: index};
        });
        this.sendActionMessage(
            dist, 
            msg.threadId,
            this.threadStatus[msg.threadId].currentQuestion.prompt, 
            actions
        );
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

    async handleDistTakeover(msg, forwardingDist){
        let threadId = msg.data.action;
        let chatUserTagId = this.threadStatus[threadId].waitingForDistTakeover.userTagId;
        let distMemberUser = await this.atlas.fetch(`/v1/user/${msg.sender.userId}/`);
        let newDist = await this.resolveTags(`(<${chatUserTagId}>+<${distMemberUser.tag.id}>)`);
        this.sendMessage(
            newDist, 
            msg.data.action, 
            `You are now connected with ${this.fqName(distMemberUser)}`,
        );
        this.threadStatus[threadId].waitingForDistTakeover = false;
        forwardingDist.userids = forwardingDist.userids.filter(id => id != distMemberUser.id);
        this.sendResponse(
            forwardingDist, 
            this.outgoingThreadId, 
            this.threadStatus[threadId].waitingForDistTakeover.msgId, 
            `Taken by ${this.fqName(distMemberUser)}`
        );
        this.threadStatus[threadId] = null;
    }

    async handleResponse(msg, dist){
        let response = this.parseResponse(msg, this.threadStatus[msg.threadId]);  
        if(!response.action){
            this.sendMessage(dist, msg.threadId, `ERROR: response action not configured !`);
            this.questions = undefined;
            return;
        }

        const users = await this.getUsers(dist.userids);
        this.saveToMessageHistory(response, msg);
        this.threadStatus[msg.threadId].waitingForResponse = false;
        if(response.action == "Forward to Tag")
        {
            this.sendMessage(
                dist, 
                msg.threadId, 
                `A member of our team will be with you shortly.`
            );
            let botTagId = users.filter(u => u.id === this.ourId)[0].tag.id;
            let forwardingDist = await this.resolveTags(`(<${response.tagId}>+<${botTagId}>)`);
            if(!forwardingDist){
                this.sendMessage(dist, msg.threadId, `Whoops! There was an error.`);
                console.log('ERROR: response tagId configured to a non-existent tag');
                return;
            }
            let forwardingToDistMsg = await this.sendActionMessage(
                forwardingDist, 
                this.outgoingThreadId, 
                `A live chat user is trying to get in touch with you. Respond to take over the chat.`,
                [{title:'Connect', action: msg.threadId, color:'blue'}],
                'Incoming Live Chat Calls'
            );
            this.threadStatus[msg.threadId].waitingForDistTakeover = {
                userTagId: users.filter(u => u.id !== this.ourId)[0].tag.id,
                msgId: JSON.parse(forwardingToDistMsg.message.dataMessage.body)[0].messageId
            };
            return;
        }
        else if(response.action == "Forward to Question")
        {
            let questionNumber = Number(response.actionOption.split(' ')[1]);
            this.threadStatus[msg.threadId].currentQuestion = this.threadStatus[msg.threadId].questions[questionNumber-1];
        }
        else if(response.action == "End of Question Set")
        {
            this.sendMessage(dist, msg.threadId, `End of question set!`);
            this.threadStatus[msg.threadId] = undefined;
        }
        return true;
    }

    parseResponse(msg){
        if(this.threadStatus[msg.threadId].currentQuestion.type == 'Free Response'){
            let response = {};
            let currentQuestionIndex = this.threadStatus[msg.threadId].questions.indexOf(this.threadStatus[msg.threadId].currentQuestion);
            if(currentQuestionIndex == this.questions.length - 1){
                response.action = 'End of Question Set';   
            }else{
                response.action = 'Forward to Question';
                response.actionOption = 'Question ' + (currentQuestionIndex + 2); 
            }
            return response;
        }else{
            let responseNumber = Number(msg.data.action);
            if(responseNumber > this.threadStatus[msg.threadId].currentQuestion.responses.length - 1 || responseNumber < 0){
                return undefined;
            }
            return this.threadStatus[msg.threadId].currentQuestion.responses[responseNumber];
        }
    }

    async saveToMessageHistory(response, msg) {
        const dateNow = moment().format('MM/DD/YYYY');
        const timeNow = moment().format('hh:mm:ss');
        let userSlug = (await this.atlas.fetch(`/v1/user/${msg.sender.userId}/`)).tag.slug;
        let messageData = {
            user: {
                id: msg.sender.userId,
                slug: userSlug
            },
            prompt: this.threadStatus[msg.threadId].currentQuestion.prompt,
            response: response.text,
            action: response.action,
            date: dateNow,
            time: timeNow
        };
        let messageHistory = (await relay.storage.get('live-chat-bot', 'message-history')) || {};
        if(!messageHistory[msg.threadId]){
            messageHistory[msg.threadId] = {
                date: dateNow,
                time: timeNow,
                user: {
                    id: msg.sender.userId,
                    slug: userSlug
                },
                messages: []
            };
        }
        messageHistory[msg.threadId].messages.push(messageData);
        relay.storage.set('live-chat-bot', 'message-history', messageHistory);
    }

    lowercaseFirst(str){
        return str.charAt(0).toLowerCase() + str.slice(1, str.length);
    }

    outOfOffice(businessHours){
        let hoursNow = moment().hours();
        let minsNow = moment().minutes();
        let openHours = Number(businessHours.open.split(':')[0]);
        let openMins = Number(businessHours.open.split(':')[1]);
        let closeHours = Number(businessHours.close.split(':')[0]);
        let closeMins = Number(businessHours.close.split(':')[1]);

        if(openHours > closeHours) closeHours += 24;
        if( (hoursNow < openHours) || (hoursNow == openHours && minsNow < openMins) ){
            return true;
        }
        if( (hoursNow > closeHours) || (hoursNow == closeHours && minsNow > closeMins) ){
            return true;
        }
        return false;
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

    async sendMessage(dist, threadId, text){
        return this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            html: `${ text }`,
            text: text
        });
    }

    sendArchiveThreadMessage(dist, threadId){
        this.msgSender.send({
            messageType: 'control',
            distribution: dist,
            threadId: threadId,
            data: {
                control: 'threadArchive'
            }
        });
    }

    sendResponse(dist, threadId, msgId, text){
        this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            messageRef: msgId,
            html: `${ text }`,
            text: text,
        });
    }

    sendActionMessage(dist, threadId, text, actions, threadTitle){
        let title = threadTitle || '';
        return this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            html: `${ text }`,
            text: text,
            actions, 
            threadTitle: title
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