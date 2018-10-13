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

            <sui-grid-row>
                <sui-grid-column v-text="event.subject" />   
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column v-text="event.body" />   
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column v-text="event.start" />   
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column v-text="event.end" />   
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column v-text="event.timezone" />   
            </sui-grid-row>

            <sui-grid-row v-if="isGraphAuthorized()">
                <sui-grid-column>
                    <sui-button 
                        color="green" 
                        content="Schedule this event" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row v-if="!isGraphAuthorized()">
                <sui-grid-column>
                    <a :href="authUrl">
                        <sui-button
                            class="green button pull left"
                            content="Connect to Outlook"/>
                    </a>
                </sui-grid-column>
            </sui-grid-row>

        </sui-grid>

    </div>
</template>
 
<script>
const util = require('../util');
const graph = require('@microsoft/microsoft-graph-client');
const shared = require('../globalState.js');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
        this.$cookies.set('eventId', this.$query.eventId);
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
            .then(res => this.event = res.theJson);
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
            authUrl: '',
            graphAccessToken: undefined,
            graphUserName: undefined,
            graphClient: undefined,
            eventId: '',
            event: {
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