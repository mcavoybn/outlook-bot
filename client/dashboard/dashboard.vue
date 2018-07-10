<style>
.checker-outline-hover:hover{
    border-style: dashed;
    border-width: 1px;
    padding:5px;
}
input{
    padding:2px;
}
</style>

<template lang="html">
<div>
    <div class="ui container center aligned">
        

        <sui-accordion exclusive>
            <sui-accordion-title>
                <sui-icon name="dropdown" />
                <span>Edit Business Hours</span>
            </sui-accordion-title>
            <sui-accordion-content> 
                <sui-grid>
                    <sui-grid-row>
                        <sui-grid-column :width="6">
                            <div class="ui labeled input">
                                <div class="ui label">Open:</div>
                                <input format="HH:MM:SS" v-model="openTime" type="time"/>
                            </div>
                            <div class="ui labeled input">
                                <div class="ui label">Close:</div>
                                <input format="HH:MM:SS" v-model="closeTime" type="time"/>
                            </div>
                        </sui-grid-column>
                        <sui-grid-column :width="10">
                            <div class="ui form">
                                <div class="field">
                                    <textarea placeholder="Out of office message" 
                                    rows="4"></textarea>
                                </div>
                            </div>
                        </sui-grid-column>
                    </sui-grid-row>
                    <sui-grid-row>
                        <sui-grid-column :width="18">
                            
                        </sui-grid-column>
                    </sui-grid-row>                    
                </sui-grid>               
            </sui-accordion-content>
        </sui-accordion>

        <sui-accordion exclusive v-for="question in questions">

            <sui-accordion-title>
                <sui-icon name="dropdown" />
                <span 
                    v-if="!question.editingTitle"
                    @dblclick="editTitle(question)"
                    v-text="question.title"
                    class="checker-outline-hover"></span>

                <sui-input 
                    v-model="question.title"
                    :value="question.title" 
                    v-if="question.editingTitle"></sui-input>
                    
                <sui-button 
                    icon="save outline" 
                    v-if="question.editingTitle"
                    @click="editTitle(question)"
                    primary></sui-button>
            </sui-accordion-title>

            <sui-accordion-content>
                <sui-grid>
                    <sui-grid-row>
                        <sui-grid-column :width="10">
                            <!-- response names dropdowns -->
                        </sui-grid-column>

                        <sui-grid-column :width="6">
                            <!-- onselect dropdowns -->
                        </sui-grid-column>
                    </sui-grid-row>
                    <sui-grid-row>
                        <sui-grid-column :width="12">
                            <!-- new question response button -->
                        </sui-grid-column>
                        
                        <sui-grid-column :width="4">
                            <!-- question type dropdown -->
                        </sui-grid-column>
                    </sui-grid-row>
                </sui-grid>                
            </sui-accordion-content>

        </sui-accordion>

        <button class="ui button"
            @click="newQuestion()">New Question</button>
        
        <div class="ui basic segment">
            <button @click="save()" class="ui button">Save Changes</button>
        </div>
    </div>
</div>
</template>

<script>
module.exports = {
    data: () => ({ 
        global: shared.state,
        questions: [
            {
                id: 1,
                title:"Question 1",
                responses: [
                    "Response 1",
                    "Response 2",
                    "Response 3"
                ],
                editingTitle: false
            },
            {
                id: 2,
                title:"Question 2",
                responses: [
                    "Response 1",
                    "Response 2",
                    "Response 3"
                ],
                editingTitle: false
            }
        ]
    }),
    methods: {
        save: function() {
            //save all the form data to the API
        },
        newQuestion: function () {
            //creates a new question for the currently loaded question set
        },
        newResponse: function (question){
            //add a blank new response based on the question type
        },
        editTitle: function (question) {
            question.editingTitle = !question.editingTitle;
        }
    },
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
    }
}
</script>