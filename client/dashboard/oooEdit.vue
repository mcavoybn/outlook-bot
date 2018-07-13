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
        
    </div>
</template>

<script>
module.exports = {
    methods: {
    
    },
    computed: {
    },
    data: () => ({ 
        global: shared.state
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