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
    <div class="ui container center aligned">

        <div class="ui basic segment huge">
            <h1 class="ui header">
                <i class="clock icon"></i>
                Live Chat Business Hours
            </h1>
        </div>

        <sui-table
            class="ui left aligned table"
            color="grey">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-headerCell>
                        <span>Business Hours</span>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>


            <sui-table-body>
                <sui-table-row> 
                    <sui-table-cell>
                        <div class="ui labeled input">
                            <div style="background-color:#555;color:#fff;" class="ui label">Open:</div>
                            <input format="HH:MM:AM"
                                v-model="businessHoursData.open"
                                type="time"
                                @input="checkForChanges()"/>
                        </div>
                        <div class="ui labeled input">
                            <div style="background-color:#555;color:#fff;" class="ui label">Close:</div>
                            <input format="HH:MM:AM"
                                v-model="businessHoursData.close"
                                type="time"
                                @input="checkForChanges()"/>
                        </div>
                    </sui-table-cell>
                </sui-table-row>
                <sui-table-row>
                    <sui-table-cell>
                        <div class="ui form field">
                            <label>Out of Office Message</label>
                            <textarea 
                            rows="2"
                            v-model="businessHoursData.message"
                            @input="checkForChanges()"></textarea>
                        </div>
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

            <sui-table-footer v-if="changesMade">
                <sui-table-row>
                    <sui-table-headerCell>
                        <sui-button 
                            class="ui button pull right" 
                            primary
                            @click="saveData()">
                            Save Changes
                        </sui-button>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>

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