import Vue from 'vue';
import autofocus from 'vue-autofocus-directive';
import VueSwitch from '@vue/ui/src/components/VueSwitch.vue';
import infiniteScroll from 'vue-infinite-scroll';
import Jazzicon from 'vue-jazzicon';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import mixins from '@/mixins';
import i18n from '@/i18n';
import '@/lock';
import '@/style.scss';

// Infinite scroll displays only a limited amount of rows and shows you more once you hit the bottom of you page.
Vue.use(infiniteScroll);

// you can use require.context to globally register common base components
const requireComponent = require.context('@/components', true, /[\w-]+\.vue$/);
requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName);
  const componentName = upperFirst(
    camelCase(fileName.replace(/^\.\//, '').replace(/\.\w+$/, ''))
  );
  Vue.component(componentName, componentConfig.default || componentConfig);
});

//vue-jazzicon: A dead-simple Jazzicon component for Vue. This component is made to be identical to the visual 
// identifiers present in the metamask project, in order to create visual continuity between a dApp and the metamask plugin 
// which may be used to sign ethereum transactions; (creates logo based on address)
Vue.component('jazzicon', Jazzicon);
Vue.component('VueSwitch', VueSwitch);

//adding the mixin globally defined in ./mixins.ts
Vue.mixin(mixins);

// When the page loads, the element with the directive gains focus 
Vue.directive('autofocus', autofocus);

// Hello, I read that I'd need to add the above config option to disable the (annoying)
// production mode warning ("You are running Vue in development mode.") 
Vue.config.productionTip = false;

new Vue({
  i18n,
  router,
  store,
  render: h => h(App)
}).$mount('#app');
