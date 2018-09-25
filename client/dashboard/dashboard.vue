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

        <sui-grid 
            style="padding-top:5%;"
            divided="vertically">

            <sui-grid-row 
                :columns="1">
                <sui-grid-column class="ui big" v-if="graphAccessToken && graphUserName">
                    You are now logged in as:
                    <p v-text="graphUserName"></p>
                    <sui-button color="green" @click="graphSignOut()" content="Disconnect From Outlook" />
                </sui-grid-column>
                <sui-grid-column class="ui big" v-else>
                    <a :href="authUrl">
                        <sui-button
                            class="green button pull left"
                            content="Connect to Outlook"/>
                    </a>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row v-if="graphAccessToken">
                <sui-grid-column>
                    <sui-form>
                        <sui-form-field>
                            <label>Subject</label>
                            <input placeholder="Title" v-model="newEvent.subject" >
                        </sui-form-field>
                        <sui-form-field>
                            <label>Body</label>
                            <textarea placeholder="Body" v-model="newEvent.body" />
                        </sui-form-field>
                        <sui-form-field>
                            <label>Start</label>
                            <input type="date" format="MM-DD-YYYY"v-model="newEvent.startDate">
                            <input type="time" format="HH:MM" v-model="newEvent.startTime">
                        </sui-form-field>
                        <sui-form-field>
                            <label>End</label>
                            <input type="date" format="MM-DD-YYYY"v-model="newEvent.endDate">
                            <input type="time" format="HH:MM" v-model="newEvent.endTime">
                        </sui-form-field>
                        <sui-form-field>
                            <label>Timezone</label>
                            <sui-dropdown
                                placeholder="Timezone"
                                selection
                                :options="timezonesForDropdown"
                                v-model="newEvent.timezone"
                            />
                        </sui-form-field>
                    </sui-form>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row v-if="graphAccessToken">
                <sui-button 
                    @click="scheduleNewEvent()"
                    color="green"
                    content="Create New Event"/>
            </sui-grid-row>
        </sui-grid>

    </div>
</template>
 
<script>
const util = require('../util');
const graph = require('@microsoft/microsoft-graph-client');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function(){
            this.getAuthUrl();
            //check for authentication 
            this.graphUserName = this.$cookies.get('graph_user_name');
            this.graphAccessToken = this.getGraphAccessToken();
            if(this.graphAccessToken){
                //we are authenticated, initialize the API client
                this.graphClient = graph.Client.init({
                    authProvider: (done) => {
                        done(null, this.graphAccessToken);
                    }
                });
                this.loadTimezones();
            }
            //check for a refresh token and use it if available
            const refresh_token = this.$cookies.get('graph_refresh_token');
            if(refresh_token){
                util.fetch.call(this, 'api/outlook/refresh', {headers: {refresh_token}})
                .then(res => this.$cookies.set('graph_access_token', res.theJson));
            }

            util.fetch.call(this, 'api/events')
            .then(res => this.events = res.theJson);
        },
        getAuthUrl: function() {
            util.fetch.call(this, 'api/outlook/authUrl')
            .then(res => this.authUrl = res.theJson);
        },
        getCalendarView: function() {
            try {
                const start = new Date(new Date().setHours(0,0,0));
                const end = new Date(new Date(start).setDate(start.getDate() + 7));
                this.graphClient
                .api(`/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
                .header('Prefer', 'outlook.body-content-type="html"')
                .header('Preference-Applied', 'outlook.body-content-type="html"')
                .get()
                .then(res => console.log(res));
            } catch (err) {
                console.log(err);
            }
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
        loadTimezones: function(){
            this.graphClient
            .api('/me/outlook/supportedTimezones')
            .get()
            .then(res => {
                res.value.forEach(timezone => {
                    this.timezonesForDropdown.push({
                        value: timezone.alias,
                        text: timezone.displayName
                    });
                });
                console.log(timezonesForDropdown);
            });
        },
        scheduleNewEvent: function() {
            util.fetch.call(this, 'api/events', {body: this.newEvent, method:'post'});
            let start = new Date(this.newEvent.startDate + 'T' + this.newEvent.startTime);
            let end = new Date(this.newEvent.endDate + 'T' + this.newEvent.endTime);
            try {
                this.graphClient
                .api('/me/events')
                .post({
                    "Subject": this.newEvent.subject,
                    "Body": {
                        "ContentType": "HTML",
                        "Content": this.newEvent.body,
                    },
                    "Start": {
                        "DateTime": start.toISOString(),
                        "TimeZone": this.newEvent.timezone
                    },
                    "End": {
                        "DateTime": end.toISOString(),
                        "TimeZone": this.newEvent.timezone
                    },
                    "Attendees": []
                }, (err, res) => console.log(res));
            } catch (err) {
                console.log(err);
            }
            this.clearForm();
        },
        graphSignOut: function(){
            this.$cookies.remove('graph_access_token');
            this.$cookies.remove('graph_user_name');
            this.$cookies.remove('graph_refresh_token');
            this.$cookies.remove('graph_token_expires');
            this.$router.go();
        },
        clearForm: function(){
            this.newEvent = {
                subject: '',
                body: '',
                startDate: '', 
                startTime: '',
                endDate: '',
                endTime: ''
            };
        }
    },
    data: function() {
        return {
            global: shared.state,
            showingSaveChangesModal: false,
            nextRoute: null,
            authUrl: '',
            graphAccessToken: undefined,
            graphUserName: undefined,
            calendarView: '',
            graphClient: undefined,
            events: {},
            timezonesForDropdown: [],
            newEvent: {
                subject: '',
                body: '',
                startDate: '', 
                startTime: '',
                endDate: '',
                endTime: '',
                timezone: ''
            }
        }
    }
}
</script>