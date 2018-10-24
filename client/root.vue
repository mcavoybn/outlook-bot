<template>
    <router-view />
</template>

<script>
'use strict'
const shared = require('./globalState');
const util = require('./util');

module.exports = {
    data: () => ({ 
        global: shared.state
    }),
    methods:{ 
        authenticateUser: function() {
            if(this.$route.query.distExpr) this.$cookies.set('distExpr', this.$route.query.distExpr);
            if(this.$route.query.threadId) this.$cookies.set('threadId', this.$route.query.threadId);
            if(this.$route.query.eventId) this.$cookies.set('eventId', this.$route.query.eventId);
            if(this.$route.query.meetingTimeSearchId) this.$cookies.set('meetingTimeSearchId', this.$route.query.meetingTimeSearchId);

            util.fetch.call(this, '/api/auth/status/v1')
            .then(result => { this.global.passwordSet = result.ok; });
            
            util.fetch.call(this, '/api/onboard/status/v1')
            .then(result => { 
                this.global.onboardStatus = result.theJson.status;
                if (this.global.onboardStatus !== 'complete') {
                    this.$router.push({ name: 'welcome' });
                }
            });
            if (!this.global.apiToken) {
                this.$router.push({ name: 'loginTag', query: { forwardTo: this.$router.path }});
                return;
            }
        }
    },
    computed: {
        globalApiToken: function() { return this.global.apiToken; },
    },
    watch: {
        globalApiToken: function (next, prev) {
            if (!next && prev) {
                console.log('reauthenticating for', this.$route.path);
                this.$router.push({ name: 'loginTag', query: { forwardTo: this.$route.path }});
            }
        }
    },
    mounted: function() {
        this.authenticateUser();
    }
}
</script>