
<style>
.r2 {
    margin-right: 2em;
}
.clickable {
    cursor: pointer;
}
.capitalize {
    text-transform: capitalize;
}
.text-center {
    text-align: center!important;
}
td {
    font-size: 80%;
}
/*Styling for the lines connecting the labels to the slices*/
polyline{
    opacity: .3;
    stroke: black;
    stroke-width: 2px;
    fill: none;
    shape-rendering: geometricPrecision;
}

/* styling for the donut slices*/
path {
    shape-rendering: geometricPrecision;
    cursor: pointer;
}

/* Make the percentage on the text labels bold*/
.labelName tspan {
    font-weight: normal;
}

/* In biology we generally italicise species names. */
.labelName {
    font-size: 0.8em;
    font-weight: 700;
    cursor: pointer;
}

svg text.title {
    opacity: .1;
    font-size: 4em;
    font-weight: bold;
    text-transform: uppercase;
}
.donut {
    height: 15em;
    width: 100%;
    padding: 0;
}
</style>

<template>
    <div class="ui main text container" style="margin-top: 80px;">
        <h3>{{count}} Flagged Message{{count === 1 ? '' : 's'}}</h3>
        <div class="donut" />
        <br />
        <br />
        <table v-if="flagged.length" class="ui celled selectable striped padded table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Sender</th>
                    <th>Recipients</th>
                    <th>Notified</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="f in flagged" :key="f.messageId">
                    <td>{{f.receivedText}}</td>
                    <td>{{f.senderLabel}}</td>
                    <td v-html="f.recipientLabels.join('<br />')" />
                    <td v-html="f.notifiedLabels.join('<br />')" />
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>

const util = require('../util');
const moment = require('moment');
const d3 = require('d3');
const donutChart = require('./donut-chart.js');
const _ = require('lodash');

let donut;

const REFRESH_POLL_RATE = 15000;

module.exports = {
    data: () => ({ 
        global: shared.state,
        interval: null,
        loading: false,
        flagged: []
    }),
    computed: {
        count() { return this.flagged.length; },
    },
    watch: {
    },
    methods: {
        getFlagged() {
            var id = this.$route.params.id;
            const q = `?triggerId=${id}`;
            util.fetch.call(this, `/api/monitor/flagged/v1` + q)
            .then(result => {
                console.log('getFlagged result is', result);
                this.flagged = result.theJson.flagged;
                this.flagged.forEach(f => {
                    f.receivedMoment = moment(f.received);
                    f.receivedText = f.receivedMoment.format('lll');
                });
                const grouped = _.groupBy(this.flagged, 'senderId');
                const donutData = Object.keys(grouped).reduce((r, k) => {
                    return [{ count: grouped[k].length, id: 'uuid ' + k, label: grouped[k][0].senderLabel }, ...r];
                }, []);
                if (donut && donutData.length) donut.data(donutData);
            });
        }
    },
    mounted: function() {
        util.checkPrerequisites.call(this);

        const donutSelector = 'div.donut';
        const donutZoneWidth = $(donutSelector).innerWidth();
        donut = donutChart()
            .width(donutZoneWidth)
            .height(donutZoneWidth / 2.5)
            .transTime(750) // length of transitions in ms
            .cornerRadius(3) // sets how rounded the corners are on each slice
            .padAngle(0.015) // effectively dictates the gap between slices
            // .title('')
            .variable('count')
            .category('label');
        d3.select(donutSelector).call(donut);
        setTimeout(() => donut.data([{label: 'per-user counts appear here', count: 1, id:'' }]), 0);

        this.getFlagged();
        this.interval = setInterval(() => this.getFlagged(), REFRESH_POLL_RATE); 
    },
    beforeDestroy: function() {
        clearInterval(this.interval);
    }
}
</script>