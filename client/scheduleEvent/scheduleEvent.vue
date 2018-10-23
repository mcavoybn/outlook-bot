<style>
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}
div [class*="pull right"] {
  float: right;
   margin-right: 0.25em;
}
.flexbox {
    display: flex;
    flex: 1;
    margin-right:0.5em;
}
</style>
 
<template lang="html">
    <div class="ui container left aligned">

        <sui-grid divided="vertically">
            <sui-grid-row v-if="!isGraphAuthorized()">
                <sui-grid-column>
                    <a :href="authUrl">
                        <sui-button
                            color="green"
                            content="Connect to Outlook"/>
                    </a>
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>

        <sui-grid 
            style="padding-top:5%;"
            divided="vertically"
            v-if="isGraphAuthorized()">

            <sui-grid-row>
                <sui-grid-column>
                    Schedule an event which you have been sent
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Subject</sui-label>
                    <span v-text="event.subject" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Body</sui-label>
                    <span v-text="event.body" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Start Date</sui-label>
                    <span v-text="event.startDate" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Start Time</sui-label>
                    <span v-text="event.startTime" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>End Date</sui-label> 
                    <span v-text="event.endDate" />
                </sui-grid-column>
            </sui-grid-row>


            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>End Time</sui-label> 
                    <span v-text="event.endTime" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Timezone</sui-label> 
                    <span v-text="event.timezone" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-button 
                        @click="scheduleNewEvent()"
                        color="green" 
                        content="Schedule this event" />
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>

    </div>
</template>
 
<script>
const util = require('../util');
const graph = require('@microsoft/microsoft-graph-client');
const shared = require('../globalState.js');
const moment = require('moment');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        isGraphAuthorized: function(){
            return this.graphAccessToken && this.graphUserName;
        },
        loadData: function(){
            this.getAuthUrl();
            //check for authentication 
            this.graphUserName = this.$cookies.get('graph_user_name');
            this.graphAccessToken = this.getGraphAccessToken();
            if(this.graphAccessToken){
                //we are authenticated, initialize the API client
                shared.graphClient = graph.Client.init({
                    authProvider: (done) => {
                        done(null, this.graphAccessToken);
                    }
                });
            }
            //check for a refresh token and use it if available
            const refresh_token = this.$cookies.get('graph_refresh_token');
            if(refresh_token){
                util.fetch.call(this, 'api/outlook/refresh', {headers: {refresh_token}})
                .then(res => this.$cookies.set('graph_access_token', res.theJson));
            }
            let options = {
                headers: { 
                    eventId: this.$cookies.get('eventId')
                }
            };
            util.fetch.call(this, 'api/outlook/getEvent', options)
            .then(res => {
                this.event = res.theJson;
                let startMoment = moment(this.event.start);
                let endMoment = moment(this.event.end);
                this.event.startDate = startMoment.format('MM-DD-YYYY');
                this.event.startTime = startMoment.format('HH:MM');
                this.event.endDate = endMoment.format('MM-DD-YYYY');
                this.event.endTime = endMoment.format('HH:MM');
            });
        },
        scheduleNewEvent: function() {
            this.$cookies.remove('eventId');
            try {
                shared.graphClient
                .api('/me/events')
                .post({
                    "Subject": this.event.subject,
                    "Body": {
                        "ContentType": "HTML",
                        "Content": this.event.body,
                    },
                    "Start": {
                        "DateTime": this.event.start,
                        "TimeZone": this.event.timezone
                    },
                    "End": {
                        "DateTime": this.event.end,
                        "TimeZone": this.event.timezone
                    },
                    "Attendees": []
                }, (err, res) => console.log(res));
            } catch (err) {
                console.log(err);
            }
        },
        getAuthUrl: function() {
            util.fetch.call(this, 'api/outlook/authUrl')
            .then(res => this.authUrl = res.theJson);
        },
        getGraphAccessToken: function(){
            let token = this.$cookies.get('graph_access_token');
            const five_minutes = 300000;
            const expiration = new Date(parseFloat(this.$cookies.get('graph_token_expires') - five_minutes));
            if(token && expiration > new Date()){
                return token;
            }
            return null;
        },
    },
    data: function() {
        return {
            global: shared.state,
            authUrl: '',
            graphAccessToken: undefined,
            graphUserName: undefined,
            graphClient: undefined,
            eventId: '',
            event: {
                eventId: '',
                subject: '',
                body: '',
                start: '',
                startDate: '',
                startTime: '',
                end: '',
                endDate: '',
                endTime: '',
                timezone: ''
            }
        }
    }
}
</script>