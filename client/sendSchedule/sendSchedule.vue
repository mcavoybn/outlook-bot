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
                    Send in your schedule to find an appropriate meeting time.
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-table>
                        <sui-table-header>
                            <sui-table-header-cell v-text="'StartDate'" />
                            <sui-table-header-cell v-text="'StartTime'" />
                            <sui-table-header-cell v-text="'EndDate'" />
                            <sui-table-header-cell v-text="'EndTime'" />
                            <sui-table-header-cell v-text="'Subject'" />
                            <sui-table-header-cell v-text="'Body'" />
                            <sui-table-header-cell v-text="'Select'" />
                        </sui-table-header>

                        <sui-table-body>
                            <sui-table-row v-for="event in schedule">
                                <sui-table-cell v-text="event.startDate" />
                                <sui-table-cell v-text="event.startTime" />
                                <sui-table-cell v-text="event.endDate" />
                                <sui-table-cell v-text="event.endTime" />
                                <sui-table-cell v-text="event.subject" />
                                <sui-table-cell v-text="event.body" />
                                <sui-table-cell>
                                    <sui-button
                                        content="select"
                                        color="blue"
                                        @click="selectedEvent = event" /> 
                                </sui-table-cell>
                            </sui-table-row>
                        </sui-table-body>
                    </sui-table>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-button 
                        @click="sendSchedule()"
                        color="green" 
                        content="Send Schedule" />
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>

    </div>
</template>
 
<script>
const util = require('../util');
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
        sendSchedule: async function() {
            try {
                let options = {
                    headers: {
                        meetingTimeSearchId: this.$cookies.get('meetingTimeSearchId')
                    }
                }
                let eventData = await util.fetch('api/outlook/getEventData', options);
                const start = new Date(eventData.dateRangeStart + 'T' + '00:00');
                const end = new Date(eventData.dateRangeEnd + 'T' + '12:00');
                shared.graphClient
                .api(`/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
                .get()
                .then(res => {
                    res.value.forEach(event => {
                        let start = moment(event.start.dateTime);
                        let end = moment(event.end.dateTime);
                        this.schedule.push({
                            startDate: start.format('YYYY-MM-DD'),
                            startTime: start.format('HH:MM'),
                            endDate: end.format('YYYY-MM-DD'),
                            endTime: end.format('HH:MM'),
                            subject: event.subject,
                            body: event.bodyPreview
                        });
                    });
                    let options = {
                        header: {
                            meetingTimeSearchId: this.$cookies.get('meetingTimeSearchId')
                        },
                        body: {
                            schedule: this.schedule
                        },
                        method: 'post'
                    };
                    // util.fetch('api/outlook/postSchedule', options);
                });
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
            schedule: []
        }
    }
}
</script>