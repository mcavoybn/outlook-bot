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
                    <label>Subject</label>
                    <input placeholder="Title" v-model="newEvent.subject" >
                </sui-form-field>
                <sui-form-field>
                    <label>Body</label>
                    <textarea placeholder="Body" v-model="newEvent.body" />
                </sui-form-field>
                <sui-form-field>
                    <label>Start</label>
                    <input type="date" format="MM-DD-YYYY" v-model="newEvent.startDate">
                    <input type="time" format="HH:MM" v-model="newEvent.startTime">
                </sui-form-field>
                <sui-form-field>
                    <label>End</label> 
                    <input type="date" format="MM-DD-YYYY" v-model="newEvent.endDate">
                    <input type="time" format="HH:MM" v-model="newEvent.endTime">
                </sui-form-field>
                <sui-form-field>
                    <label>Timezone</label>
                    <sui-dropdown
                        placeholder="Timezone"
                        selection
                        :options="timezonesForDropdown"
                        v-model="newEvent.timezone"
                    />
                </sui-form-field>
            </sui-form>

            <sui-button 
                @click="scheduleNewEvent()"
                color="green"
                content="Create New Event"/>

    </div>
</template>
 
<script>
const util = require('../util');
const graph = require('@microsoft/microsoft-graph-client');
const shared = require('../globalState');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function(){
            this.loadTimezones();
        },
        loadTimezones: function(){
            shared.graphClient
            .api('/me/outlook/supportedTimezones')
            .get()
            .then(res => {
                res.value.forEach(timezone => {
                    this.timezonesForDropdown.push({
                        value: timezone.alias,
                        text: timezone.displayName
                    });
                });
            });
        },
        scheduleNewEvent: function() {
            let start = new Date(this.newEvent.startDate + 'T' + this.newEvent.startTime);
            let end = new Date(this.newEvent.endDate + 'T' + this.newEvent.endTime);
            try {
                shared.graphClient
                .api('/me/events')
                .post({
                    "Subject": this.newEvent.subject,
                    "Body": {
                        "ContentType": "HTML",
                        "Content": this.newEvent.body,
                    },
                    "Start": {
                        "DateTime": start.toISOString(),
                        "TimeZone": this.newEvent.timezone
                    },
                    "End": {
                        "DateTime": end.toISOString(),
                        "TimeZone": this.newEvent.timezone
                    },
                    "Attendees": []
                }, (err, res) => console.log(res));
            } catch (err) {
                console.log(err);
            }
            this.clearForm();
        },
        clearForm: function(){
            this.newEvent = {
                subject: '',
                body: '',
                startDate: '', 
                startTime: '',
                endDate: '',
                endTime: ''
            };
        }
    },
    data: function() {
        return {
            global: shared.state,
            timezonesForDropdown: [],
            newEvent: {
                subject: '',
                body: '',
                startDate: '', 
                startTime: '',
                endDate: '',
                endTime: '',
                timezone: ''
            },
        }
    }
}
</script>