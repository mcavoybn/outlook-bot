<style>
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

        <!--  BUSINESS HOURS -->
        <sui-table
            class="ui left aligned table"
            color="grey">
            <sui-table-header>
                <sui-table-row>
                    <sui-table-headerCell>
                        <span>Distribution Edit</span>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-header>


            <sui-table-body>
                <sui-table-row> 
                </sui-table-row>
            </sui-table-body>

            <sui-table-footer v-if="changesMade">
                <sui-table-row>
                    <sui-table-headerCell>
                        <sui-button 
                            class="ui button pull right" 
                            primary
                            @click="saveData()">
                            Save Changes
                        </sui-button>
                    </sui-table-headerCell>
                </sui-table-row>
            </sui-table-footer>
        </sui-table>
        
    </div>
</template>

<script>
'use strict'
module.exports = {
    mounted: function() {
        this.loadData();
    },
    methods: {
        checkForChanges: function() {
            if(this.changesMade) return;
            if(JSON.stringify(this.oooEditData) != this.oooEditDataOriginal){
                this.changesMade = true;
            }
        },
        loadData: function() {
            util.fetch('/api/auth/users', {method:'get'})
            .then( res => {
                console.log('GETting from api/auth/users !');
                console.log('res.theJson');
                console.log(res);
            });
        },
        saveData: function() {
            // util.fetch('/api/business-hours', 
            // {
            //     method:'post', 
            //     body:
            //     { 
            //         oooEditData: this.oooEditData 
            //     }
            // });
            // this.oooEditDataOriginal = JSON.stringify(this.oooEditData);
            // this.changesMade = false;
        },
    },
    data: () => ({ 
        global: shared.state,
        changesMade: false
    }),
}
</script>