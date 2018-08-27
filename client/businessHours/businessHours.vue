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

<template lang="html">
    <div class="ui container left aligned">

        <div class="ui basic segment" style="padding-top:5%">
            <h2 class="ui header">
                Business Hours
            </h2>
        </div>

        <sui-divider style="margin-top:5px"/>

        <sui-grid divided="vertically">
            <sui-grid-row>
                <sui-grid-column :width="16">
                    <sui-label 
                        color="teal"
                        pointing="right">Open:</sui-label>
                    <sui-input 
                        format="HH:MM:AM"
                        v-model="businessHoursData.open"
                        type="time"
                        @input="checkForChanges()"/>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <sui-label
                        color="teal"
                        pointing="right">Close:</sui-label>
                    <sui-input 
                        format="HH:MM:AM"
                        v-model="businessHoursData.close"
                        type="time"
                        @input="checkForChanges()"/>
                </sui-grid-column>                
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column>
                    <div class="ui form field">
                        <label>Out of Office Message</label>
                        <textarea 
                        rows="2"
                        v-model="businessHoursData.message"
                        @input="checkForChanges()"></textarea>
                    </div>
                </sui-grid-column>
            </sui-grid-row>
            <sui-grid-row>
                <sui-grid-column>
                    <sui-button 
                        class="ui button pull right" 
                        primary
                        v-if="changesMade"
                        @click="saveData()">
                        Save Changes
                    </sui-button>
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>

        <div>
            <sui-modal v-model="showingSaveChangesModal">
                <sui-modal-header>Save Changes</sui-modal-header>
                <sui-modal-content>
                    <sui-modal-description>
                        <sui-header>Continue without saving changes?</sui-header>
                        <p>Your changes have not been saved.</p>
                    </sui-modal-description>
                </sui-modal-content>
                <sui-modal-actions style="padding:10px">
                    <sui-button 
                        class="yellow" 
                        floated="left"
                        @click="showingSaveChangesModal = false"
                        content="Cancel" />
                    <sui-button 
                        class="red"
                        @click="nextRoute()"
                        content="Don't Save & Continue" />
                    <sui-button 
                        floated="right" 
                        class="green" 
                        @click="saveAndContinue()"
                        content="Save & Continue" />
                </sui-modal-actions>
            </sui-modal>
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
        checkForChanges: function() {
            if(this.changesMade) return;
            if(JSON.stringify(this.businessHoursData) != this.businessHoursDataOriginal){
                this.changesMade = true;
            }
        },
        loadData: function() {
            util.fetch('/api/business-hours/', {method:'get'})
            .then( res => {
                this.businessHoursData = res.theJson;
                this.businessHoursDataOriginal = JSON.stringify(res.theJson);
            });
        },
        saveAndContinue: function() {
            this.saveData();
            this.nextRoute();
        },
        saveData: function() {
            util.fetch('/api/business-hours/', 
            {
                method:'post', 
                body:
                { 
                    businessHoursData: this.businessHoursData 
                }
            });
            this.businessHoursDataOriginal = JSON.stringify(this.businessHoursData);
            this.changesMade = false;
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
    data: () => ({ 
        global: shared.state,
        businessHoursData: {},
        businessHoursDataOriginal: {},
        changesMade: false,
        showingSaveChangesModal: false,
        nextRoute: null
    }),
}
</script>