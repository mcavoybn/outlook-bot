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

        <sui-form>
            <sui-form-field>
                <label>Find a meeting time that works for everyone based on their outlook calendar.</label>
            </sui-form-field>
        </sui-form>
        <sui-button
            class="blue button pull left"
            content="Start"/>

    </div>
</template>
 
<script>
const util = require('../util');
const shared = require('../globalState');
const graph = require('@microsoft/microsoft-graph-client');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function(){
        },
        getEventList: function() {
            try {
                const start = new Date(this.loadEventsRangeStart + 'T' + '12:00:00AM');
                const end = new Date(this.loadEventsRangeEnd + 'T' + '11:59:00PM');
                shared.graphClient
                .api(`/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
                .get()
                .then(res => {
                    console.log(res);
                    //convert events to proper format and store in the database
                });
            } catch (err) {
                console.log(err);
            }
        },
    },
    data: function() {
        return {
            global: shared.state,
        }
    }
}
</script>