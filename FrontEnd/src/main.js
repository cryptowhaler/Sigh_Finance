import Vue from 'vue';
import App from '@/App/App.vue';
import router from './router';
import store from './store';
// import { connect, } from 'mqtt';
import LocalStorage, { Keys,VegaKeys,} from '@/utils/localStorage.js';
import EventBus, { EventNames, } from '@/eventBuses/default';
import { uuidv4, } from './utils/utility';
import '@vuikit/theme';
import '@/assets/scss/base/icons.scss';
import ApolloClient from 'apollo-client';     //Apollo GraphQL
import {WebSocketLink,} from 'apollo-link-ws'; //Apollo GraphQL
import { InMemoryCache, } from 'apollo-cache-inmemory';  //Apollo GraphQL
import VueApollo from 'vue-apollo';   //Vue-Apollo plugin
// import ApolloClient from "apollo-boost";  //BETTER
import '@/assets/scss/base/colors.scss';
import '@/assets/scss/base/core.scss';
import '@/assets/scss/base/typography.scss';
import '@/assets/scss/base/form-field.scss';
import '@/assets/scss/base/buttons.scss';
import '@/assets/scss/base/checkbox.scss';
import '@/assets/scss/base/containers.scss';
import '@/assets/scss/base/tables.scss';
import '@/assets/scss/base/scrollbar.scss';
import '@/assets/scss/base/panel.scss';
import '@/assets/scss/uk-overrides/modal.scss';
import '@/assets/scss/uk-overrides/subnav.scss';
import '@/assets/scss/uk-overrides/button.scss';
import '@/assets/scss/uk-overrides/tabs.scss';
import '@/assets/css/core.css';
import '@/assets/css/simplebar.css';
import '@/assets/css/colors.css';

// We area Link to connect ApolloClient with the GraphQL server.  
// Subsequently, we instantiate ApolloClient 
// by passing in our Link and a new instance of InMemoryCache (recommended caching solution). Finally, 
// we are adding ApolloProvider to the Vue app.


// const header = { Authorization: 'Bearer ' + VegaKeys.token, };
const vega_subs_link = new WebSocketLink({    //Link for Subscription and defining headers
  uri: 'wss://n08.n.vega.xyz/query',
  options: {
    reconnect: true,
    timeout:150000,
  },
});

// subscriptionClient.maxConnectTimeGenerator.duration = () => subscriptionClient.maxConnectTimeGenerator.max

const client = new ApolloClient({
  link: vega_subs_link,
  cache: new InMemoryCache({
    addTypename: true,
  }),
});

Vue.use(VueApollo);

const apolloProvider = new VueApollo({  //holds the Apollo client instances that can then be used by all the child components
  defaultClient: client,
});

if (!LocalStorage.get(Keys.pingUuid)) {       
  LocalStorage.set(Keys.pingUuid, uuidv4());
}

EventBus.$on(EventNames.userLogin, () => {    //AUTH Session
  store.commit('isLoggedIn', true);
});

EventBus.$on(EventNames.userLogout, () => {           //AUTH Session
  const wasLoggedIn = store.getters.isLoggedIn;
  store.commit('isLoggedIn', false);
  LocalStorage.clearVegaSession();
  // this.$store.commit
  if (router.currentRoute.path !== '/' || wasLoggedIn) {
    router.replace('/').catch(() => {});
  }
});

const isLoggedIn = LocalStorage.isUserLoggedIn();   
const loggedInUser = LocalStorage.get(VegaKeys.name);     //Vega Based
const mqttKey = LocalStorage.get(Keys.mqtt);

Vue.config.productionTip = false;

// if (!isLoggedIn) {
//   EventBus.$emit(EventNames.userLogout);
// } else {
//   EventBus.$emit(EventNames.userLogin, { username: loggedInUser,mqttKey:mqttKey,});
// }

new Vue({
  router,
  store,
  apolloProvider,
  render: h => h(App),
}).$mount('#app');

if (!isLoggedIn) {
  EventBus.$emit(EventNames.userLogout);
} else {
  EventBus.$emit(EventNames.userLogin, {username: loggedInUser,mqttKey:mqttKey, });
}

