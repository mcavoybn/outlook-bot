<style>
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}
div [class*="pull right"] {
  float: right;
   margin-right: 0.25em;
}
</style>

<template>
    <div class="ui inverted menu" style="z-index: 1;">
        <div class="ui container">
            <router-link :to="{name: 'questions'}" class="header item">
                <img class="logo" src="/static/images/forsta-logo-invert.svg"/>
                &nbsp;&nbsp;Forsta Live Chat
            </router-link>
            <div 
                class="header item float right" 
                style="padding:0px;"
                v-if="global.apiToken">

                <div class="ui simple dropdown item" style="margin-top:7px">
                    <i class="large user icon"></i>
                    <i class="dropdown icon"></i>
                    <div class="menu left">
                        <div class="item" @click="businessHours">
                            <i class="clock icon tiny"></i> Business Hours 
                        </div>
                        <div class="item" @click="messageHistory">
                            <i class="archive icon tiny"></i> Message History 
                        </div>
                        <div class="item" @click="settings">
                            Settings
                        </div>
                        <div class="item" @click="logout">
                            Sign Out
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
shared = require('../globalState');

module.exports = {
    data: () => ({ 
        global: shared.state,
        loggedIn: false
    }),
    methods: {
        logout: function () {
            this.global.apiToken = null;
        },
        settings: function () {
            this.$router.push({ name: 'settings' });
        },
        businessHours: function () {
            this.$router.push({ name: 'businessHours' });
        },
        distributions: function () {
            this.$router.push({ name: 'distributions' });
        },
        messageHistory: function () {
            this.$router.push({ name: 'messageHistory' });
        }
    }
}
</script>