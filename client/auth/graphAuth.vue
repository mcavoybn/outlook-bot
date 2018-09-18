<style>
</style>

<template>
    <div class="ui main text container" style="margin-top: 80px;">

    </div>
</template>

<script>
let util = require('../util');
let shared = require('../globalState');

module.exports = {
    data: function() {
        return {
            code: ""
        }
    },
    mounted: function() {
        console.log('does this happen twce in the fucking console ? ');
        let code = this.$route.query.code;
        let token = util.fetch('api/outlook/token', {headers: {code} } )
        .then(res => {
            console.log(res)
        });
    },
}
</script>