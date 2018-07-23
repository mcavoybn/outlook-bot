<template>
    <div>
        <top-menu />
        <router-view />
        <bottom-menu />
    </div>
</template>

<script>
shared = require('./globalState');
util = require('./util');
topMenu = require('./menu/top.vue');
bottomMenu = require('./menu/bottom.vue');

module.exports = {
    data: () => ({ 
        global: shared.state
    }),
    methods:{
        authenticateUser: function() {
            util.fetch.call(this, '/api/auth/status/v1')
            .then(result => { this.global.passwordSet = result.ok; });

            if (this.global.onboardStatus !== 'complete') {
                this.$router.push({ name: 'welcome' });
                return;
            }
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
        },
    },
    components: {
        'top-menu': topMenu,
        'bottom-menu': bottomMenu
    },
    computed: {
        globalApiToken: function() { return this.global.apiToken; },
    },
    watch: {
        globalApiToken: function (next, prev) {
            if (!next && prev) {
                console.log('reauthenticating for', this.$route.path)
                this.$router.push({ name: 'loginTag', query: { forwardTo: this.$route.path }});
            }
        }
    },
    mounted: function() {
        this.authenticateUser();
        
    }
}
</script>