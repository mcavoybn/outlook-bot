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
                    <h3>Find Mutual Meeting Time</h3>
                    Find a mutual meeting time based on the current distribution,a given date range and event duration.
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-label>Subject</sui-label>
                <sui-input placeholder="Title" v-model="eventData.subject" />
            </sui-grid-row>
            
            <sui-grid-row>
                <sui-label>Body</sui-label>
                <div class="ui form field">
                    <textarea placeholder="Body" v-model="eventData.body" style="padding-right:35px"/>
                </div>
            </sui-grid-row>
            
            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Range Start'" />
                    <sui-input type="date" format="YYYY-MM-DD" v-model="eventData.dateRangeStart" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Range End'"/>
                    <sui-input type="date" format="YYYY-MM-DD" v-model="eventData.dateRangeEnd" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Event Duration'"/>
                    <sui-input type="number" step="0.25" min="0.25" v-model="eventData.duration" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-button
                        color="green"
                        content="Start search"
                        @click="startSearch()"/>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    List of users and their schedule submission status goes here.
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-table>
                        <sui-table-header>
                            <sui-table-header-cell v-text="'Start'" />
                            <sui-table-header-cell v-text="'End'" />
                            <sui-table-header-cell v-text="'Select'" />
                        </sui-table-header>

                        <sui-table-body>
                            <sui-table-row v-for="possibleEvent in possibleEvents">
                                <sui-table-cell v-text="possibleEvent.start.format('MM/DD/YYYY HH:MM')" />
                                <sui-table-cell v-text="possibleEvent.end.format('MM/DD/YYYY HH:MM')" />
                                <sui-table-cell>
                                    <sui-button
                                        content="Select"
                                        @click="selectedEvent = possibleEvent" />
                                </sui-table-cell>
                            </sui-table-row>
                        </sui-table-body>
                    </sui-table>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-button 
                        @click="scheduleSelectedEvent()"
                        color="green"
                        content="Schedule Selected Event"/>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row v-if="scheduleSelectedEventClicked">
                <sui-grid-column>
                    <sui-message color="green">
                        <sui-message-header>Event Scheduled!</sui-message-header>
                        <p>
                            This event has been scheduled to your calendar with the selected time.
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
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function(){
        },
        startSearch: function() {
        },
        scheduleSelectedEvent: function() {
            this.scheduleSelectedEventClicked = true;
        },
        startSearch: function(eventId) {
            let meetingTimeSearchId = uuid4();
            this.$cookies.set('meetingTimeSearchId', meetingTimeSearchId);
            this.eventData.id = meetingTimeSearchId;
            let options = {
                body: {
                    eventData: this.eventData
                },
                method: 'post'
            }
            util.fetch('api/outlook/postMutualMeetingTimeSearchData', options)
            .then(this.sendMutualMeetingTimeInvite(meetingTimeSearchId));
        },
        sendFindMutualMeetingTimeInvite: function(meetingTimeSearchId){
            let options = {
                headers: {
                    meetingTimeSearchId,
                    threadId: this.$cookies.get('threadId'),
                    distExpr: this.$cookies.get('distExpr')
                }
            }
            util.fetch('api/outlook/sendFindMutualMeetingTimeInvite', options)
            .then(this.waitForResponses(meetingTimeSearchId));
        },
        waitForResponses: function(meetingTimeSearchId){
            let numberOfSchedules = this.$cookies.get('distExpr').split('+').length - 1;
            
            while(this.eventData.schedules.length != numberOfSchedules){
                setTimeout(async function(){
                    this.eventData = await util.fetch('api/outlook/getMutualMeetingTimeSearchData', {headers:meetingTimeSearchId});
                }, 10000);
            }
            //we now have everyones schedules
            console.log('all schedules recieved !');
            console.log(this.eventData);

        }
    },
    data: function() {
        return {
            global: shared.state,
            eventData: {
                id: '',
                body: '',
                subject: '',
                dateRangeStart: '',
                dateRangeEnd: '',
                duration: 1,
                schedules: []
            },
            possibleEvents: [],
            selectedEvent: {},
            scheduleSelectedEventClicked: false
        }
    }
}
</script>