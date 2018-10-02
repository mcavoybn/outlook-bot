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
                <label>Get existing events from outlook</label>
            </sui-form-field>
            <sui-form-field>
                <label>Start</label>
                <input type="date" format="MM-DD-YYYY" v-model="loadEventsRangeStart">
            </sui-form-field>
            <sui-form-field>
                <label>End</label>
                <input type="date" format="MM-DD-YYYY" v-model="loadEventsRangeEnd">
            </sui-form-field>
        </sui-form>
        <sui-button
            class="blue button pull left"
            content="Get Events"
            @click="getEventList()"/>

    </div>
</template>
 
<script>
const util = require('../util');
const graph = require('@microsoft/microsoft-graph-client');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function(){
        },
        loadTimezones: function(){
            this.graphClient
            .api('/me/outlook/supportedTimezones')
            .get()
            .then(res => {
                res.value.forEach(timezone => {
                    this.timezonesForDropdown.push({
                        value: timezone.alias,
                        text: timezone.displayName
                    });
                });
                console.log(timezonesForDropdown);
            });
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
            events: {},
            loadEventsRangeEnd: '',
            loadEventsRangeStart: '',
            timezonesForDropdown: []
        }
    }
}
</script>