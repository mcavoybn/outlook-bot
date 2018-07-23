<style>
</style>

<template lang="html">
    <div class="ui container center aligned">

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

            <sui-table-body>
                <sui-table-row 
                    v-for="message in messageHistory">
                    <sui-table-cell
                        v-text="message.user">
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
        display: function(el){
            el.displayed = !el.displayed;
        },
        loadData: function() {
            util.fetch('/api/message-history', {method:'get'})
            .then( res => {
                console.log('message history API fetch response');
                console.log(res.theJson);
                this.messageHistory = res.theJson;
            });
        },
        saveData: function() {
            util.fetch('/api/message-history', 
            {
                method:'post', 
                body:
                { 
                    messageHistory: this.messageHistory 
                }
            });
            
        }
    },
    data: () => ({ 
        global: shared.state,
        messageHistory: {},
    })
}
</script>