import Vue from 'vue';
import Router from 'vue-router';
import BalanceTransfer from '@/components/BalanceTransfer/BalanceTransfer.vue';
import SummaryVega from '@/components/BalanceTransfer/SummaryVegaWallet/SummaryVegaWallet.vue';
import ActiveOrdersMobile from '@/components/ActiveOrdersMobile/ActiveOrders.vue';
import RecentTradesMobile from '@/components/RecentTradesMobile/RecentTrades.vue';
import PositionsMobile from '@/components/PositionsMobile/Positions.vue';
import LocalStorage from '@/utils/localStorage.js';
import EventBus, {  EventNames,} from '@/eventBuses/default';
import Landing from '@/components/Trade/Landing.vue';
import mainPage from '@/components/Landing/mainPage.vue'; //CHARTING LIBRARY

import newPage from '@/components/new/newPage.vue';


// import TradeModalMobile from '@/components/TradeModalMobile/TradeModalMobile';

Vue.use(Router);

const vueRouter = new Router({
  routes: [{
    path: '/',
    name: 'Landing Page',
    component: mainPage,
    meta: {
      pageTitle: 'SIGH Finance | A money-market protocol with an Engineered Liquidity mining Pipeline addressing the volatility problem pertaining to crypto assets.',
    },
  },
  // {
  //   path: '/test',
  //   name: 'Testing',
  //   component: newPage,
  //   meta: {
  //     pageTitle: 'SIGH Finance | A money-market protocol with an Engineered Liquidity mining Pipeline addressing the volatility problem pertaining to crypto assets.',
  //   },
  // },
  // { path: '/', name: 'home', component: Home },
  // {
  //   path: '/pool/:id',
  //   component: Pool,
  //   children: [
  //     { path: '', name: 'pool', component: PoolTokens },
  //     { path: 'swaps', name: 'pool-swaps', component: PoolSwaps },
  //     { path: 'shares', name: 'pool-shares', component: PoolShares },
  //     { path: 'about', name: 'pool-about', component: PoolAbout }
  //   ]
  // },

  //TV CONTAINER - TRADING_VIEW (below)
          {
            path: '/Trade',        //MOBILE - ACTIVE ORDERS SIDE BAR
            name: 'SIGH Finance | SIGH Finance',
            component: Landing,
            meta: {
              pageTitle: 'SIGH Finance | A money-market protocol with an Engineered Liquidity mining Pipeline addressing the volatility problem pertaining to crypto assets.',
            },
          },
  //TV CONTAINER - TRADING_VIEW (above)
          //  {
          //    path: '/active-orders',        //MOBILE - ACTIVE ORDERS SIDE BAR
          //    name: 'SIGH Finance | Active Orders',
          //    component: ActiveOrdersMobile,
          //    meta: {
          //      pageTitle: 'SIGH Finance | Active Orders',
          //    },
          //  },
          //  {
          //   path: '/recent-trades',       //MOBILE - RECENT TRADES SIDE BAR
          //   name: 'SIGH Finance | Recent Trades',
          //   component: RecentTradesMobile,
          //   meta: {
          //     pageTitle: 'SIGH Finance | Recent Trades',
          //   },
          // },
          // {
          //   path: '/positions',       //MOBILE - POSITIONS SIDE BAR
          //   name: 'SIGH Finance | Positions',
          //   component: PositionsMobile,
          //   meta: {
          //     pageTitle: 'SIGH Finance | Positions',
          //   },
          // },

          //  {
          //    path: '/trade-modal',
          //    name: 'trade-modal-mobile',
          //    component: TradeModalMobile,
          //    meta: {
          //      pageTitle: 'Trade',
          //    },
          //  },
          //  {
          //    path: '/balance',
          //    component: BalanceTransfer,
          //    meta: {
          //      pageTitle: 'SIGH Finance | Balance Information',
          //      needLogin: false,
          //    },
          //    children: [{
          //      path: '',
          //      name: 'wallet-summary-vega',
          //      component: SummaryVega,
          //      meta: {
          //        pageTitle: 'SIGH Finance |  Balance Information',
          //        needLogin: false,
          //      },
          //    }, ],
          //  },
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
