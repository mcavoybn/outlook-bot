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
div [class*="float left"] {
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

        <!--  BUSINESS HOURS -->
        <sui-table 
            class="ui center aligned table">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-headerCell>
                        <span>Business Hours</span>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>


            <sui-table-body>
                <sui-table-row> 
                    <sui-table-cell>
                        <div class="ui labeled input">
                            <div class="ui label">Open:</div>
                            <input format="HH:MM:SS" 
                                v-model="openTime" 
                                type="time"/>
                        </div>
                        <div class="ui labeled input">
                            <div class="ui label">Close:</div>
                            <input format="HH:MM:SS" 
                                v-model="closeTime" 
                                type="time"/>
                        </div>
                    </sui-table-cell>
                </sui-table-row>
                <sui-table-row>
                    <sui-table-cell>
                        <div class="ui form field">
                            <label>Out of Office Message</label>
                            <textarea v-model="OooMessage"></textarea>
                        </div>
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

            <sui-table-footer>
                <sui-table-row>
                    <sui-table-cell>
                        <button class="ui button pull right" primary>
                            Save Changes
                        </button>
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>
        <!--  /BUSINESS HOURS TABLE -->

        <!--  QUESTION EDIT TABLE -->
        <sui-table 
            class="ui left aligned table"
            v-for="question in questions">

            <sui-table-header>
                <sui-table-row class="hover-red">
                    <sui-table-headerCell 
                        colspan="7"
                        @click="edit(question)">
                        <sui-icon
                            name="caret right"
                            size="large" 
                            v-if="question.editing"/>
                        <sui-icon
                            name="dropdown"
                            size="large" 
                            v-else />
                        <h4 style="display:inline">
                            Question {{questions.indexOf(question)+1}}
                        </h4>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>

            <sui-table-body v-if="!question.editing">
                <sui-table-row>
                    <sui-table-cell colspan="10">
                        <!-- question prompt edit -->
                        <span v-if="!question.prompt.editing">
                            <sui-list-icon 
                                name="edit" 
                                size="large" 
                                vertical-align="middle"
                                class="red"
                                @click="edit(question.prompt)"/>
                            <h4
                                style="display:inline"
                                class="response-cell"
                                v-text="question.prompt.text"/>
                        </span>
                        <span v-else>
                            <sui-list-icon 
                                name="save" 
                                size="large"
                                class="blue" 
                                vertical-align="middle"
                                @click="edit(question.prompt)"/>
                            <sui-input 
                                size="77"
                                v-model="question.prompt.text"
                                :value="question.prompt.text" />
                        </span>
                        <!-- /question prompt edit -->
                    </sui-table-cell>
                </sui-table-row>

                <sui-table-row 
                    v-for="response in question.responses" 
                    v-if="question.type!='Free Response'"> 

                    <!-- response text edit -->
                    <sui-table-cell collapsing>
                        <span v-if="!response.editing">
                            <sui-list-icon 
                                name="edit" 
                                size="large" 
                                vertical-align="middle"
                                class="red"
                                @click="edit(response)"/>
                            <span
                                class="response-cell"s
                                text-align="left"
                                v-text="response.text"/>
                        </span>
                        <span v-else>
                            <sui-list-icon 
                                name="save" 
                                size="large"
                                class="blue" 
                                vertical-align="middle"
                                @click="edit(response)"/>
                            <sui-input 
                                v-model="response.text"
                                :value="response.text" />
                        </span>
                    </sui-table-cell>
                    <!-- /response text edit -->

                    <!-- response action edit -->
                    <sui-table-cell collapsing>
                        <sui-dropdown      
                            selection
                            :options="actionOptions"
                            v-model="response.action"
                            v-if="response.editing"
                            />
                        <span
                            class="response-cell"
                            text-align="left"
                            v-text="response.action"
                            v-else
                            />
                    </sui-table-cell>
                    <sui-table-cell>
                        <span v-if="response.action=='Forward to Question'">
                            <sui-dropdown      
                                selection
                                :options="questions"
                                v-model="response.forwardQuestion"
                                v-if="response.editing" />
                            <span
                                class="response-cell"
                                text-align="left"
                                v-text="response.forwardQuestion"
                                v-else />
                        </span>
                        <span v-if="response.action=='Forward to Distribution'">
                            <sui-dropdown      
                                selection
                                :options="distributions"
                                v-model="response.forwardDist"
                                v-if="response.editing" />
                            <span
                                class="response-cell"
                                text-align="left"
                                v-text="response.forwardDist"
                                v-else />
                        </span>
                    </sui-table-cell>
                    <!-- /response action edit -->
                </sui-table-row>
                <sui-table-row 
                    class="left aligned"
                    v-if="question.type=='Free Response'">
                    <sui-table-cell>
                        <span>
                            The user will simply type their response to this question/
                            and it will be accessible somewhere in the Forsta App. Following/
                            this question the user will be prompted with the next question.
                        </span>
                    </sui-table-cell>
                </sui-table-row>
            </sui-table-body>

            <sui-table-footer v-if="!question.editing">
                <sui-table-row>
                    <sui-table-header-cell colspan="3">
                        <sui-button 
                            class="ui green button"
                            @click="newResponse(question)">
                            New Response
                        </sui-button>
                        <sui-dropdown
                            class="pull right"
                            placeholder="Question Type"
                            selection
                            :options="questionTypes"
                            v-model="question.type"
                        />
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>
        <!--  /QUESTION EDIT TABLE -->

        <sui-button 
            class="ui blue button"
            animated 
            @click="newQuestion(questions)">
            Add Question
        </sui-button>

        <sui-button 
            class="ui green button"
            animated 
            @click="save(questions)">
            Save Changes
        </sui-button>

    </div>
</template>

<script>
module.exports = {
    methods: {
        newQuestion: function (questions) {
            questions.push({
                prompt: {
                    text: "Question Prompt!",
                    editing: true
                },
                type: "Multiple Choice",
                editing: true,
                responses: [
                    {
                        text: "Yes",
                        action: "Next Question",
                        forwardDist: "",
                        forwardQuestion: "",
                        editing: false
                    },
                    {
                        text: "No",
                        action: "Next Question",
                        forwardDist: "",
                        forwardQuestion: 4,
                        editing: false
                    }
                ]
            })
        },
        newResponse: function (question){
            question.responses.push({
                text: "New Response",
                action: "Next Question",
                forwardDist: "",
                forwardQuestion: 4,
                editing: true
            })
        },
        edit: function (el) {
            if(el.editing == undefined){
                el.editing = true;
            }else{
                el.editing = !el.editing;
            }
        },
        save: function(questions) {
            
        }
    },
    computed: {
        openTime: {
            get: function() {
                return "08:00:00";
            },
            set: function() {

            }
        },
        closeTime: {
            get: function() {
                return "08:00:00";
            },
            set: function() {

            }
        },
        messageBotConfig: {
            get: function() {

            },
            set: function() {

            }
        },
        OooMessage: {
            get: function() {

            },
            set: function() {

            }
        }
    },
    data: () => ({ 
        global: shared.state,
        questions: [
            {
                prompt: {
                    text: "Hello, I am the live chat bot. Bleep bloop. What can I help you with?",
                    editing: false
                },
                type:"Multiple Choice",
                editing: false,
                responses: [
                    {
                        text: "I need technical support!",
                        action:"Forward to Distribution",
                        forwardDist: "@support",
                        forwardQuestion: "",
                        editing: false
                    },
                    {
                        text: "Put me in touch with sales.",
                        action:"Forward to Distribution",
                        forwardDist: "@sales",
                        forwardQuestion: "",
                        editing: false
                    },
                    {
                        text: "Other",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 2,
                        editing: false
                    }
                ]
            },
            {
                prompt: {
                        text: "Looks like you need help with something other than support or sales...",
                        editing: false
                    },
                type:"Multiple Choice",
                editing: false,
                responses: [
                    {
                        text: "Why the hell is forsta named what it is?",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 3,
                        editing: false
                    },
                    {
                        text: "Is there one true god?",
                        action:"Next Question",
                        forwardDist: "",
                        forwardQuestion: "",
                        editing: false
                    }
                ]
            },
            {
                prompt: {
                        text: "That depends, are you a cop?",   
                        editing: false,
                    },
                type:"Multiple Choice",
                editing:false,
                responses: [
                    {
                        text: "Of course I'm not a cop you have known me for years",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 4,
                        editing: false
                    },
                    {
                        text: "I am actually a cop",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 5,
                        editing: false
                    }
                ]
            }
        ],
        actionOptions: [
            {
                text:"Next Question",
                value:"Next Question",
            },
            {
                text:"Forward to Question",
                value:"Forward to Question"
            },
            {
                text:"Message User",
                value:"Message User",
            },
            {
                text:"Forward to Distribution",
                value:"Forward to Distribution",
            }
        ],
        questionTypes: [
            {
                text:"Free Response",
                value:"Free Response",
            },
            {
                text:"Multiple Choice",
                value:"Multiple Choice",
            }
        ],
        distributions: [
            {
                text:"@sales",
                value:"@sales"
            },
            {
                text:"@support",
                value:"@support"
            }
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