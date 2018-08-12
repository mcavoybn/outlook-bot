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
    width: 70%;
    margin-right:0.5em;
}
</style>

<template lang="html">
    <div class="ui container center aligned">

        <div class="ui basic segment huge">
            <h1 class="ui header">
                <i class="address book icon"></i>
                Live Chat User Distributions
            </h1>
        </div>

        <sui-table
            class="ui left aligned table"
            color="grey">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-headerCell colspan="2">
                        <span>User Distributions</span>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>

            <sui-table-body>
                <sui-table-row>
                    <sui-table-cell>
                        <sui-button 
                            color="green"
                            icon="copy"
                            content="Create New"
                            @click="addDist()" />
                    </sui-table-cell>
                </sui-table-row>

                <sui-table-row>
                    <sui-table-cell colspan="2">
                        <span class="ui label">Select Distribution:</span>
                        <sui-dropdown    
                            selection
                            placeholder="Distributions"
                            v-model="selectedDistIdx"
                            @input="checkForChanges()"
                            :options="distsForDropdown"/>
                        <sui-button 
                            color="red"
                            icon="trash"
                            style="margin-left:15px"
                            content="Delete Selected"
                            @click="removeDist()" />
                    </sui-table-cell>
                </sui-table-row>

                <sui-table-row>
                    <sui-table-cell colspan="2">
                        <span class="ui label">Distribution Name:</span>
                        <sui-input
                            class="flexbox"
                            v-model="selectedDist.name"
                            @input="checkForChanges()" />
                    </sui-table-cell>
                </sui-table-row>
                
                <sui-table-row> 
                    <sui-table-cell 
                        size="large" 
                        style="height:300px;overflow:auto" 
                        valign="top">
                        <sui-list divided relaxed>
                            <sui-list-item 
                                v-for="user in userData"
                                v-if="!selectedDist.users.find(u => u.id == user.tag.id)">
                                <sui-list-content>
                                    <sui-list-icon 
                                        name="plus"
                                        class="green"
                                        @click="addUser(user)" />
                                    <a 
                                        v-text="user.tag.slug"
                                        @click="addUser(user)"/>
                                </sui-list-content>
                            </sui-list-item>
                        </sui-list>
                    </sui-table-cell>

                    <sui-table-cell 
                        size="large"
                        style="height:300px;overflow:auto" 
                        valign="top">
                        <sui-list divided relaxed>
                            <sui-list-item 
                                v-for="user in userData"
                                v-if="selectedDist.users.find(u => u.id == user.tag.id)">
                                <sui-list-content >
                                    <sui-list-icon 
                                        name="minus" 
                                        class="red"
                                        @click="removeUser(user)" />
                                    <a
                                        @click="removeUser(user)" 
                                        v-text="user.tag.slug" />
                                </sui-list-content>
                            </sui-list-item>
                        </sui-list>
                    </sui-table-cell>
                    
                </sui-table-row>
            </sui-table-body>

            <sui-table-footer>
                <sui-table-row>
                    <sui-table-headerCell colspan="2">
                        <sui-button 
                            class="pull right" 
                            color="blue"
                            @click="saveData()"
                            v-if="changesMade"
                            content="Save Changes" />
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>

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
let global = require('../globalState');
let uuidv4 = require('uuid/v4');
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        addUser: function(user){
            let sd = this.dists[this.selectedDistIdx];
            if(!sd.users.find(u => u.id == user.tag.id)){
                sd.users.push({id:user.tag.id, slug:user.tag.slug});
                this.checkForChanges();
            }
        },
        removeUser: function(user){
            let sd = this.dists[this.selectedDistIdx];
            let distUser = sd.users.find(u => u.id = user.tag.id);
            if( distUser ){
                sd.users.splice(sd.users.indexOf(distUser), 1);
                this.checkForChanges();
            }
        },
        addDist: function(){
            this.dists.push({
                users: [],
                name: "New Dist",
                id: uuidv4()
            });
            this.distsForDropdown.push({
                text: "New Dist",
                value: this.dists.length - 1
            })
            this.selectedDistIdx = this.dists.length - 1;
            this.selectedDist = this.dists[this.selectedDistIdx];
            this.changesMade = true;
        },
        removeDist: function(){
            if(this.selectedDistIdx == this.dists.length - 1){
                this.selectedDistIdx--;
                this.dists.pop();
                this.distsForDropdown.pop();
            }else{
                this.dists.splice(this.selectedDistIdx, 1);
                this.distsForDropdown.splice(this.selectedDistIdx, 1);
            }
            this.selectedDist = this.dists[this.selectedDistIdx];
            this.changesMade = true;
        },
        checkForChanges: function() {
            this.selectedDist = this.dists[this.selectedDistIdx];
            if(this.changesMade) return;
            if(JSON.stringify(this.dists) != this.distsOriginal){
                this.changesMade = true;
            }
        },
        loadData: function() {
            util.fetch('/api/dists/', {method:'get'})
            .then( res => {
                this.dists = res.theJson.dists;
                this.userData = res.theJson.users.results;
                console.log('this.userData : ');
                console.log(this.userData);
                this.distsOriginal = JSON.stringify(res.theJson);
                this.dists.forEach( (dist, idx) => {
                    this.distsForDropdown.push({
                        text: dist.name,
                        value: idx
                    });
                });
                this.selectedDist = this.dists[this.selectedDistIdx];
            });
        },
        saveData: function() {
            util.fetch('/api/dists/', 
            {
                method:'post', 
                body:
                { 
                    dists: this.dists
                }
            });
            this.distsForDropdown = [];
            this.dists.forEach( (dist, idx) => {
                this.distsForDropdown.push({
                    text: dist.name,
                    value: idx
                });
            });
            this.distsOriginal = JSON.stringify(this.dists);
            this.changesMade = false;
        },
        saveAndContinue: function() {
            this.saveData();
            this.nextRoute();
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
    data: () => ({ 
        global: shared.state,
        changesMade: false,
        userData: [],
        dists: [],
        distsOriginal: [],
        distsForDropdown: [],
        selectedDist: {},
        selectedDistIdx: 0,
        showingSaveChangesModal: false,
        nextRoute: null
    }),
}
</script>