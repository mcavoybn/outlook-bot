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

        <sui-grid-row 
            :columns="1">
            <sui-grid-column class="ui big">
                <a :href="authUrl">
                    <sui-button
                        class="green button pull left"
                        content="Connect to Outlook"
                        @click="outlookConnect()" />
                </a>
                <p v-text="authUrl"></p>
            </sui-grid-column>
        </sui-grid-row>

        </sui-grid>

        </div>

    </div>
</template>
 
<script>
'use strict'
module.exports = {
    mounted: function() {
        console.log('dashboard mounted ! does this log twice?');
        this.loadData();

        // let parms = { title: 'Home', active: { home: true } };

        // const accessToken = await graphUtil.getAccessToken(req.cookies, res);
        // const userName = req.cookies.graph_user_name;

        // if (accessToken && userName) {
        //     parms.user = userName;
        //     parms.debug = `User: ${userName}\nAccess Token: ${accessToken}`;
        // } else {
        //     parms.signInUrl = graphUtil.getAuthUrl();
        //     parms.debug = parms.signInUrl;
        // }
    },
    methods: {
        checkForChanges(){
            if(this.changesMade) return;
            // if(JSON.stringify(this.questions) != this.questionsOriginal){
            //     this.changesMade = true;
            // }
        },
        loadData: function(){
            util.fetch.call(this, 'api/outlook/authUrl').then(res => {
                this.authUrl = res.theJson;
            });
        },
        outlookConnect: function() {
            
        },
        saveAndContinue: function() {
            this.saveData();
            this.nextRoute();
        },
        saveData: function() {
            this.changesMade = false;
            //this.questionsOriginal = JSON.stringify(this.questions);
        },
    },
    beforeRouteLeave: function(to, from, next){
        if(this.changesMade){
            this.showingSaveChangesModal = true;
            this.nextRoute = next;
            next(false);
        }else{
            next();
        }
    },
    data: function() {
        return {
            global: shared.state,
            changesMade: false,
            showingSaveChangesModal: false,
            nextRoute: null,
            authUrl: ''
        }
    }
}
</script>