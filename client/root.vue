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
        onboardUserIfNotOnboarded: function() {
            util.fetch.call(this, '/api/onboard/status/v1')
            .then(result => { 
                this.global.onboardStatus = result.theJson.status;
                if (this.global.onboardStatus !== 'complete') {
                    this.$router.push({ name: 'welcome' });
                }
            });
        }
    },
    mounted: function() {
        this.onboardUserIfNotOnboarded();
    }
}
</script>