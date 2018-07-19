<style>
.hover-red:hover{
    color:red;
}
.hover-blue:hover{
    color:blue;
}
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
                    <sui-table-headerCell
                        @click="toggleDisplayed()">
                        <sui-icon
                            class="item link"
                            name="dropdown"
                            size="large"
                            v-if="displayed"/>
                        <sui-icon
                            class="item link"
                            name="caret right"
                            size="large"
                            v-else />
                        <span>Business Hours</span>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>


            <sui-table-body v-if="displayed">
                <sui-table-row> 
                    <sui-table-cell>
                        <div class="ui labeled input">
                            <div class="ui label">Open:</div>
                            <input format="HH:MM:AM"
                                :value="oooEditData"
                                v-model="oooEditData.open"
                                type="time"/>
                        </div>
                        <div class="ui labeled input">
                            <div class="ui label">Close:</div>
                            <input format="HH:MM:AM"
                                :value="oooEditData" 
                                v-model="oooEditData.close"
                                type="time"/>
                        </div>
                    </sui-table-cell>
                </sui-table-row>
                <sui-table-row>
                    <sui-table-cell>
                        <div class="ui form field">
                            <label>Out of Office Message</label>
                            <textarea 
                            rows="2"
                            v-model="oooEditData.message"></textarea>
                        </div>
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

            <sui-table-footer>
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
        loadData: function() {
            util.fetch('/api/business-hours', {method:'get'})
            .then( res => {
                this.oooEditData = res.theJson;
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
        },
        toggleDisplayed: function() {
            this.displayed = !this.displayed;
        }
    },
    data: () => ({ 
        global: shared.state,
        displayed: true,
        oooEditData: {},
    }),
}
</script>