<style>
.hover-gray-bg:hover{
    background-color:#eee;
    cursor:pointer;
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

        <ooo-edit />

        <!--  QUESTION EDIT TABLE -->
        <sui-table
            class="ui left aligned table"
            v-for="question in questions"
            :color="question.color">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-headerCell
                        class="hover-gray-bg"
                        colspan="2"
                        @click="display(question)">
                        <sui-icon
                            class="item link"
                            name="dropdown"
                            size="large"
                            v-if="question.displayed"/>
                        <sui-icon
                            class="item link"
                            name="caret right"
                            size="large"
                            v-else />
                        <h4 style="display:inline">
                            Question {{questions.indexOf(question)+1}}</h4>
                    </sui-table-headerCell>
                    <sui-table-headerCell colspan="2"class="right aligned">
                        <sui-button 
                            color="red" 
                            content="Edit"
                            v-if="question.displayed && !question.editing"
                            @click="edit(question)" />
                        <sui-button 
                            color="red"
                            icon="trash"
                            v-if="question.displayed && question.editing"
                            @click="deleteQuestion(question)" />
                        <sui-button 
                            color="grey"
                            content="Done"
                            v-if="question.displayed && question.editing"
                            @click="edit(question)" />
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>
 
            <sui-table-body v-if="question.displayed">
                <sui-table-row class="hover-gray-bg">
                    <!-- question prompt -->
                    <sui-table-cell colspan="4">
                        <sui-icon
                            class="item link"
                            name="comment outline"
                            size="medium" />
                        <h4
                            class="normal"
                            style="display:inline"
                            v-text="question.prompt"
                            v-if="!question.editing" />
                        <sui-input
                            class="flexbox"
                            v-model="question.prompt"
                            :value="question.prompt"
                            @input="checkForChanges()"
                            v-else />
                    </sui-table-cell>
                    <!-- /question prompt -->
                </sui-table-row>
 
                <sui-table-row
                    class="hover-gray-bg"
                    v-for="response in question.responses"
                    v-if="question.type!='Free Response'">
 
                    <!-- responses edit -->
                    <sui-table-cell colspan="2" collapsing>
                        <sui-icon
                            class="item link"
                            name="trash alternate outline"
                            size="medium"
                            vertical-align="middle"
                            v-if="question.editing"
                            @click="deleteResponse(question, response)" />
                        <p
                            style="display:inline"
                            v-text="response.text"
                            v-if="!question.editing" />
                        <sui-input
                            class="flexbox"
                            v-model="response.text"
                            :value="response.text"
                            @input="checkForChanges()"
                            v-else />
                    </sui-table-cell>
                    <!-- /responses edit -->
 
                    <!-- response action edit -->
                    <sui-table-cell collapsing>
                        <sui-icon
                            class="item link"
                            name="arrow right"
                            size="medium"
                            vertical-align="middle" />
                        <sui-dropdown      
                            selection
                            placeholder="Response Action"
                            :options="questionActions"
                            v-model="response.action"
                            @input="checkForChanges()"
                            v-if="question.editing" />
                        <p
                            style="display:inline"
                            v-text="response.action"
                            v-else />
                    </sui-table-cell>
                    <sui-table-cell>
                        <div v-if="response.action=='Forward to Question'">
                            <sui-dropdown   
                                selection
                                placeholder="Question"
                                :options="questionsForDropdown"
                                v-model="response.actionOption"
                                @input="checkForChanges()"
                                v-if="question.editing" />
                            <p
                                style="display:inline"
                                v-text="response.actionOption"
                                v-else />
                            <sui-icon
                                name="circle"
                                size="small"
                                style="margin-left:5px"
                                :color="colorFromActionOption(response.actionOption)"
                                vertical-align="middle" />
                        </div>
                        <div v-if="response.action=='Forward to Distribution'">
                            <sui-dropdown      
                                selection
                                placeholder="Distribution"
                                :options="dists"
                                v-model="response.actionOption"
                                @input="checkForChanges()"
                                v-if="question.editing" />
                            <p
                                style="display:inline"
                                v-text="response.actionOption"
                                v-else />
                        </div>
                        <div v-if="response.action=='Forward to User'">
                            <sui-dropdown      
                                selection
                                placeholder="User"
                                :options="users"
                                v-model="response.actionOption"
                                @input="checkForChanges()"
                                v-if="question.editing" />
                            <p
                                style="display:inline"
                                v-text="response.actionOption"
                                v-else />
                        </div>
                    </sui-table-cell>
                    <!-- /response action edit -->
 
                </sui-table-row>
                <sui-table-row
                    class="left aligned"
                    v-if="question.type=='Free Response'">
                    <sui-table-cell>
                        <p>
                            This question will be saved and the user will be prompted with the next question.
                        </p>
                    </sui-table-cell>  
                </sui-table-row>
            </sui-table-body>
 
            <sui-table-footer v-if="question.editing&&question.displayed">
                <sui-table-row>
                    <sui-table-header-cell colspan="4">
                        <sui-button
                            class="ui green button"
                            @click="newResponse(question)"
                            v-if="question.type=='Multiple Choice'"
                            content="Add Response" />
                        <sui-dropdown
                            class="pull right"
                            selection
                            placeholder="Question Type"
                            :options="questionTypes"
                            @input="checkForChanges"
                            v-model="question.type" />
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>
        <!--  /QUESTION EDIT TABLE -->

        <sui-button
            class="ui large green button pull left"
            content="Add Question"
            style="margin-bottom:50px"
            @click="newQuestion()" />
        <sui-button
            class="ui large blue button pull right"
            content="Save Changes" 
            style="margin-bottom:50px"
            @click="saveData()"
            v-if="changesMade" />
    </div>
</template>
 
<script>
let oooEdit = require('./oooEdit.vue');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    components: {
        'ooo-edit': oooEdit
    },
    methods: {
        colorFromActionOption(actionOption){
            if(!actionOption) return 'black';
            let questionIndex = Number(actionOption.trim().split(' ')[1]) - 1;
            return this.questions[questionIndex].color;
        },
        checkForChanges(){
            if(this.changesMade) return;
            if(JSON.stringify(this.questions) != this.questionsOriginal){
                this.changesMade = true;
            }
        },
        deleteResponse: function(question, response) {
            question.responses.splice(question.responses.indexOf(response),1);
            this.changesMade = true;
        },
        deleteQuestion: function(question) {
            this.questions.splice(this.questions.indexOf(question), 1);
            this.changesMade = true;
        },
        display: function(question) {
            if(question.editing) return;
            question.displayed = !question.displayed
        },
        loadData: function(){
            util.fetch.call(this, '/api/questions/', {method: 'get'})
            .then(result => {
                this.questionsOriginal = JSON.stringify(result.theJson);
                this.questions = result.theJson;
                this.questionsForDropdown = [];
                for(let i=0; i<this.questions.length; i++){
                    this.questionsForDropdown.push({
                        text: `Question ${i+1}`,
                        value: `Question ${i+1}`
                    });
                }
                this.changesMade = false;
            });
        },
        newQuestion: function () {
            this.questions.push({
                prompt: "Question Prompt",
                type: "Multiple Choice",
                editing: false,
                displayed: true,
                color: this.getRandomColor(),
                responses: [
                    {
                        text: "Yes",
                        action: null,
                        actionOption: null
                    },
                    {
                        text: "No",
                        action: null,
                        actionOption: null
                    }
                ]
            });
            this.questionsForDropdown.push({
                text: `Question ${this.questions.length}`,
                value: `Question ${this.questions.length}`
            });
            this.changesMade = true;
        },
        newResponse: function (question){
            question.responses.push({
                text: "New Response",
                action: null,
                actionOption: null
            });
            this.changesMade = true;
        },
        edit: function (el) {
            el.editing = !el.editing;
        },
        getRandomColor: function () {
            let colors = ['red', 'orange', 'yellow', 'olive', 'green',
                'teal', 'blue', 'violet', 'purple', 'pink', 'brown', 'grey', 'black'];
            let idx = Math.floor(Math.random()*13);
            return colors[idx];
        },
        saveData: function() {
            util.fetch('/api/questions/', {
                method:'post',
                body: {questions: this.questions}
            });
            this.changesMade = false;
            this.questions.forEach(question => {
                question.editing = false;
            });
        }
    },
    data: function() {
        return {
            global: shared.state,
            changesMade: false,
            questions: [],
            questionsOriginal: [],
            questionsForDropdown: [],
            dists: [
                {
                    text: "@sales",
                    value: "@sales"
                },
                {
                    text: "@support-1",
                    value: "@support-1"
                },
                {
                    text: "@support-2",
                    value: "@support-2"
                }
            ],
            users: [
                {
                    text: '@mcavoybn:forsta.io',
                    value: '@mcavoybn:forsta.io'
                },
                {
                    text: '@zach:forsta.io',
                    value: '@zach:forsta.io'
                }
            ],
            questionActions: [
                {
                    text: "Forward to Question",
                    value: "Forward to Question"
                },
                {
                    text: "Forward to User",
                    value: "Forward to User"
                },
                {
                    text: "Forward to Distribution",
                    value: "Forward to Distribution"
                },
            ],
            questionTypes: [
                {
                    text: "Free Response",
                    value: "Free Response"
                },
                {
                    text: "Multiple Choice",
                    value: "Multiple Choice"
                }
            ]
        }
    }
}
</script>