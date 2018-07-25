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

        <!--  BUSINESS HOURS -->
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
                                v-model="oooEditData.open"
                                type="time"
                                @input="checkForChanges()"/>
                        </div>
                        <div class="ui labeled input">
                            <div style="background-color:#555;color:#fff;" class="ui label">Close:</div>
                            <input format="HH:MM:AM"
                                v-model="oooEditData.close"
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
                            v-model="oooEditData.message"
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
            if(JSON.stringify(this.oooEditData) != this.oooEditDataOriginal){
                this.changesMade = true;
            }
        },
        loadData: function() {
            util.fetch('/api/business-hours', {method:'get'})
            .then( res => {
                this.oooEditData = res.theJson;
                this.oooEditDataOriginal = JSON.stringify(res.theJson);
            });
        },
        saveData: function() {
            util.fetch('/api/business-hours', 
            {
                method:'post', 
                body:
                { 
                    oooEditData: this.oooEditData 
                }
            });
            this.oooEditDataOriginal = JSON.stringify(this.oooEditData);
            this.changesMade = false;
        },
    },
    data: () => ({ 
        global: shared.state,
        oooEditData: {},
        oooEditDataOriginal: {},
        changesMade: false
    }),
}
</script>