<template>
    <div>
        <div v-if="$mq=='smallScreen'">
            <top-menu v-if="global.apiToken && global.onboardStatus" />
            <router-view />
        </div>
        <div v-else>
            <sui-grid>
                <sui-grid-row v-if="global.apiToken && global.onboardStatus" :columns="2">
                    <sui-grid-column :width="2">
                        <side-menu />
                    </sui-grid-column>
                    <sui-grid-column :width="16">
                        <router-view v-if="global.apiToken && global.onboardStatus" />
                    </sui-grid-column>
                </sui-grid-row>
                <sui-grid-row v-else :columns="1">
                    <sui-grid-column>
                        <router-view v-if="!(global.apiToken && global.onboardStatus)"/>
                    </sui-grid-column>
                </sui-grid-row>
            </sui-grid>
        </div>
    </div>
</template>

<script>
shared = require('./globalState');
util = require('./util');
topMenu = require('./menu/top.vue');
bottomMenu = require('./menu/bottom.vue');
sideMenu = require('./menu/side.vue');

module.exports = {
    data: () => ({ 
        global: shared.state
    }),
    methods:{
        authenticateUser: function() {
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
    components: {
        'top-menu': topMenu,
        'bottom-menu': bottomMenu,
        'side-menu': sideMenu
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