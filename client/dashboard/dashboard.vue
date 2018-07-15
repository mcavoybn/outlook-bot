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
.flexbox {
    display: flex;
    flex: 1;
    width: 95%;
    margin-right:0.5em;
}
</style>
 
<template lang="html">
    <div class="ui container center aligned">
 
        <!--  QUESTION EDIT TABLE -->
        <sui-table
            class="ui left aligned table"
            v-for="question in questions">
 
            <sui-table-header>
                <sui-table-row class="hover-red">
                    <sui-table-headerCell
                        colspan="2"
                        @click="display(question)">
                        <sui-icon
                            name="dropdown"
                            size="large"
                            v-if="question.displayed"/>
                        <sui-icon
                            name="caret right"
                            size="large"
                            v-else />
                        <h4 style="display:inline">
                            Question {{questions.indexOf(question)+1}}</h4>
                    </sui-table-headerCell>
                    <sui-table-headerCell colspan="2"class="right aligned">
                        <sui-list-icon
                            class="hover-red"
                            name="edit"
                            size="large"
                            vertical-align="middle"
                            v-if="question.displayed && !question.editing"
                            @click="edit(question)"/>
                        <sui-icon
                            class="hover-red"
                            name="trash alternate outline"
                            size="large"
                            vertical-align="middle"
                            v-if="question.displayed && question.editing"
                            @click="deleteQuestion(question)"/>
                        <sui-list-icon
                            class="hover-blue"
                            name="save"
                            size="large"
                            vertical-align="middle"
                            v-if="question.displayed&&question.editing"
                            @click="edit(question)"/>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>
 
            <sui-table-body v-if="question.displayed">
                <sui-table-row>
                    <sui-table-cell
                        colspan="4">
                        <!-- question prompt -->
                        <sui-icon
                            name="comment outline"
                            size="medium"/>
                        <h4
                            style="display:inline"
                            class="response-cell normal"
                            v-text="question.prompt"
                            v-if="!question.editing"/>
                        <sui-input
                            class="flexbox"
                            v-model="question.prompt"
                            :value="question.prompt"
                            v-else/>
                        <!-- /question prompt -->
                    </sui-table-cell>
                </sui-table-row>
 
                <sui-table-row
                    v-for="response in question.responses"
                    v-if="question.type!='Free Response'">
 
                    <!-- responses edit -->
                    <sui-table-cell
                        colspan="2"
                        collapsing>
                        <sui-icon
                            class="hover-red"
                            name="trash alternate outline"
                            size="medium"
                            vertical-align="middle"
                            v-if="question.editing"
                            @click="deleteResponse(question, response)"/>
                        <span v-if="!question.editing">
                            <span
                                class="response-cell"
                                v-text="response.text"/>
                        </span>
                        <span v-else>
                            <sui-input
                                class="flexbox"
                                v-model="response.text"
                                :value="response.text"/>
                        </span>
                    </sui-table-cell>
                    <!-- /responses edit -->
 
                    <!-- response action edit -->
                    <sui-table-cell collapsing>
                        <sui-icon
                            name="arrow right"
                            size="medium"
                            vertical-align="middle" />
                        <sui-dropdown      
                            selection
                            :options="actionOptions"
                            v-model="response.action"
                            v-if="question.editing"
                            />
                        <span
                            class="response-cell"
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
                                v-if="question.editing" />
                            <span
                                class="response-cell"
                                v-text="response.forwardQuestion"
                                v-else />
                        </span>
                        <span v-if="response.action=='Forward to Distribution'">
                            <sui-dropdown      
                                selection
                                :options="distributions"
                                v-model="response.forwardDist"
                                v-if="question.editing" />
                            <span
                                class="response-cell"
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
                            The user will simply type their response to this question
                            and it will be stored in the message vault component.
                            Then the user will be prompted with the next question.
                        </span>
                    </sui-table-cell>  
                </sui-table-row>
            </sui-table-body>
 
            <sui-table-footer v-if="question.editing&&question.displayed">
                <sui-table-row>
                    <sui-table-header-cell colspan="4">
                        <sui-button
                            class="ui green button"
                            @click="newResponse(question)">
                            Add Response
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
            class="ui big blue button"
            @click="newQuestion(questions)">
            Add Question
        </sui-button>
 
        <sui-button
            class="ui big green button"
            @click="save(questions)">
            Save Changes
        </sui-button>
 
    </div>
</template>
 
<script>
'use strict'
module.exports = {
    methods: {
        newQuestion: function (questions) {
            questions.push({
                prompt: "Question Prompt",
                type: "Multiple Choice",
                editing: true,
                displayed: true,
                responses: [
                    {
                        text: "Yes",
                        action: "Next Question",
                        forwardDist: "",
                        forwardQuestion: ""
                    },
                    {
                        text: "No",
                        action: "Next Question",
                        forwardDist: "",
                        forwardQuestion: 4
                    }
                ]
            })
        },
        newResponse: function (question){
            question.responses.push({
                text: "New Response",
                action: "Next Question",
                forwardDist: "",
                forwardQuestion: 4
            })
        },
        edit: function (el) {
            el.editing = !el.editing;
        },
        save: function(questions) {
           
        },
        display: function(question) {
            if(question.editing){
                question.editing = false;
            }
            question.displayed = !question.displayed
        },
        deleteResponse: function(question, response) {
            question.responses.splice(question.responses.indexOf(response),1)
        },
        deleteQuestion: function(question) {
            //show modal prompt for question delete hee !
            this.questions.splice(this.questions.indexOf(question), 1);
        }
    },
    data: () => ({
        global: shared.state,
        questions: [
            {
                prompt: "Hello, I am the live chat bot. Bleep bloop. What can I help you with?",
                type:"Multiple Choice",
                editing: false,
                displayed: true,
                responses: [
                    {
                        text: "I need technical support!",
                        action:"Forward to Distribution",
                        forwardDist: "@support",
                        forwardQuestion: ""
                    },
                    {
                        text: "Put me in touch with sales.",
                        action:"Forward to Distribution",
                        forwardDist: "@sales",
                        forwardQuestion: ""
                    },
                    {
                        text: "Other",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 2
                    }
                ]
            },
            {
                prompt: "Looks like you need help with something other than support or sales...",
                type:"Multiple Choice",
                editing: false,
                displayed: true,
                responses: [
                    {
                        text: "Why the hell is forsta named what it is?",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 3
                    },
                    {
                        text: "Is there one true god?",
                        action:"Next Question",
                        forwardDist: "",
                        forwardQuestion: ""
                    }
                ]
            },
            {
                prompt: "That depends, are you a cop?",
                type:"Multiple Choice",
                editing:false,
                displayed: true,
                responses: [
                    {
                        text: "Of course I'm not a cop you have known me for years",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 4
                    },
                    {
                        text: "I am actually a cop",
                        action:"Forward to Question",
                        forwardDist: "",
                        forwardQuestion: 5
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
 
        // const ourId = await relay.storage.getState('addr');
        // console.log(ourId);
    }
}
</script>