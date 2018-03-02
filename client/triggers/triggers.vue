
<style>
.r2 {
    margin-right: 2em;
}
.clickable {
    cursor: pointer;
}
.capitalize {
    text-transform: capitalize;
}
.text-center {
    text-align: center!important;
}
.text-right {
    text-align: right!important;
}
.text-left {
    text-align: left!important;
}
</style>

<template>
    <div class="ui main text container" style="margin-top: 80px;">
        <h1>Triggers</h1>
        <table class="ui celled selectable striped padded table" v-if="triggers.length">
            <thead>
                <tr>
                    <th class="text-center">Active</th>
                    <th class="text-center">Direction</th>
                    <th>Label</th>
                    <th>Notify</th>
                    <th class="text-center" colspan="2">Statistics</th>
                </tr>
            </thead>
            <tbody>
                <tr class="clickable" v-for="trigger in triggers" :key="trigger.id" @click="editTrigger(trigger)">
                    <td class="text-center"><sui-checkbox toggle @click.stop="toggleTrigger(trigger)" v-model="trigger.isActive" /></td>
                    <td class="capitalize text-center">{{trigger.def.direction}}</td>
                    <td>{{trigger.def.label}}</td>
                    <td>{{trigger.def.notify}}</td>
                    <td class="text-right" @click.prevent.stop="gotoFlagged(trigger)"><a><sui-icon size="big" name="chart pie" /></a></td>
                    <td class="text-left" @click.prevent.stop="gotoFlagged(trigger)"><h4>{{trigger.count}}</h4></td>
                </tr>
            </tbody>
        </table>
        <sui-button primary content="New Trigger" icon="plus" label-position="left" @click="addTrigger" />
        <sui-modal size="small" v-model="showEditor">
            <sui-modal-header>
                <b>{{form.id ? 'EDIT' : 'CREATE'}}&nbsp;&nbsp;TRIGGER</b>
                &nbsp;&nbsp;
                <sui-dropdown
                    placeholder="fill with predefined pattern"
                    :options="builtins"
                    v-model="selectedBuiltin"
                />
            </sui-modal-header>
            <sui-modal-content>
                <sui-form @submit.prevent="saveTrigger" novalidate :loading="loading">
                    <sui-form-field :class="{error: error.label}" :data-tooltip="error.label" data-position="bottom center" data-inverted>
                        <label>Trigger Label</label>
                        <input placeholder="Label" v-model="form.label" />
                    </sui-form-field>
                    <sui-form-field>
                        <label>Message Direction</label>
                        <sui-checkbox class="r2" label="Any" radio value="any" v-model="form.direction" />
                        <sui-checkbox class="r2" label="Internal" radio value="internal" v-model="form.direction" />
                        <sui-checkbox class="r2" label="Incoming" radio value="incoming" v-model="form.direction" />
                        <sui-checkbox class="r2" label="Outgoing" radio value="outgoing" v-model="form.direction" />
                    </sui-form-field>
                    <sui-form-field :class="{error: error.notify}" :data-tooltip="error.notify" data-position="bottom center" data-inverted>
                        <label>Distribution to Notify</label>
                        <input placeholder="@tags @to @notify" v-model="form.notify" />
                    </sui-form-field>
                    <sui-form-field :class="{error: error.pattern}" :data-tooltip="error.pattern" data-position="bottom center" data-inverted>
                        <label><sui-dropdown :options="triggerTypes" v-model="form.type"/></label>
                        <textarea :placeholder="triggerTypePlaceholder" v-model="form.pattern" />
                    </sui-form-field>
                    <sui-form-field>
                        <sui-checkbox class="r2" label="Case-Insensitive" v-model="form.iflag" />
                        <sui-checkbox class="r2" label="Strip Non-Digits First" v-model="form.dflag" v-if="form.type === 'regex'" />
                    </sui-form-field>
                    <sui-button floated="right" positive icon="check" content="Ok" />
                    <sui-button floated="right" icon="cancel" content="Cancel" @click.prevent.stop="cancelEditor" />
                    <sui-button floated="left" basic negative icon="trash" outline content="Remove" v-if="form.id" @click.stop.prevent="promptRemove=true"/>
                    <p>&nbsp;</p>
                </sui-form>
            </sui-modal-content>
        </sui-modal> 
        <sui-modal size="tiny" v-model="promptRemove">
            <sui-modal-header>Confirm Trigger Removal</sui-modal-header>
            <sui-modal-actions>
                <div style="height: 35px;">
                    <sui-button floated="left" negative icon="trash" @click.stop.prevent="removeTrigger" content="Yes, Remove" />
                    <sui-button floated="right" icon="cancel" content="No, Cancel" @click.stop.prevent="promptRemove=false" />
                </div>
            </sui-modal-actions>
        </sui-modal>
    </div>
</template>

<script>

const util = require('../util');
const builtins = require('./builtins').builtins;

