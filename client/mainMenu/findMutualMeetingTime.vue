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
                <sui-input placeholder="Title" v-model="event.subject" />
            </sui-grid-row>
            
            <sui-grid-row>
                <sui-label>Body</sui-label>
                <div class="ui form field">
                    <textarea placeholder="Body" v-model="event.body" style="padding-right:35px"/>
                </div>
            </sui-grid-row>
            
            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Range Start'" />
                    <sui-input type="date" format="YYYY-MM-DD" v-model="event.dateRangeStart" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Range End'"/>
                    <sui-input type="date" format="YYYY-MM-DD" v-model="event.dateRangeEnd" />
                </sui-grid-column>
            </sui-grid-row>

            <sui-grid-row>
                <sui-grid-column>
                    <sui-label v-text="'Event Duration'"/>
                    <sui-input type="number" step="0.25" min="0.25" v-model="event.duration" />
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
                    <sui-table>
                        <sui-table-header>
                            <sui-table-header-cell v-text="'Start'" />
                            <sui-table-header-cell v-text="'End'" />
                        </sui-table-header>

                        <sui-table-body>
                            <sui-table-row v-for="possibleEvent in possibleEvents">
                                <sui-table-cell v-text="event.start.format('MM/DD/YYYY HH:MM')" />
                                <sui-table-cell v-text="event.end.format('MM/DD/YYYY HH:MM')" />
                            </sui-table-row>
                        </sui-table-body>
                    </sui-table>
                </sui-grid-column>
            </sui-grid-row>
            
        </sui-grid>

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
        startSearch: function() {
        }
    },
    data: function() {
        return {
            global: shared.state,
            event: {
                body: '',
                subject: '',
                dateRangeEnd: '',
                dateRangeStart: '',
                duration: 1
            },
            possibleEvents: []
        }
    }
}
</script>