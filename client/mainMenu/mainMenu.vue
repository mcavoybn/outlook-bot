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
                <sui-grid-column>   
                    <sui-button 
                        v-if="!onMainMenu()"
                        content="Back" 
                        color="blue" 
                        @click="back()" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row v-if="isGraphAuthorized() && onMainMenu()">
                <sui-grid-column>
                    Welcome, <span v-text="graphUserName"></span>!<br />
                    You are now connected to your outlook account.
                    <sui-list>
                        <sui-list-item>
                            <sui-button 
                                color="blue" 
                                @click="showingImportExistingEvent = true" 
                                content="Import existing event" />
                        </sui-list-item>
                        <sui-list-item>
                            <sui-button 
                                color="blue" 
                                @click="showingCreateNewEvent = true" 
                                content="Create new event" />
                        </sui-list-item>
                        <sui-list-item>
                            <sui-button 
                                color="blue" 
                                @click="showingFindMutualMeetingTime = true" 
                                content="Find mutual event time" />
                        </sui-list-item>
                    </sui-list>
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

            <sui-grid-row >
                <sui-grid-column>
                    <create-new-event v-if="showingCreateNewEvent"/>
                    <find-mutual-meeting-time v-if="showingFindMutualMeetingTime"/>
                    <import-existing-event v-if="showingImportExistingEvent"/>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row >
                <sui-grid-column>
                    <sui-button
                        @click="signOut()"
                        color="green"
                        content="Sign Out of Forsta" />
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
    },
    components: {
        'create-new-event': require('./createNewEvent.vue'),
        'import-existing-event': require('./importExistingEvent.vue'),
        'find-mutual-meeting-time': require('./findMutualMeetingTime.vue')
    },
    methods: {
        signOut: function (){
            shared.state.apiToken = undefined;
        },
        back: function (){
            this.showingCreateNewEvent = false;
            this.showingFindMutualMeetingTime = false;
            this.showingImportExistingEvent = false;
        },
        isGraphAuthorized: function(){
            return this.graphAccessToken && this.graphUserName;
        },
        onMainMenu: function(){
            return !this.showingCreateNewEvent 
                && !this.showingFindMutualMeetingTime
                && !this.showingImportExistingEvent;
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
                util.fetch('api/outlook/refresh', {headers: {refresh_token}})
                .then(res => this.$cookies.set('graph_access_token', res.theJson));
            }
        },
        getAuthUrl: function() {
            util.fetch('api/outlook/authUrl')
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
            showingCreateNewEvent: false,
            showingFindMutualMeetingTime: false,
            showingImportExistingEvent: false,
            threadId: '',
            distExpr: ''
        }
    }
}
</script>