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
                        <h3>Create New Event</h3>
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
                    <textarea placeholder="Body" v-model="newEvent.body" style="padding-right:35px"/>
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

                <sui-grid-row v-if="scheduleNewEventClicked">
                    <sui-grid-column>
                        <sui-message color="green">
                            <sui-message-header>Event Scheduled!</sui-message-header>
                            <p>
                                This even has been scheduled to your calendar.
                                An invite for this event has been sent to the selected users.
                            </p>
                        </sui-message>
                    </sui-grid-column>
                </sui-grid-row>
            </sui-grid>
    </div>
</template>
 
<script>
const util = require('../util');
const shared = require('../globalState');
const uuid4 = require('uuid/v4');
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
                this.newEvent.timezone = this.timezonesForDropdown[0].value;
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
            let eventId = uuid4();
            let options = {
                body: {
                    eventId,
                    subject: this.newEvent.subject,
                    body: this.newEvent.body,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    timezone: this.newEvent.timezone
                },
                method: 'post'
            }
            util.fetch('api/outlook/postEvent', options)
            .then(this.sendInvite(eventId));
            // this.clearForm();

            this.scheduleNewEventClicked = true;
        },
        sendInvite: function(eventId) {
            let options = {
                headers: {
                    eventId,
                    threadId: this.$cookies.get('threadId'),
                    distExpr: this.$cookies.get('distExpr')
                }
            }
            util.fetch('api/outlook/sendEventInvite', options)
            .then(res => console.log(res));
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
                subject: 'Dummy subject',
                body: 'Dummy body',
                startDate: '2018-10-08', 
                startTime: '04:00',
                endDate: '2018-10-09',
                endTime: '05:00',
                timezone: ''
            },
            scheduleNewEventClicked: false
        }
    }
}
</script>