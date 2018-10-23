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
                    <h3>Import Existing Event</h3>
                    Get existing events from outlook based on a given date range.
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row columns="3">
                <sui-grid-column width="5">
                    <sui-label v-text="'Start'" />
                    <sui-input type="date" format="YYYY-MM-DD" v-model="loadEventsRangeStart" />
                </sui-grid-column>
                <sui-grid-column width="5">
                    <sui-label v-text="'End'"/>
                    <sui-input type="date" format="YYYY-MM-DD" v-model="loadEventsRangeEnd" />
                </sui-grid-column>
                <sui-grid-column width="6">
                    <sui-button
                        color="blue"
                        content="Get Events"
                        @click="getEventList()"/>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-table>
                        <sui-table-header>
                            <sui-table-header-cell v-text="'StartDate'" />
                            <sui-table-header-cell v-text="'StartTime'" />
                            <sui-table-header-cell v-text="'EndDate'" />
                            <sui-table-header-cell v-text="'EndTime'" />
                            <sui-table-header-cell v-text="'Subject'" />
                            <sui-table-header-cell v-text="'Body'" />
                            <sui-table-header-cell v-text="'Select'" />
                        </sui-table-header>

                        <sui-table-body>
                            <sui-table-row v-for="event in events">
                                <sui-table-cell v-text="event.startDate" />
                                <sui-table-cell v-text="event.startTime" />
                                <sui-table-cell v-text="event.endDate" />
                                <sui-table-cell v-text="event.endTime" />
                                <sui-table-cell v-text="event.subject" />
                                <sui-table-cell v-text="event.body" />
                                <sui-table-cell>
                                    <sui-button
                                        content="select"
                                        color="blue"
                                        @click="selectedEvent = event" /> 
                                </sui-table-cell>
                            </sui-table-row>
                        </sui-table-body>
                    </sui-table>
                </sui-grid-column>
            </sui-grid-row>

        </sui-grid>

        <sui-grid divided="vertically" v-if="selectedEvent">
            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Subject<h3 v-text="selectedEvent.subject" /></sui-label>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Body</sui-label>
                    <div class="ui form field">
                        <textarea placeholder="Body" v-model="selectedEvent.body" rows="5" cols="40"/>
                    </div>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>Start</sui-label>
                    <span v-text="selectedEvent.startDate" />
                    <span v-text="selectedEvent.startTime" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label>End</sui-label> 
                    <span v-text="selectedEvent.endDate" />
                    <span v-text="selectedEvent.endTime" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-button 
                        @click="scheduleSelectedEvent()"
                        color="green"
                        content="Send Invite to Selected Event"/>
                </sui-grid-column>
            </sui-grid-row>
        </sui-grid>

        

    </div>
</template>
 
<script>
const util = require('../util');
const moment = require('moment');
const graph = require('@microsoft/microsoft-graph-client');
const uuid4 = require('uuid/v4');
'use strict'
module.exports = {
    methods: {
        getEventList: function() {
            try {
                const start = new Date(this.loadEventsRangeStart + 'T' + '00:00');
                const end = new Date(this.loadEventsRangeEnd + 'T' + '12:00')   ;
                shared.graphClient
                .api(`/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
                .get()
                .then(res => {
                    console.log(res.value);
                    res.value.forEach(event => {
                        let start = moment(event.start.dateTime);
                        let end = moment(event.end.dateTime);
                        this.events.push({
                            startDate: start.format('YYYY-MM-DD'),
                            startTime: start.format('HH:MM'),
                            endDate: end.format('YYYY-MM-DD'),
                            endTime: end.format('HH:MM'),
                            subject: event.subject,
                            body: event.bodyPreview
                        });
                    });
                });
            } catch (err) {
                console.log(err);
            }
        },
        scheduleSelectedEvent: function() {
            let start = new Date(this.selectedEvent.startDate + 'T' + this.selectedEvent.startTime);
            let end = new Date(this.selectedEvent.endDate + 'T' + this.selectedEvent.endTime);
            let eventId = uuid4();
            let options = {
                body: {
                    eventId,
                    subject: this.selectedEvent.subject,
                    body: this.selectedEvent.body,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    timezone: this.selectedEvent.timezone
                },
                method: 'post'
            }
            util.fetch('api/outlook/postEvent', options)
            .then(this.sendInvite(eventId));
            // this.clearForm();
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
            this.selectedEvent = undefined;
        }
    },
    data: function() {
        return {
            global: shared.state,
            events: [],
            loadEventsRangeEnd: '',
            loadEventsRangeStart: '',
            timezonesForDropdown: [],
            selectedEvent: undefined
        }
    }
}
</script>