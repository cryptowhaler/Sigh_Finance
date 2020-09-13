import Vue from 'vue';
import Router from 'vue-router';
import History from '@/components/History/History.vue';
import BalanceTransfer from '@/components/BalanceTransfer/BalanceTransfer.vue';
import SummaryVega from '@/components/BalanceTransfer/SummaryVegaWallet/SummaryVegaWallet.vue';
import ActiveOrdersMobile from '@/components/ActiveOrdersMobile/ActiveOrders.vue';
import RecentTradesMobile from '@/components/RecentTradesMobile/RecentTrades.vue';
import PositionsMobile from '@/components/PositionsMobile/Positions.vue';
import LocalStorage from '@/utils/localStorage.js';
import EventBus, {  EventNames,} from '@/eventBuses/default';
import Landing from '@/components/Trade/Landing.vue';
import mainPage from '@/components/Landing/mainPage.vue'; //CHARTING LIBRARY


// import TradeModalMobile from '@/components/TradeModalMobile/TradeModalMobile';

Vue.use(Router);

const vueRouter = new Router({
  routes: [{
    path: '/',
    name: 'Landing Page',
    component: mainPage,
    meta: {
      pageTitle: 'LifeOrDream.Studio | Fin-Tech to propel Space-Tech',
    },
  },
  //TV CONTAINER - TRADING_VIEW (below)
          {
            path: '/Trade',        //MOBILE - ACTIVE ORDERS SIDE BAR
            name: 'LifeOrDream.Studio | Trade-Alogs',
            component: Landing,
            meta: {
              pageTitle: 'Trade-Alogs | Invest/Hedge with Trading Strategies',
            },
          },
  //TV CONTAINER - TRADING_VIEW (above)
           {
             path: '/active-orders',        //MOBILE - ACTIVE ORDERS SIDE BAR
             name: 'Trade-Alogs | Active Orders',
             component: ActiveOrdersMobile,
             meta: {
               pageTitle: 'Trade-Alogs | Active Orders',
             },
           },
           {
            path: '/recent-trades',       //MOBILE - RECENT TRADES SIDE BAR
            name: 'Trade-Alogs | Recent Trades',
            component: RecentTradesMobile,
            meta: {
              pageTitle: 'Trade-Alogs | Recent Trades',
            },
          },
          {
            path: '/positions',       //MOBILE - POSITIONS SIDE BAR
            name: 'Trade-Alogs | Positions',
            component: PositionsMobile,
            meta: {
              pageTitle: 'Trade-Alogs | Positions',
            },
          },

          //  {
          //    path: '/trade-modal',
          //    name: 'trade-modal-mobile',
          //    component: TradeModalMobile,
          //    meta: {
          //      pageTitle: 'Trade',
          //    },
          //  },
           {
             path: '/balance',
             component: BalanceTransfer,
             meta: {
               pageTitle: 'TRADE-ALOGS | Balance Information',
               needLogin: false,
             },
             children: [{
               path: '',
               name: 'wallet-summary-vega',
               component: SummaryVega,
               meta: {
                 pageTitle: 'TRADE-ALOGS |  Balance Information',
                 needLogin: false,
               },
             }, ],
           },
           {
             path: '/history',
             name: 'history',
             component: History,
             meta: {
               pageTitle: 'TRADE-ALOGS | Account History',
               needLogin: false,
             },

           },
  ],
});

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
