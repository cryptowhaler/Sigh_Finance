import Vue from 'vue';
import config from '@/config';

const state = {
  init: false,
  loading: false,
  address: '',
  name: '',
  balances: {},
  pools: [],
  totalMarketcap: 0,
  totalVolume1Day: 0,
  sharesOwned: [],
  poolsById: {},
  proxy: '',
  sidebarIsOpen: false
};

const mutations = {
  SET(_state, payload) {
    Object.keys(payload).forEach(key => {
      Vue.set(_state, key, payload[key]);
    });
  }
};

const actions = {

  //Called when page is loaded (in app)
  init: async ({ commit, dispatch }) => {
    commit('SET', { loading: true });
    const tokenIds = Object.keys(config.tokens).map(tokenAddress => config.tokens[tokenAddress].id).filter(tokenId => !!tokenId);
    await Promise.all([ dispatch('getBalancer'), dispatch('loadPricesById', tokenIds), dispatch('initTokenMetadata') ]);
    await dispatch('loadBackupProvider');
    const connector = await Vue.prototype.$auth.getConnector();
    if (connector) 
      await dispatch('login', connector);
    commit('SET', { loading: false, init: true });
  },

  loading: ({ commit }, payload) => {
    commit('SET', { loading: payload });
  },

  //For mobile (sidebar handling)
  toggleSidebar: ({ commit }) => {
    commit('SET', { sidebarIsOpen: !state.sidebarIsOpen });
  },

  //For mobile (sidebar handling)  
  hideSidebar: ({ commit }) => {
    commit('SET', { sidebarIsOpen: false });
  }
};

export default {
  state,
  mutations,
  actions
};
