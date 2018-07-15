<style>
.response-cell{
    padding:15px;
}
.hover-red:hover{
    color:red;
}
.hover-blue:hover{
    color:blue;
}
div [class*="pull left"] {
  float: left;
  margin-left: 0.25em;
}
div [class*="pull right"] {
  float: right;
   margin-right: 0.25em;
}
</style>

<template lang="html">
    <div class="ui container center aligned">

        <!--  QUESTION EDIT TABLE -->
        <sui-table class="ui left aligned table">

            <sui-table-header>
                <sui-table-row>
                    <sui-table-header-cell>
                        Date
                    </sui-table-header-cell>
                     <sui-table-header-cell>
                        @username:org
                    </sui-table-header-cell>
                    <sui-table-header-cell>
                        Question Set
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-header>

            <sui-table-body v-for="submission in submissions">
                <sui-table-row>
                    <sui-table-cell>
                        <sui-icon
                        class="hover-red"
                        name="caret right"
                        size="large"
                        @click="display(submission)"
                        v-if="!submission.displayed"/>
                    <sui-icon
                        class="hover-red"
                        name="dropdown"
                        size="large" 
                        @click="display(submission)"
                        v-else />
                    <span
                        v-text="submission.date" />
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="submission.userOrg">
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="submission.questionSet">
                    </sui-table-cell>
                </sui-table-row>

                <sui-table-row 
                    v-for="messageSet in submission.conversation"
                    v-if="submission.displayed">
                    <sui-table-cell>
                        <!-- blank cell for offset -->
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="messageSet.prompt"
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="messageSet.response"
                    </sui-table-cell>
                    <sui-table-cell
                        v-text="messageSet.action"
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
    methods: {
        display: function(el){
            el.displayed = !el.displayed;
        }
    },
    data: () => ({ 
        global: shared.state,
        submissions: [
            {
                date: '07/07/07',
                userOrg: '@mcavoybn:my.organization',
                questionSet: 'Default',
                displayed: false,
                conversation: [
                    {
                        prompt: "Hello, I am the live chat bot. Bleep bloop. What can I help you with?",
                        response: "I need technical support!",
                        action: "Forward to Distribution @support"
                    },

                ]
            },
            {
                date: '08/08/08',
                userOrg: '@mcavoybn:my.organization',
                questionSet: 'Default',
                displayed: false,
                conversation: [
                    {
                        prompt: "Hello, I am the live chat bot. Bleep bloop. What can I help you with?",
                        response: "Other",
                        action: "Forward to Question 2"
                    },

                ]
            },
        ]
    }),
    mounted: function() {
        console.log(this.global.onboardStatus, this.$router.path);

        if (this.global.onboardStatus !== 'complete') {
            this.$router.push({ name: 'welcome' });
            return;
        }
        util.fetch.call(this, '/api/onboard/status/v1')
        .then(result => { 
            this.global.onboardStatus = result.theJson.status;
            if (this.global.onboardStatus !== 'complete') {
                this.$router.push({ name: 'welcome' });
            }
        });
        if (!this.global.apiToken) {
            this.$router.push({ name: 'loginTag', query: { forwardTo: this.$router.path }});
            return;
        }
    }
}
</script>