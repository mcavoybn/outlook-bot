<style>
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}
div [class*="pull right"] {
  float: right;
  margin-right: 0.25em;
}
a{
    color:#ddd;
}
a:hover{
    color:#aaa;
}
.hover-gray:hover{
    cursor: pointer;
    color:#ddd;
}
.header{
    color:white;
    display:inline;
    vertical-align:middle;
    margin-left:7px;
}
</style>

<template>
    <sui-sidebar
        v-if="global.apiToken"
        style="background-color:#222"
        animation="slide out"
        direction="left"
        visible=true
        width="very wide">

        <img 
            class="logo" 
            src="/static/images/forsta-logo-invert.svg" 
            height="50px"
            width="50px"
            style="padding:8px"
            @click="questions()">
        <h3 class="header" @click="questions()">&nbsp;&nbsp;Forsta Live Chat</h3>
        
        <sui-list divided relaxed size="huge" style="padding:7px; margin-top:50px">
            <sui-list-item @click="questions()">
                <sui-list-icon 
                    class="hover-gray"
                    name="comments" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Questions</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="businessHours()">
                <sui-list-icon 
                    class="hover-gray"
                    name="clock" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Business Hours</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="messageHistory()">
                <sui-list-icon 
                    class="hover-gray"
                    name="cog" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Message History</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="settings()">
                <sui-list-icon 
                    class="hover-gray"  
                    name="archive" 
                    size="large" 
                    vertical-align="middle" 
                    style="color:white" />
                <sui-list-content>
                    <a>Settings</a>
                </sui-list-content>
            </sui-list-item>
            <sui-list-item @click="logout()">
                <sui-list-content>
                    <a>&nbsp;&nbsp;Sign Out</a>
                </sui-list-content>
            </sui-list-item>
        </sui-list>
    </sui-sidebar>
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
        questions: function () {
            this.$router.push({ name: 'questions' });
        },
        settings: function () {
            this.$router.push({ name: 'settings' });
        },
        businessHours: function () {
            this.$router.push({ name: 'businessHours' });
        },
        messageHistory: function () {
            this.$router.push({ name: 'messageHistory' });
        }
    }
}
</script>