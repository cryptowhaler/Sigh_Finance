import Vue from 'vue';
import Router from 'vue-router';
import LocalStorage from '@/utils/localStorage.js';
import EventBus, {  EventNames,} from '@/eventBuses/default';
import Landing from '@/components/Trade/Landing.vue';
import mainPage from '@/components/Landing/mainPage.vue'; //CHARTING LIBRARY
import newPage from '@/components/new/newPage.vue';


// import TradeModalMobile from '@/components/TradeModalMobile/TradeModalMobile';

Vue.use(Router);

const vueRouter = new Router({
  routes: [
  {
    path: '/',
    name: 'Landing Page',
    component: mainPage,
    meta: {
      pageTitle: 'SIGH Finance | A money-market protocol with an Engineered Liquidity mining Pipeline addressing the volatility problem pertaining to crypto assets.',
    },
  },
  {
    path: '/test',
    name: 'Testing',
    component: newPage,
    meta: {
      pageTitle: 'SIGH Finance | A money-market protocol with an Engineered Liquidity mining Pipeline addressing the volatility problem pertaining to crypto assets.',
    },
  },
  {
    path: '/Trade',        
    name: 'SIGH Finance | SIGH Finance',
    component: Landing,
    meta: {
      pageTitle: 'SIGH Finance | A money-market protocol with an Engineered Liquidity mining Pipeline addressing the volatility problem pertaining to crypto assets.',
      },
  },
  // {   //MOBILE - ACTIVE ORDERS SIDE BAR
  //   path: '/trade-modal',
  //   name: 'trade-modal-mobile',
  //   component: TradeModalMobile,
  //   meta: {
  //     pageTitle: 'Trade',
  //   },
  // }
]});

vueRouter.beforeEach((to, from, next) => {
  if (to.meta.needLogin && !LocalStorage.isUserLoggedIn()) {
    EventBus.$emit(EventNames.userSessionExpired);
    return next(false);
  }
  document.title = to.meta.pageTitle;
  return next();
});

vueRouter.afterEach(() => {
  Vue.nextTick().then(() => {
    window.scrollTo(0, 1);
    window.scrollTo(0, 0);
  });
});

export default vueRouter;
