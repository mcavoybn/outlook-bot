<style>
</style>

<template lang="html">
    <div class="ui container center aligned">

        <div class="ui basic segment huge">
            <h1 class="ui header">
                <i class="archive icon"></i>
                Live Chat Message History
            </h1>
        </div>

        <!--  QUESTION EDIT TABLE -->
        <sui-table class="ui left aligned table">

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

            <sui-table-body style="height:777px;overflow:auto;">
                <sui-table-row 
                    v-for="message in messageHistory">
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
                this.messageHistory.reverse();
            });
        },
    },
    data: () => ({ 
        messageHistory: {},
    })
}
</script>