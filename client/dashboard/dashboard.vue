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
                <sui-button
                    class="green button pull left"
                    content="Connect to Outlook"
                    @click="outlookConnect()" />
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
        this.loadData();
    },
    methods: {
        checkForChanges(){
            if(this.changesMade) return;
            // if(JSON.stringify(this.questions) != this.questionsOriginal){
            //     this.changesMade = true;
            // }
        },
        loadData: function(){

        },
        outlookConnect: function() {
            util.fetch('api/outlook/authUrl')
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
        }
    }
}
</script>