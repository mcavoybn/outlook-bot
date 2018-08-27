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

        <!--  QUESTION EDIT TABLE -->
            <sui-table 
                style="height:500px;overflow:auto;">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        User
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
                    <sui-table-cell v-text="thread.date"></sui-table-cell>
                    <sui-table-cell v-text="thread.time"></sui-table-cell>
                </sui-table-row>
            </sui-table-body>
        </sui-table>

        <sui-table 
            class="ui left aligned table" 
            v-if="selectedThread">

            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        User
                    </sui-table-header-cell>
                     <sui-table-header-cell>
                        Prompt
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Response
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Action
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Date
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
                        v-text="message.prompt">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.response">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.action">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.date">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="message.time">
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

        </sui-table>
        <!--  /QUESTION EDIT TABLE -->
    </div>
</template>

<script>
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        loadData: function() {
            util.fetch('/api/message-history', {method:'get'})
            .then( res => {
                this.messageHistory = res.theJson;
            });
        },
        selectThread: function(thread) {
            this.selectedThread = thread;
        }
    },
    data: () => ({ 
        messageHistory: {},
        selectedThread: null
    })
}
</script>