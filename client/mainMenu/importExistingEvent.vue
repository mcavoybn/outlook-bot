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
                    Get existing events from outlook based on a given date range.
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Start'" />
                    <sui-input type="date" format="YYYY-MM-DD" v-model="loadEventsRangeStart" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'End'"/>
                    <sui-input type="date" format="YYYY-MM-DD" v-model="loadEventsRangeEnd" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
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
                            <sui-table-header-cell v-text="'Start'" />
                            <sui-table-header-cell v-text="'End'" />
                            <sui-table-header-cell v-text="'Subject'" />
                            <sui-table-header-cell v-text="'Body'" />
                        </sui-table-header>

                        <sui-table-body>
                            <sui-table-row v-for="event in events">
                                <sui-table-cell v-text="event.start.format('MM/DD/YYYY HH:MM')" />
                                <sui-table-cell v-text="event.end.format('MM/DD/YYYY HH:MM')" />
                                <sui-table-cell v-text="event.subject" />
                                <sui-table-cell v-text="event.body" />
                            </sui-table-row>
                        </sui-table-body>
                    </sui-table>
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row v-if="events.length > 0">
                <sui-grid-column>
                    <sui-button
                        color="green"
                        content="Send to Distribution"
                        @click="getEventList()"/>
                </sui-grid-column>
            </sui-grid-row>
            
        </sui-grid>

        

    </div>
</template>
 
<script>
const util = require('../util');
const moment = require('moment');
const graph = require('@microsoft/microsoft-graph-client');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        getEventList: function() {
            try {
                const start = new Date(this.loadEventsRangeStart + 'T' + '00:00');
                const end = new Date(this.loadEventsRangeEnd + 'T' + '12:00')   ;
                shared.graphClient
                .api(`/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
                .get()
                .then(res => {
                    res.value.forEach(event => {
                        this.events.push({
                            start: moment(event.start.dateTime),
                            end: moment(event.end.dateTime),
                            subject: event.subject,
                            body: event.body.bodyPreview
                        });
                    });
                });
            } catch (err) {
                console.log(err);
            }
        },
    },
    data: function() {
        return {
            global: shared.state,
            events: [],
            loadEventsRangeEnd: '',
            loadEventsRangeStart: '',
            timezonesForDropdown: []
        }
    }
}
</script>