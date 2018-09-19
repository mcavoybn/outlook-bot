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

        </sui-grid>

        <div v-html="calendarView" v-if="calendarView"></div>

        </div>

    </div>
</template>
 
<script>
const util = require('../util');
const graph = require('@microsoft/microsoft-graph-client');
'use strict'
module.exports = {
    mounted: function() {
        console.log('dashboard mounted');
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
                this.getCalendarView();
            }
            //check for a refresh token and use it if available
            const refresh_token = this.$cookies.get('graph_refresh_token');
            if(refresh_token){
                util.fetch.call(this, 'api/outlook/refresh', {headers: {refresh_token}})
                .then(res => this.$cookies.set('graph_access_token', res.theJson));
            }
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
        scheduleEvent: function() {
            try {
                this.graphClient
                .api('/me/events')
                .post({
                    "Subject": "Discuss the Calendar REST API",
                    "Body": {
                        "ContentType": "HTML",
                        "Content": "I think it will meet our requirements!"
                    },
                    "Start": {
                        "DateTime": "2018-09-20T18:00:00",
                        "TimeZone": "Pacific Standard Time"
                    },
                    "End": {
                        "DateTime": "2018-09-22T19:00:00",
                        "TimeZone": "Pacific Standard Time"
                    },
                    "Attendees": [
                        {
                        "EmailAddress": {
                            "Address": "janets@a830edad9050849NDA1.onmicrosoft.com",
                            "Name": "Janet Schorr"
                        },
                        "Type": "Required"
                        }
                    ]
                }, (err, res) => console.log(res));
            } catch (err) {
                console.log(err);
            }
        },
        graphSignOut: function(){
            this.$cookies.remove('graph_access_token');
            this.$cookies.remove('graph_user_name');
            this.$cookies.remove('graph_refresh_token');
            this.$cookies.remove('graph_token_expires');
            this.$router.go();
        },
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
            graphClient: undefined
        }
    }
}
</script>