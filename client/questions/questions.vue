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
    width: 95%;
    margin-right:0.5em;
}
</style>
 
<template lang="html">
    <div class="ui container center aligned">

        <div class="ui basic segment huge">
            <h1 class="ui header">
                <i class="columns icon"></i>
                Live Chat Questions
            </h1>
        </div>

        <!--  QUESTION EDIT TABLE -->
        <sui-table
            class="ui left aligned table"
            v-for="question in questions"
            :color="question.color"
            :id="questions.indexOf(question)"
            @mouseenter="question.hovering=true"
            @mouseleave="question.hovering=false">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-headerCell
                        style="padding:23px"
                        colspan="2">
                        <h4 style="display:inline">
                            Question {{questions.indexOf(question)+1}}
                        </h4>
                    </sui-table-headerCell>
                    <sui-table-headerCell colspan="2" class="right aligned">
                        <sui-button 
                            color="red" 
                            content="Edit"
                            v-if="question.hovering && !question.editing"
                            @click="edit(question)" />
                        <sui-button 
                            color="red"
                            icon="trash"
                            v-if="question.editing"
                            @click="deleteQuestion(question)" />
                        <sui-button 
                            color="grey"
                            content="Done"
                            v-if="question.editing"
                            @click="edit(question)" />
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>
 
            <sui-table-body>
                <sui-table-row>
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
                                :color="colorFromResponse(response)"
                                vertical-align="middle" />
                        </div>
                        <div v-if="response.action=='Forward to Distribution'">
                            <sui-dropdown      
                                selection
                                placeholder="Distribution"
                                :options="distsForDropdown"
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
                            The user's response will be saved and the user will be prompted with the next question.
                        </p>
                    </sui-table-cell>  
                </sui-table-row>
            </sui-table-body>
 
            <sui-table-footer v-if="question.editing">
                <sui-table-row>
                    <sui-table-header-cell colspan="4">
                        <sui-button
                            class="ui green button"
                            content="New Response"
                            @click="newResponse(question)"
                            v-if="question.type=='Multiple Choice'"/>
                        <sui-dropdown
                            class="pull right"
                            selection
                            placeholder="Question Type"
                            :options="questionTypes"
                            @input="checkForChanges()"
                            v-model="question.type" />
                    </sui-table-header-cell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>
        <!--  /QUESTION EDIT TABLE -->

        <sui-button
            class="ui large green button pull left"
            content="New Question"
            style="margin-bottom:50px"
            @click="newQuestion()" />
        <sui-button
            class="ui large blue button pull right"
            content="Save Changes" 
            style="margin-bottom:50px"
            @click="saveData()"
            v-if="changesMade" />

        <div>
            <sui-modal v-model="showingSaveChangesModal">
                <sui-modal-header>Save Changes</sui-modal-header>
                <sui-modal-content>
                    <sui-modal-description>
                        <sui-header>Continue without saving changes?</sui-header>
                        <p>Your changes have not been saved.</p>
                    </sui-modal-description>
                </sui-modal-content>
                <sui-modal-actions style="padding:10px">
                    <sui-button 
                        class="yellow" 
                        floated="left"
                        @click="showingSaveChangesModal = false"
                        content="Cancel" />
                    <sui-button 
                        class="red"
                        @click="nextRoute()"
                        content="Don't Save & Continue" />
                    <sui-button 
                        floated="right" 
                        class="green" 
                        @click="saveAndContinue()"
                        content="Save & Continue" />
                </sui-modal-actions>
            </sui-modal>
        </div>

    </div>
</template>
 
<script>
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
        this.questions.forEach(question => {
            question.responses.forEach(response => {
                if(response.action == 'Forward to Distribution' 
                && response.actionOption >= this.dists.length){
                    response.actionOption = null;
                    this.changesMade = true;
                }
            });
        });
        if(this.changesMade){
            this.saveData();
            this.changesMade = false;
        }
    },
    methods: {
        colorFromResponse(response){
            if(!response.actionOption 
            || response.action != 'Forward to Question' 
            || response.actionOption.split(' ')[0].trim() != 'Question'){
                return 'black';
            } 
            let questionIndex = Number(response.actionOption.trim().split(' ')[1]) - 1;
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
            this.questionsForDropdown.splice(this.questions.indexOf(question), 1);
            this.changesMade = true;
        },
        edit: function (el) {
            el.editing = !el.editing;
        },
        getRandomColor: function () {
            let colors = ['red', 'orange', 'yellow', 'olive', 'green', 'teal',
                'blue', 'violet', 'purple', 'pink', 'brown', 'grey', 'black'];
            let idx = Math.floor(Math.random()*13);
            return colors[idx];
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
            });

            util.fetch.call(this, '/api/dists/', {method: 'get'})
            .then(result => {
                this.dists = result.theJson;
                this.dists.forEach( (dist, idx) => {
                    this.distsForDropdown.push({
                        text: dist.name,
                        value: dist.name
                    });
                });
            });
        },
        newQuestion: function () {
            this.questions.push({
                prompt: "Question Prompt",
                type: "Multiple Choice",
                editing: true,
                hovering: false,
                color: this.getRandomColor(),
                responses: [
                    {
                        text: "Yes",
                        action: 'Forward to Question',
                        actionOption: null
                    },
                    {
                        text: "No",
                        action: 'Forward to Question',
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
        saveAndContinue: function() {
            this.saveData();
            this.nextRoute();
        },
        saveData: function() {
            this.questions.forEach(question => {
                question.editing = false;
            });
            util.fetch('/api/questions/', {
                method:'post',
                body: {questions: this.questions}
            });
            this.changesMade = false;
            this.questionsOriginal = JSON.stringify(this.questions);
        },
    },
    beforeRouteLeave: function(to, from, next){
        if(this.changesMade){
            this.showingSaveChangesModal = true;
            this.nextRoute = next;
            next(false);
        }else{
            next();
        }
    },
    data: function() {
        return {
            global: shared.state,
            changesMade: false,
            questions: [],
            questionsOriginal: [],
            questionsForDropdown: [],
            showingSaveChangesModal: false,
            nextRoute: null,
            dists: [],
            distsForDropdown: [],
            questionActions: [
                {
                    text: "Forward to Question",
                    value: "Forward to Question"
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