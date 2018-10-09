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

            <sui-grid>

                <sui-grid-row>
                    <sui-grid-column>
                        Create a new calendar event and send invites to the current distribution.
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row>
                    <sui-grid-column>
                        <sui-label>Subject</sui-label>
                        <sui-input placeholder="Title" v-model="newEvent.subject" />
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row>
                    <sui-grid-column>
                        <sui-label>Body</sui-label>
                        <div class="ui form field">
                            <textarea placeholder="Body" v-model="newEvent.body" rows="5" cols="40"/>
                        </div>
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row>
                    <sui-grid-column>
                        <sui-label>Start</sui-label>
                        <sui-input type="date" format="MM-DD-YYYY" v-model="newEvent.startDate" />
                        <sui-input type="time" format="HH:MM" v-model="newEvent.startTime" />
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row>
                    <sui-grid-column>
                        <sui-label>End</sui-label> 
                        <sui-input type="date" format="MM-DD-YYYY" v-model="newEvent.endDate" />
                        <sui-input type="time" format="HH:MM" v-model="newEvent.endTime" />
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row>
                    <sui-grid-column>
                        <sui-label>Timezone</sui-label>
                    <sui-dropdown
                        placeholder="Timezone"
                        selection
                        :options="timezonesForDropdown"
                        v-model="newEvent.timezone"
                        />
                    </sui-grid-column>
                </sui-grid-row>

                <sui-grid-row>
                    <sui-grid-column>
                        <sui-button 
                            @click="scheduleNewEvent()"
                            color="green"
                            content="Create New Event"/>
                    </sui-grid-column>
                </sui-grid-row>
            </sui-grid>
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
    props: {
        threadId: String,
        distExpr: String
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
            util.fetch('api/outlook/sendEventInvite', {headers:{threadId: this.$props.threadId, distExpr: this.$props.distExpr}})

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