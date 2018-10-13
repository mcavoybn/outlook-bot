<style>
</style>

<template>
    <div class="ui main text container">
    </div>
</template>

<script>
let util = require('../util');
let shared = require('../globalState');

module.exports = {
    mounted: function() {
        let code = this.$route.query.code;
        util.fetch.call(this, 'api/outlook/token', { headers: { code } } )
        .then( (res) => {
            this.$cookies.set('graph_access_token', res.theJson.access_token, 3600000);
            this.$cookies.set('graph_user_name', res.theJson.user_name, 3600000);
            this.$cookies.set('graph_refresh_token', res.theJson.refresh_token, 3600000);
            this.$cookies.set('graph_token_expires', res.theJson.token_expires, 3600000);
            if(this.$cookies.get('eventId')){
                this.$router.push('scheduleEvent');
            }else {
                this.$router.push('dashboard');
            }
        });
    },
}
</script>