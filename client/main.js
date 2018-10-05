addEventListener('load', main);
function main() {
    const Vue = require('vue');
    const VueRouter = require('vue-router');
    const SuiVue = require('semantic-ui-vue');
    Vue.use(VueRouter);
    Vue.use(SuiVue.default);
    Vue.use(require('vue-cookies'));

    const Root = require('./root.vue');
    const routes = [
        { path: '/welcome', name: 'welcome', component: require('./welcome/welcome.vue') },
        { path: '/graphAuth', name: 'graphAuth', component: require('./auth/graphAuth.vue') },
        { path: '/onboard/tag', name: 'onboardTag', component: require('./onboard/onboardTag.vue') },
        { path: '/onboard/auth/:type/:tag', name: 'onboardAuth', component: require('./onboard/onboardAuth.vue') },
        { path: '/main/:dist', name: 'main', component: require('./mainMenu/mainMenu.vue') },
        { path: '/schedule/:eventId', name: 'schedule', component: require('./scheduleEvent/scheduleEvent.vue') },
        { path: '*', redirect: 'welcome' }
    ];

    const router = new VueRouter({
        mode: 'history',
        routes
    });

    new Vue({
        el: '#app',
        router,
        render: function (createElement) {
            return createElement(Root);
        }
    });
}