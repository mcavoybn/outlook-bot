<style>
.hover-grey:hover{
    background-color:#ddd;
}
</style>

<template lang="html">
    <div class="ui container left aligned">

        <div class="ui basic segment" style="padding-top:5%">
            <h2 class="ui header">
                Message History
            </h2>
        </div>

        <sui-dropdown color="blue" text="Sort By">
            <sui-dropdown-menu>
            <sui-dropdown-item @click="sortByUser(messageHistory, false)">User (A-Z)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByUser(messageHistory, true)">User (Z-A)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByDate(messageHistory, false)">Date (Oldest First)</sui-dropdown-item>
            <sui-dropdown-item @click="sortByDate(messageHistory, true)">Date (Newest First)</sui-dropdown-item>
            </sui-dropdown-menu>
        </sui-dropdown>

        <!--  QUESTION EDIT TABLE -->
            <sui-table 
                style="overflow:auto;">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        Username
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Email
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Date
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Time
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-header>
            <sui-table-body>
                <sui-table-row
                    class="hover-grey"
                    @click="selectThread(thread)"
                    v-for="thread in messageHistory">
                    <sui-table-cell v-text="thread.user.slug"></sui-table-cell>
                    <sui-table-cell v-text="thread.user.email"></sui-table-cell>
                    <sui-table-cell v-text="thread.threadDate"></sui-table-cell>
                    <sui-table-cell v-text="thread.threadTime"></sui-table-cell>
                </sui-table-row>
            </sui-table-body>
        </sui-table>

        <sui-table 
            class="ui left aligned table" 
            v-if="selectedThread">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        Username
                    </sui-table-header-cell>
                     <sui-table-header-cell>
                        Message
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Action
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Time
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-header>

            <sui-table-body 
                style="height:777px;overflow:auto;">
                <sui-table-row 
                    v-for="message in selectedThread.messages">
                    <sui-table-cell
                        v-text="message.user.slug">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.message">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.action">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.time">
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

        </sui-table>
        <!--  /QUESTION EDIT TABLE -->

        <sui-button 
            color="blue"
            @click="saveAllThreadsToCSV()">Save All Threads</sui-button>
        <sui-button 
            color="blue"
            @click="saveCurrentThreadToCSV()">Save Current Thread</sui-button>
    </div>
</template>

<script>
'use strict'
const fileSaver = require('file-saver');
const csvStringify = require('csv-stringify');
const moment = require('moment');
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function() {
            util.fetch('/api/message-history', {method:'get'})
            .then( res => {
                this.sortByDate(res.theJson);
            });
        },
        sortByDate(messageHistory, descending){
            let sorted = [];
            for(let threadId in messageHistory){
                sorted.push(messageHistory[threadId]);
            }
            sorted.sort( (a,b) => {
                var dateA = moment(a.threadDate, "MM/DD/YYYY");
                var dateB = moment(b.threadDate, "MM/DD/YYYY");
                if (dateA < dateB) {
                    return descending? 1: -1;
                }
                if (dateA > dateB) {
                    return descending? -1: 1;
                }
            });
            this.messageHistory = sorted;
        },
        sortByUser(messageHistory, descending){
            let sorted = [];
            for(let threadId in messageHistory){
                sorted.push(messageHistory[threadId]);
            }
            sorted.sort( (a,b) =>{
                var nameA = a.user.slug.toUpperCase();
                var nameB = b.user.slug.toUpperCase();
                if (nameA < nameB) {
                    return descending? 1 : -1;
                }
                if (nameA > nameB) {
                    return descending? -1 : 1;
                }
                return 0;
            });
            this.messageHistory = sorted;
        },
        saveAllThreadsToCSV(){
            let formattedHistory = [];
            const threadTableHeader = ['Date Created', 'Time Created', 'User Name', 'User Email'];
            const messageTableHeader = ['Message', 'Action', 'Time'];
            this.messageHistory.forEach(thread => {
                formattedHistory.push(threadTableHeader);
                formattedHistory.push([thread.threadDate, thread.threadTime, thread.user.slug, thread.user.email]);
                formattedHistory.push(messageTableHeader);
                thread.messages.forEach(message => {
                    formattedHistory.push([message.message, message.action, message.time]);                 
                });
            });
            let csv = csvStringify(formattedHistory, function(err, output){
                fileSaver.saveAs(new Blob([output]), `MessageHistory-${moment().format('MM/DD/YYYY')}.csv`);
            });
        },
        saveCurrentThreadToCSV(){
            if(!this.selectedThread) return;
            let formattedHistory = [];
            let thread = this.selectedThread;
            const threadTableHeader = ['Date Created', 'Time Created', 'User Name', 'User Email'];
            const messageTableHeader = ['Message', 'Action', 'Time'];
            formattedHistory.push(threadTableHeader);
            formattedHistory.push([thread.threadDate, thread.threadTime, thread.user.slug, thread.user.email]);
            formattedHistory.push(messageTableHeader);
            thread.messages.forEach(message => {
                formattedHistory.push([message.message, message.action, message.time]);                 
            });
            let csv = csvStringify(formattedHistory, function(err, output){
                fileSaver.saveAs(new Blob([output]), `MessageHistory-${moment().format('MM/DD/YYYY')}.csv`);
            });
        },
        selectThread: function(thread) {
            this.selectedThread = thread;
        }
    },
    data: () => ({ 
        messageHistory: [],
        selectedThread: null
    })
}       
</script>