const REFRESH_POLL_RATE = 15000;

const resetForm = {
    id: null,
    label: '',
    notify: '',
    type: 'terms',
    pattern: '',
    iflag: false,
    dflag: false,
    direction: 'any'
}
const resetErrors = {
    label: undefined,
    notify: undefined,
    pattern: undefined
}

async function saveTrigger(trigger) {
    this.loading = true;
    let result;
    try {
        result = await util.fetch.call(
            this, 
            `/api/monitor/trigger/v1/${trigger.id ? trigger.id : ''}`, 
            { method: trigger.id ? 'put' : 'post', body: { trigger } }
        );
        console.log('got back post/put result', result);
        this.loading = false;
    } catch (err) {
        console.error(err);
        this.loading = false;
        return false;
    }
    if (result.ok) {
        this.getTriggers();
    } else {
        Object.keys(result.theJson).filter(key => Array.isArray(result.theJson[key])).forEach(key => result.theJson[key] = result.theJson[key].join('; '))
        Object.assign(this.error, resetErrors, result.theJson)
    }
    return result;
}

module.exports = {
    data: () => ({ 
        global: shared.state,
        interval: null,
        showEditor: false,
        promptRemove: false,
        builtins: builtins.map((b, i) => { return { text: b.label, value: i }; }),
        triggerTypes: [{ text: 'Terms List (one per line)', value: 'terms', placeholder: 'enter list of terms (one per line)'}, { text: 'Regex (for experts)', value: 'regex', placeholder: 'enter regex here' }],
        selectedBuiltin: null, 
        loading: false,
        form: {
            id: undefined,
            label: undefined,
            notify: undefined,
            type: undefined,
            pattern: undefined,
            iflag: undefined,
            dflag: undefined,
            direction: undefined
        },
        error: {
            label: undefined,
            pattern: undefined,
            notify: undefined,
        },
        triggers: []
    }),
    computed: {
        triggerTypePlaceholder() {
            return this.form.type && this.triggerTypes.find(t => t.value === this.form.type).placeholder;
        }
    },
    watch: {
        'form.label'() { this.error.label = undefined; },
        'form.pattern'() { this.error.pattern = undefined; },
        'form.type'() { this.error.pattern = undefined; },
        'form.notify'() { this.error.notify = undefined; },
        selectedBuiltin(val) {
            if (typeof val === 'number') {
                const builtin = builtins[val];
                this.selectedBuiltin = null;

                Object.assign(this.form, builtin);
                this.form.direction = 'any';
            }
        }
    },
    methods: {
        getTriggers() {
            const q = 'state_neq=hidden';
            util.fetch.call(this, '/api/monitor/trigger/v1?' + q)
            .then(result => {
                console.log('getTriggers result is', result);
                this.triggers = result.theJson.triggers;
                this.triggers.forEach(t => t.isActive = t.state === 'active')
            });
        },
        gotoFlagged(trigger) {
            this.$router.push({ name: 'trigger', params: { id: trigger.id }});
        },
        editTrigger(trigger) {
            Object.assign(this.form, { id: trigger.id }, trigger.def);
            Object.assign(this.error, resetErrors);
            this.showEditor = true;
        },
        addTrigger() {
            Object.assign(this.form, resetForm);
            Object.assign(this.error, resetErrors);
            this.showEditor = true;
        },
        cancelEditor() {
            this.showEditor = false;
        },
        toggleTrigger(trigger) {
            if (trigger.isActive !== (trigger.state === 'active')) {
                trigger.state = trigger.isActive ? 'active' : 'inactive';
                saveTrigger.call(this, Object.assign({ id: trigger.id, state: trigger.state }, trigger.def));
            }
        },
        removeTrigger() {
            saveTrigger.call(this, Object.assign({ id: this.form.id, state: 'hidden' }, this.form));
            this.promptRemove = false;
            this.showEditor = false;
        },
        saveTrigger() {
            this.form.label = this.form.label.trim();
            this.form.pattern = this.form.pattern.trim();
            this.form.notify = this.form.notify.trim();

            this.error.label = this.form.label ? undefined : 'Label is required.';
            this.error.pattern = this.form.pattern ? undefined : 'This field is required.';
            this.error.notify = this.form.notify ? undefined : 'Notification distribution is required.';
            const err = this.error.label || this.error.pattern || this.error.notify;

            if (!err) {
                saveTrigger.call(this, Object.assign({ state: 'active' }, this.form))
                .then(result => {
                    if (result.ok) {
                        this.showEditor = false;
                    }
                });
            }
        }
    },
    mounted: function() {
        util.checkPrerequisites.call(this);

        Object.assign(this.form, resetForm);
        this.getTriggers();
        this.interval = setInterval(() => this.getTriggers(), REFRESH_POLL_RATE); 
    },
    beforeDestroy: function() {
        clearInterval(this.interval);
    }
}
</script>