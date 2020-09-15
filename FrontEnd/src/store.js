import Vue from 'vue';
import Vuex from 'vuex';
import {
  dateToDisplayTime,
} from '@/utils/utility';
import Web3 from 'web3';

import whitePaperInterestRateModel from '@/contracts/WhitePaperInterestRateModel.json';
import jumpRateModelV2 from '@/contracts/JumpRateModelV2.json';
import sighReservoir_ from '@/contracts/SighReservoir.json';
import SIGH from '@/contracts/SIGH.json';
import Sightroller from '@/contracts/Sightroller.json';

// import { SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION } from "constants";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    themeMode: 'default',
    theme: {
      'default': {
        'main-bg-color': '#0e1e23',
        'header-bg-color': '#203238',
        'header-border-color': '#415b62',
        'tab-button-background-color': '#39545d',
        'primary-text-color': '#ffffff',
        'miner-sub-text-color': '#909ca0',
        'mobile-bg-color': '#edba9f',
        'green-color': '#5fd66a',
        'red-color': '#ff5353',
        'sec-mobile-bg-color': '#b37863',
        'pri-label-color': '#879fad',
        'just-black ': '#000000',
        'placeholder-color': '#999999',
        'border-bottom-color': '#1e2c31',
        'border-right-color ': '#445f66',
        'tab-color': '#38545d',
        'silder-bg-color': '#d3d3d3,',
        'secondary-modal-bg-color': '#0F1E23',
        'container-bg-color': '#121E22',
      },
    },
    username: null, //Added
    ledger: [],
    websocketStatus: 'Closed',
    activeOrders: [],       //handles orders
    recentTrades: [],       //handles recent trades
    loaderCounter: 0,
    markets: [],  //added
    mappedMarkets: new Map(),   //Added (mapped by ID)
    mappedMarketsbyName: new Map(),   //Added (mapped by name)
    loaderCancellable: false,
    isLoggedIn: true,
    sidebarOpen: false,
    tradePaneClosed: false,
    bookPaneClosed: false,
    liveTradePrice: 1,
    tickerCache: {},
    priceAnalysisSnapShot: {},
    selectedPair: 'BTC/USD',
    pubkeysArray: [],

    selectedVegaMarketName: 'ETHBTC/DEC20',    //Added
    selectedVegaMarketId: 'RTJVFCMFZZQQLLYVSXTWEN62P6AH6OCN',     //Added
    selectedVegaMarketSummary: 'December 2020 ETH vs BTC future',     //Added
    selectedVegaMarketbaseName: 'ETHBTC', //Added
    selectedVegaMarketquoteName: 'BTC', //Added

    selectedVegaMarketTradeId: 'RTJVFCMFZZQQLLYVSXTWEN62P6AH6OCN',     //Added
    selectedVegaMarketNameTrade: 'ETHBTC/DEC20',    //Added
    selectedVegaMarketSummaryTrade: 'December 2020 ETH vs BTC future',     //Added
    selectedVegaMarketbaseNameTrade: 'ETHBTC', //Added
    selectedVegaMarketquoteNameTrade: 'BTC', //Added

    totalRealizedPNL_VUSD: 0,          //Realized PNL
    totalUnrealizedPNL_VUSD: 0,        //Unrealized PNL
    totalRealizedPNL_BTC: 0,          //Realized PNL
    totalUnrealizedPNL_BTC: 0,        //Unrealized PNL

    // totalRealizedPNL: 0,
    selectedExchange: 'bitfinex',
    supportedPairs: [],
    totalPortfolioValue: 0,
    tpvCurrency: 'USD',
    limitTab: false,
    marketIOCTab: true, //Added
    limitGTCTab: false, //Added
    limitFOKTab:false,  //Added
    limitIOCTab: false, //Added
    tickerData: {},
    availablePairs: [],
    buyPrice: 0,
    sellPrice: 0,
    precision: 0.0001,


    web3: {} ,  //WEB3 INSTANCE
    web3Account: '',
    networkId: '',

  },


  getters: {
    username(state) {     //Added
      return state.username;
    },
    websocketStatus(state) {
      return state.websocketStatus;
    },
    themeMode(state) {
      return state.themeMode;
    },
    limitTab(state) {
      return state.limitTab;
    },
    marketIOCTab(state) {     //Added
      return state.marketIOCTab;
    },
    limitGTCTab(state) {      //Added
      return state.limitGTCTab;
    },
    limitFOKTab(state) {      //Added
      return state.limitFOKTab;
    },
    limitIOCTab(state) {      //Added
      return state.limitIOCTab;
    },
    supportedPairs(state) {
      return [...new Set(state.supportedPairs), ];
    },
    selectedPair(state) {
      return state.selectedPair;
    },
    selectedVegaMarket(state) {   //Added
      return {'selectedVegaMarketName':state.selectedVegaMarketName,'selectedVegaMarketId':state.selectedVegaMarketName,};
    },
    selectedVegaMarketName(state) {   //Added
      return state.selectedVegaMarketName;
    },
    pubkeysArray(state) {           //returns array having pubkeys
      return state.pubkeysArray;
    },
    selectedVegaMarketId(state) {     //Added
      return state.selectedVegaMarketId;
    },
    selectedVegaMarketSummary(state) {  //Added
      return state.selectedVegaMarketSummary;
    },
    selectedVegaMarketbaseName(state) {   //Added
      return state.selectedVegaMarketbaseName;
    },
    selectedVegaMarketquoteName(state) {    //Added
      return state.selectedVegaMarketquoteName;
    },

    selectedVegaMarketNameTrade(state) {   //Added
      return state.selectedVegaMarketNameTrade;
    },
    selectedVegaMarketTradeId(state) {     //Added
      return state.selectedVegaMarketTradeId;
    },
    selectedVegaMarketSummaryTrade(state) {  //Added
      return state.selectedVegaMarketSummaryTrade;
    },
    selectedVegaMarketbaseNameTrade(state) {   //Added
      return state.selectedVegaMarketbaseNameTrade;
    },
    selectedVegaMarketquoteNameTrade(state) {    //Added
      return state.selectedVegaMarketquoteNameTrade;
    },
    
    isLoggedIn(state) {
      return state.isLoggedIn;
    },
    currentTime() {
      return dateToDisplayTime();
    },
    ledger(state) {
      return state.ledger;
    },
    activeOrders(state) {     //returns activeOrders
      return state.activeOrders;
    },
    markets(state) {      //Added. Should store markets data
      return state.markets;
    },    
    mappedMarkets(state) {  //Added. Should store markets data
      return state.mappedMarkets;
    },
    mappedMarketsbyName(state) {  //Added. Should store markets data
      return state.mappedMarketsbyName;
    },    
    recentTrades(state) {       //gets recent trades
      return state.recentTrades;
    },
    totalUnrealizedPNL_VUSD(state) {   //totalUnrealizedPNL 
      return state.totalUnrealizedPNL_VUSD;
    },
    totalRealizedPNL_VUSD(state) {     //totalRealizedPNL
      return state.totalRealizedPNL_VUSD;
    },
    totalUnrealizedPNL_BTC(state) {   //totalUnrealizedPNL 
      return state.totalUnrealizedPNL_BTC;
    },
    totalRealizedPNL_BTC(state) {     //totalRealizedPNL
      return state.totalRealizedPNL_BTC;
    },

    showLoader(state) {
      return state > 0;
    },
    loaderCancellable(state) {
      return state.loaderCancellable;
    },
    sidebarOpen(state) {
      return state.sidebarOpen;
    },
    liveTradePrice(state) {
      return state.liveTradePrice;
    },
    tickerCache(state) {
      return state.tickerCache;
    },
    priceAnalysisSnapShot(state) {
      return state.priceAnalysisSnapShot;
    },
    selectedExchange(state) {
      return state.selectedExchange;
    },
    formattedSelectedExchange(state) {
      switch (state.selectedExchange) {
        case 'vegaProtocol':
          return 'vegaProtocol';
        default:
          return (
            state.selectedExchange.charAt(0).toUpperCase() +
                        state.selectedExchange.slice(1)
          );
      }
    },
    getTickerData(state) {
      return state.tickerData;
    },
    getccTickerData(state) {
      return state.tickerData[state.selectedPair.split('/')[0]][state.selectedPair].exchanges;
    },
    getAvailablePairs(state) {
      return state.availablePairs;
    },
    buyPrice(state) {
      return state.buyPrice;
    },
    sellPrice(state) {
      return state.sellPrice;
    },
    precisionSelectedpair(state) {
      return state.precision;
    },
  },


  mutations: {
    updateusername(state,name) {  //Added
      state.username = name;
    },
    changeWebsocketStatus(state, websocketStatus) {
      state.websocketStatus = websocketStatus;
    },
    changeHedgeTab(state) {     //Added
      state.limitTab = true;
    },
    changeToLimitFOKTab(state) {     //Added
      state.limitFOKTab = true;
    },
    changeToLimitGTCTab(state) {     //Added
      state.limitGTCTab = true;
    },
    changeToLimitIOCTab(state) {     //Added
      state.limitIOCTab = true;
    },
    changeInvestTab(state) {    //Added
      state.limitTab = false;
    },
    totalUnrealizedPNL_VUSD(state,val) {  //Added
      state.totalUnrealizedPNL_VUSD = val;
    },
    totalRealizedPNL_VUSD(state,val) {      //Added
      state.totalRealizedPNL_VUSD = val;
    },    
    totalUnrealizedPNL_BTC(state,val) {  //Added
      state.totalUnrealizedPNL_BTC = val;
    },
    totalRealizedPNL_BTC(state,val) {      //Added
      state.totalRealizedPNL_BTC = val;
    },    
    changeInvest_Invest_Tab(state) {
      state.marketIOCTab = false;
    },
    changeInvest_Withdraw_Tab(state) {
      state.marketIOCTab = true;
    },

    isLoggedIn(state, isLoggedIn) {
      state.isLoggedIn = isLoggedIn;
    },
    ledger(state, newLedger) {
      state.ledger = newLedger;
      store.commit('totalPortfolioValue');
    },
    activeOrders(state, newValue) {   //Replace all orders
      state.activeOrders = newValue;
    },
    addToActiveOrders(state,newOrder) {   //Add new order 
      state.activeOrders.unshift(newOrder);
      // console.log(state.activeOrders);
      if (state.activeOrders.length > 50) {
        state.activeOrders.pop();
      }
    },
    removeFromActiveOrders(state,orderID) {
      for (let i=0; i<state.activeOrders.length; i++) {
        if (state.activeOrders[i].id == orderID) {
          let cur = state.activeOrders[i];
          let index = state.activeOrders.indexOf(cur);
          // console.log('DELETING ORDER - ' + cur + ' ' + index); 
          state.activeOrders.splice(index,1);
          // console.log(state.activeOrders);
        }
      }
    },
    markets(state, newMarkets) {  //Added for markets. Should function properly
      // console.log(newMarkets);
      state.markets = newMarkets;
      // console.log(state.markets);
    },
    mappedMarkets(state,newMarket) {  //Added for markets. Should function properly
      // console.log(newMarket);
      state.mappedMarkets.set(newMarket.id,newMarket.data);
      // console.log(state.mappedMarkets);
    },
    mappedMarketsbyName(state,newMarket) {  //Added for markets. Should function properly
      // console.log(newMarket);
      state.mappedMarketsbyName.set(newMarket.data.name,newMarket); 
      // console.log('MAPPED MARKETS BY NAME -' - state.mappedMarketsbyName);
    },    
    recentTrades(state, newValue) {     //sets the recent trades
      state.recentTrades = newValue;
    },
    addToRecentTrades(state,trade) {    //Adds new trade to recent Trades
      state.recentTrades.unshift(trade);
      if (state.recentTrades.length > 50) {
        state.recentTrades.pop();
      }
    },
    addLoaderTask(state, count, cancellable = false) {
      // // console.log(count);
      state.loaderCounter += count;
      state.loaderCancellable = cancellable;
    },
    removeLoaderTask(state, count) {
      // // console.log(count);
      if (state.loaderCounter > 0) {
        state.loaderCounter -= count;
        state.loaderCancellable = false;
      } else if (state.loaderCounter < 0) {
        state.loaderCounter = 0;
      }
    },
    toggleSidebar(state) {    //Disables/Enables page scroll when side-bar is loaded (mobile)
      if (!state.sidebarOpen) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleTradePaneClosed(state) {
      state.tradePaneClosed = !state.tradePaneClosed;
    },
    toggleBookPaneClosed(state) {
      state.bookPaneClosed = !state.bookPaneClosed;
    },
    closeSidebar(state) {
      if (!state.sidebarOpen) {
        return;
      }
      this.commit('toggleSidebar');
    },
    liveTradePrice(state, ltp) {
      state.liveTradePrice = ltp;
    },
    tickerCache(state, ticker) {
      state.tickerCache = ticker;
    },
    priceAnalysisSnapShot(state, snapshot) {
      state.priceAnalysisSnapShot = snapshot;
    },
    selectedExchange(state, exchange) {
      state.selectedExchange = exchange;
    },
    selectedPair(state, exchange) {
      state.selectedPair = exchange;
    },
    changeSelectedVegaMarket(state,newMarket) { //ADDED
      // console.log('In Store - ' );
      state.selectedVegaMarketName = newMarket.Name;
      state.selectedVegaMarketId = newMarket.Id;
      // console.log(typeof(newMarket.Id));
      // console.log(state.selectedVegaMarketName + ' ' + state.selectedVegaMarketId );
      // console.log(typeof(state.selectedVegaMarketId));
      state.selectedVegaMarketId = toString(state.selectedVegaMarketId);
      // console.log(typeof(state.selectedVegaMarketId));
    },
    changeSelectedVegaMarketSummary(state,summary) {  //Added
      state.selectedVegaMarketSummary = summary;
    },
    changeSelectedVegaMarketbaseName(state,baseName) {  //Added
      state.selectedVegaMarketbaseName = baseName;
    },
    changeSelectedVegaMarketquoteName(state,quoteName) {  //Added
      state.selectedVegaMarketquoteName = quoteName;
    },
////////////////////
    changeSelectedVegaMarketNameTrade(state,Name) {  //Added (TradeTab)
      state.selectedVegaMarketNameTrade = Name;
    },    
    changeSelectedVegaMarketTradeId(state,Id) {  //Added (TradeTab)
      state.selectedVegaMarketTradeId = Id;
    },    
    changeSelectedVegaMarketSummaryTrade(state,summary) {  //Added (TradeTab)
      state.selectedVegaMarketSummaryTrade = summary;
    },
    changeSelectedVegaMarketbaseNameTrade(state,baseName) {  //Added (TradeTab)
      state.selectedVegaMarketbaseNameTrade = baseName;
    },
    changeSelectedVegaMarketquoteNameTrade(state,quoteName) {  //Added (TradeTab)
      state.selectedVegaMarketquoteNameTrade = quoteName;
    },
    



    addSupportedPair() {
      // state.supportedPairs.push(pair);
    },
    totalPortfolioValue(state) {
      state.totalPortfolioValue = state.ledger
                .reduce((tpv, {
                  currency,
                  total,
                }) => {
                  currency = currency.toUpperCase();
                  let sellPrice = 1;
                  if (currency !== state.tpvCurrency) {
                    sellPrice =
                            ((((
                              (state.tickerData[currency] || {})[
                                    `${currency}/${state.tpvCurrency}`
                              ] || {}
                            ).best || {}).bids || {})[0] || {}).price || 0;
                  }
                  tpv += sellPrice * total;
                  return tpv;
                }, 0)
                .toFixed(3);
    },
    changeTickerData(state, data) {
      // alert("change");
      state.tickerData = data;
    },
    changePairData(state, data) {
      state.availablePairs = data;
    },
    buyPrice(state, price) {
      state.buyPrice = price;
    },
    sellPrice(state, price) {
      state.sellPrice = price;
    },
    precisionMap(state, map) {
      state.precision = map;
    },
    // SIGH FINANCE DEVELOPMENTS
    SET_WEB3(state, payload) {
      state.web3 = payload;
      console.log(payload);
      console.log(state.web3);
    },
    SET_ACCOUNT(state, payload) {
      state.web3Account = payload;
      console.log(payload);
      console.log(state.web3Account);
    },
    SET_NETWORK_ID(state, payload) {
      state.networkId = payload;
      console.log(payload);
      console.log(state.networkId);
    }

  },


  actions: {

    // CONNECTS TO WEB3 NETWORK (GANACHE/KOVAN/ETHEREUM/BSC ETC)
    loadWeb3: async ({ commit }) => {
      if (window.ethereum) {
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');  //CONNECTING TO GANACHE
        const web3 = new Web3(provider);
        commit('SET_WEB3',web3);
        // state.web3 = new Web3(window.ethereum);

        // try {        // Request account access if needed
        //   await window.ethereum.enable();
        //   return state.web3;
        // } 
        // catch (error) {
        //   console.log('NOT enabled');        
        //   console.error(error);
        // }
      }
      // // For older version dapp browsers ...
      else if (window.web3) {      //   // Use Mist / MetaMask's provider.
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');  //CONNECTING TO GANACHE
        const web3 = new Web3(provider);
        commit('SET_WEB3',web3);
        // state.web3 = window.web3;
        // console.log('Injected web3 detected.', window.web3);
        return web3;
      }
      // If the provider is not found, it will default to the local network ...
      else {
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');  //CONNECTING TO GANACHE
        const web3 = new Web3(provider);
        commit('SET_WEB3',web3);
        console.log('No web3 instance injected, using Local web3.');
        return web3;
      }
    },

    // SETS ACCOUNT AND NETWORK ID
    getBlockchainData: async ({commit,state}) => {
      const web3 = state.web3;
      const accounts = await web3.eth.getAccounts();
      console.log(accounts);
      commit('SET_ACCOUNT',accounts[0]);
      const networkId = await web3.eth.net.getId(); 
      commit('SET_NETWORK_ID',networkId);
     },

    //  WHITEPAPER_INTEREST_RATE_MODEL CONTRACT CALLS (START)

    whitePaperModelChangeBaseParamters: async ({commit,state},{baseRatePerYear, multiplierPerYear}) => {
      const web3 = state.web3;
      console.log(web3);
      const whitePaperModel = whitePaperInterestRateModel.networks[state.networkId];
      console.log(whitePaperModel);
      if (whitePaperModel) {
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, whitePaperModel.address );
        console.log(interestRateModel);
        interestRateModel.methods.setBaseParameters(baseRatePerYear,multiplierPerYear).send({from: state.web3Account})
        .then(receipt => { 
          console.log(receipt);
          })
        .catch(error => {
          console.log(error);
        })
      }
      else {
        console.log('Contract not deployed');
      }
    },
    
    whitePaperModelUtilRate: async ({commit,state},{cash, borrows, reserves}) => {
      const web3 = state.web3;
      console.log(web3);
      const whitePaperModel = whitePaperInterestRateModel.networks[state.networkId];
      console.log(whitePaperModel);
      if (whitePaperModel) {
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, whitePaperModel.address );
        console.log(interestRateModel);
        const utilRate = await interestRateModel.methods.utilizationRate(cash,borrows,reserves).call();        
        console.log( 'UTIL RATE - ' + utilRate);
      }
      else {
        console.log('Contract not deployed');
      }
    },
 
     whitePaperModelBorrowRate: async ({commit,state},{cash, borrows, reserves}) => {
      const web3 = state.web3;
      console.log(web3);
      const whitePaperModel = whitePaperInterestRateModel.networks[state.networkId];
      console.log(whitePaperModel);
      if (whitePaperModel) {
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, whitePaperModel.address );
        console.log(interestRateModel);
        const borrowRate = await interestRateModel.methods.getBorrowRate(cash,borrows,reserves).call();
        console.log( 'BORROW RATE - ' + borrowRate);
      }
    },

    whitePaperModelSupplyRate: async ({commit,state},{cash, borrows, reserves, reserveMantissa}) => {
      const web3 = state.web3;
      console.log(web3);
      const whitePaperModel = whitePaperInterestRateModel.networks[state.networkId];
      console.log(whitePaperModel);
      if (whitePaperModel) {
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, whitePaperModel.address );
        console.log(interestRateModel);
        const supplyRate = await interestRateModel.methods.getSupplyRate(cash,borrows,reserves,reserveMantissa).call();
        console.log( 'SUPPLY RATE - ' + supplyRate);
      }
    },

    whitePaperModelgetBaseRatePerBlock: async ({commit,state}) => {
      const web3 = state.web3;
      console.log(web3);
      const whitePaperModel = whitePaperInterestRateModel.networks[state.networkId];
      console.log(whitePaperModel);
      if (whitePaperModel) {
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, whitePaperModel.address );
        console.log(interestRateModel);
        const baseRatePerBlock = await interestRateModel.methods.baseRatePerBlock().call();
        console.log( 'baseRatePerBlock - ' + baseRatePerBlock);
      }
    },

    whitePaperModelgetMultiplierPerBlock: async ({commit,state}) => {
      const web3 = state.web3;
      console.log(web3);
      const whitePaperModel = whitePaperInterestRateModel.networks[state.networkId];
      console.log(whitePaperModel);
      if (whitePaperModel) {
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, whitePaperModel.address );
        console.log(interestRateModel);
        const multiplierPerBlock = await interestRateModel.methods.multiplierPerBlock().call();
        console.log( 'multiplierPerBlock - ' + multiplierPerBlock);
      }
    },


    //  WHITEPAPER_INTEREST_RATE_MODEL CONTRACT CALLS (END)

    //  JUMP_INTEREST_RATE_MODEL__V2 CONTRACT CALLS (START)

    jumpV2ModelChangeBaseParamters: async ({commit,state},{baseRatePerYear, multiplierPerYear,jumpMultiplierPerYear,kink_}) => {
      const web3 = state.web3;
      console.log(web3);
      const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
      console.log(jumpModelV2);
      if (jumpModelV2) {
        const interestRateModel = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
        console.log(interestRateModel);
        interestRateModel.methods.updateJumpRateModel(baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_).send({from: state.web3Account})
        .then(receipt => { 
          console.log(receipt);
          })
        .catch(error => {
          console.log(error);
        })
      }
      else {
        console.log('Contract not deployed');
      }
    },

    jumpV2ModelUtilRate: async ({commit,state},{cash, borrows, reserves}) => {
      const web3 = state.web3;
      console.log(web3);
      const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
      console.log(jumpModelV2);
      if (jumpModelV2) {
        const jumpModel_V2 = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
        console.log(jumpModel_V2);
        const utilRate = await jumpModel_V2.methods.utilizationRate(cash,borrows,reserves).call();        
        console.log( 'UTIL RATE - ' + utilRate);
      }
      else {

      }
    },

    jumpV2ModelBorrowRate: async ({commit,state},{cash, borrows, reserves}) => {
     const web3 = state.web3;
     console.log(web3);
     const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
     console.log(jumpModelV2);
     if (jumpModelV2) {
       const jumpModel_V2 = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
       console.log(jumpModel_V2);
       const borrowRate = await jumpModel_V2.methods.getBorrowRate(cash,borrows,reserves).call();
       console.log( 'BORROW RATE - ' + borrowRate);
     }
   },

    jumpV2ModelSupplyRate: async ({commit,state},{cash, borrows, reserves, reserveMantissa}) => {
     const web3 = state.web3;
     console.log(web3);
     const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
     console.log(jumpModelV2);
     if (jumpModelV2) {
       const jumpModel_V2 = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
       console.log(jumpModel_V2);
       const supplyRate = await jumpModel_V2.methods.getSupplyRate(cash,borrows,reserves,reserveMantissa).call();
       console.log( 'SUPPLY RATE - ' + supplyRate);
     }
   },

   jumpV2ModelgetBaseRatePerBlock: async ({commit,state}) => {
    const web3 = state.web3;
    console.log(web3);
    const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
    console.log(jumpModelV2);
    if (jumpModelV2) {
      const interestRateModel = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
      console.log(interestRateModel);
      const baseRatePerBlock = await interestRateModel.methods.baseRatePerBlock().call();
      console.log( 'baseRatePerBlock - ' + baseRatePerBlock);
    }
  },

  jumpV2ModelgetMultiplierPerBlock: async ({commit,state}) => {
    const web3 = state.web3;
    console.log(web3);
    const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
    console.log(jumpModelV2);
    if (jumpModelV2) {
      const interestRateModel = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
      console.log(interestRateModel);
      const multiplierPerBlock = await interestRateModel.methods.multiplierPerBlock().call();
      console.log( 'multiplierPerBlock - ' + multiplierPerBlock);
    }
  },

  jumpV2ModelgetJumpMultiplierPerBlock: async ({commit,state}) => {
    const web3 = state.web3;
    console.log(web3);
    const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
    console.log(jumpModelV2);
    if (jumpModelV2) {
      const interestRateModel = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
      console.log(interestRateModel);
      const jumpMultiplierPerBlock = await interestRateModel.methods.jumpMultiplierPerBlock().call();
      console.log( 'jumpMultiplierPerBlock - ' + jumpMultiplierPerBlock);
    }
  },

  jumpV2ModelgetKink: async ({commit,state}) => {
    const web3 = state.web3;
    console.log(web3);
    const jumpModelV2 = jumpRateModelV2.networks[state.networkId];
    console.log(jumpModelV2);
    if (jumpModelV2) {
      const interestRateModel = new web3.eth.Contract(jumpRateModelV2.abi, jumpModelV2.address );
      console.log(interestRateModel);
      const kink = await interestRateModel.methods.kink().call();
      console.log( 'kink - ' + kink);
    }
  },

   //  JUMP_INTEREST_RATE_MODEL___V2 CONTRACT CALLS (END)

    // SIGH_TOKEN RESERVOIR BASED FUNCTIONS (START)

  sighReservoirBeginDripping: async ({commit,state}, {dripRate,targetAddress}) => {
        const web3 = state.web3;
        const sighReservoir = sighReservoir_.networks[state.networkId];
        console.log(sighReservoir);
        if (sighReservoir) {
          sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
          console.log(sighReservoirContract);
          sighReservoirContract.methods.beginDripping(dripRate,targetAddress).send({from: state.web3Account})
          .then(receipt => {
            console.log(receipt);
          })
          .catch(error => {
            console.log(error);
          });
        }
    },

  sighReservoirChangeDripRate: async ({commit,state}, {dripRate}) => {
      const web3 = state.web3;
      const sighReservoir = sighReservoir_.networks[state.networkId];
      console.log(sighReservoir);
      if (sighReservoir) {
        sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
        console.log(sighReservoirContract);
        sighReservoirContract.methods.changeDripRate(dripRate).send({from: state.web3Account})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
  },

  sighReservoirDrip: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      sighReservoirContract.methods.drip().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighReservoirGetSighTokenAddress: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const sighAddress = await sighReservoirContract.methods.getSighAddress().call();
      console.log(sighAddress);
    }
  },

  sighReservoirgetTargetAddress: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const targetAddress = await sighReservoirContract.methods.getTargetAddress().call();
      console.log(targetAddress);
    }
  },

  sighReservoirgetDripStart: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const dripStart = await sighReservoirContract.methods.dripStart().call();
      console.log(dripStart);
    }
  },

  sighReservoirgetdripRate: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const dripRate = await sighReservoirContract.methods.dripRate().call();
      console.log(dripRate);
    }
  },

  sighReservoirgetlastDripBlockNumber: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const lastDripBlockNumber = await sighReservoirContract.methods.lastDripBlockNumber().call();
      console.log(lastDripBlockNumber);
    }
  },

  sighReservoirgetcurrentlyDrippedAmount: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const currentlyDrippedAmount = await sighReservoirContract.methods.currentlyDrippedAmount().call();
      console.log(currentlyDrippedAmount);
    }
  },

  sighReservoirgetadmin: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const admin = await sighReservoirContract.methods.admin().call();
      console.log(admin);
    }
  },

  // SIGH_TOKEN RESERVOIR BASED FUNCTIONS (END)

  // SIGH_TOKEN FUNCTIONS (START)

  sighInitMinting: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.initMinting().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sightransfer: async ({commit,state}, {recepient,amount}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.transfer(recepient,amount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighapprove: async ({commit,state}, {spender,amount}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.approve(spender,amount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sightransferFrom: async ({commit,state}, {sender,amount}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.transferFrom(sender,amount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighincreaseAllowance: async ({commit,state}, {spender,addedValue}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.increaseAllowance(spender,addedValue).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighdecreaseAllowance: async ({commit,state}, {spender,subtractedValue}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.decreaseAllowance(spender,subtractedValue).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighMintCoins: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.mintCoins().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighchangeReservoir: async ({commit,state},{newReservoir}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.changeReservoir(newReservoir).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sighgetRecentyMintedAmount: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const getRecentyMintedAmount = SIGH_Contract.methods.getRecentyMintedAmount().call();
      console.log(getRecentyMintedAmount);
    }
  },

  sighgetRecentMinter: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const getRecentMinter = SIGH_Contract.methods.getRecentMinter().call();
      console.log(getRecentMinter);
    }
  },

  sighgetCurrentCycle: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const getCurrentCycle = SIGH_Contract.methods.getCurrentCycle().call();
      console.log(getCurrentCycle);
    }
  },

  sighgetCurrentEra: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const getCurrentEra = SIGH_Contract.methods.getCurrentEra().call();
      console.log(getCurrentEra);
    }
  },

  sighgetallowance: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const allowance = SIGH_Contract.methods.allowance().call();
      console.log(allowance);
    }
  },

  sighgetbalanceOf: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const balanceOf = SIGH_Contract.methods.balanceOf().call();
      console.log(balanceOf);
    }
  },

  sigh_getTotalSupply: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const totalSupply = SIGH_Contract.methods.totalSupply().call();
      console.log(totalSupply);
    }
  },

  sighIsMintingActivated: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const isMintingActivated = SIGH_Contract.methods.isMintingActivated().call();
      console.log(isMintingActivated);
    }
  },

  sighgetStart_Time: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const start_Time = SIGH_Contract.methods.start_Time().call();
      console.log(start_Time);
    }
  },

  sighgetdecimals: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const decimals = SIGH_Contract.methods.decimals().call();
      console.log(decimals);
    }
  },

  sighgetsymbol: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const symbol = SIGH_Contract.methods.symbol().call();
      console.log(symbol);
    }
  },
  
  sighgetname: async ({commit,state},) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const name = SIGH_Contract.methods.name().call();
      console.log(name);
    }
  },  

  // SIGH_TOKEN FUNCTIONS (END)

  // SIGHTROLLER FUNCTIONS (START)

  //Returns the List of markets the user has entered
  sightroller_getAssetsIn: async ({commit,state}, {account}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const getAssetsIn = SIGHTROLLER_Contract.methods.getAssetsIn(account).call();
      console.log(getAssetsIn);
    }
  },

  //Checks if the user has entered the given market
  sightroller_checkMembership: async ({commit,state}, {account,token}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const checkMembership = SIGHTROLLER_Contract.methods.checkMembership(account,token).call();
      console.log(checkMembership);
    }
  },

  // User provides a list of markets (array) that he wants to enter
  sightroller_enterMarkets: async ({commit,state}, { markets }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.enterMarkets(markets).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // User provides the market that he wants to exit
  sightroller_exitMarket: async ({commit,state}, { market }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.exitMarket(market).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Checking if Mint is allowed. We update GSighSupplyIndex and distribute GSigh
  sightroller_mintAllowed: async ({commit,state}, { market,minter,mintAmount }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.mintAllowed(market,minter,mintAmount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // actualMintAmount (The amount of the underlying asset being minted)
  // mintTokens (The number of tokens being minted)
  sightroller_mintVerify: async ({commit,state}, { market,minter,actualMintAmount,mintTokens}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.mintVerify(market,minter,actualMintAmount,mintTokens).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Checking if Redeem is allowed. We update GSighSupplyIndex and distribute GSigh
  // redeemTokens (The number of cTokens to exchange for the underlying asset in the market)
  sightroller_redeemAllowed: async ({commit,state}, { market,redeemer,redeemTokens }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.redeemAllowed(market,redeemer,redeemTokens).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // actualRedeemAmount (The amount of the underlying asset being minted)
  // redeemTokens (The number of tokens being minted)
  sightroller_redeemVerify: async ({commit,state}, { market,minter,actualRedeemAmount,redeemTokens}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.redeemVerify(market,minter,actualRedeemAmount,redeemTokens).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

    // Checking if Redeem is allowed. We update GSighSupplyIndex and distribute GSigh
  // borrowAmount (The amount of underlying the account would borrow)
  sightroller_borrowAllowed: async ({commit,state}, { market,borrower,borrowAmount }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.borrowAllowed(market,borrower,borrowAmount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // borrowAmount (The amount of underlying the account would borrow)
  sightroller_borrowVerify: async ({commit,state}, { market,borrower,borrowAmount}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.borrowVerify(market,borrower,borrowAmount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

    // Checking if Redeem is allowed. We update GSighSupplyIndex and distribute GSigh
  // repayAmount (The amount of the underlying asset the account would repay)
  sightroller_repayBorrowAllowed: async ({commit,state}, { market,payer,borrower,repayAmount }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.repayBorrowAllowed(market,payer,borrower,repayAmount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // actualRepayAmount (The amount of underlying the account would repay)
  sightroller_repayBorrowVerify: async ({commit,state}, { market,payer,borrower,actualRepayAmount,borrowerIndex}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.repayBorrowVerify(market,payer,borrower,actualRepayAmount,borrowerIndex).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

      // Checking if Redeem is allowed. We update GSighSupplyIndex and distribute GSigh
  // repayAmount (The amount of the underlying asset the account would repay)
  sightroller_liquidateBorrowAllowed: async ({commit,state}, { marketBorrowed,marketCollateral,liquidator,borrower,repayAmount }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.liquidateBorrowAllowed(marketBorrowed,marketCollateral,liquidator,borrower,repayAmount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // actualRepayAmount (The amount of underlying the account would repay)
  // seizeTokens (The number of collateral market's tokens to seize)
  sightroller_liquidateBorrowVerify: async ({commit,state}, { marketBorrowed,marketCollateral,liquidator,borrower,repayAmount,seizeTokens}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.liquidateBorrowVerify(marketBorrowed,marketCollateral,liquidator,borrower,repayAmount,seizeTokens).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

      // Checking if Redeem is allowed. We update GSighSupplyIndex and distribute GSigh
  // seizeTokens (The number of collateral tokens to seize)
  sightroller_seizeAllowed: async ({commit,state}, {marketCollateral,marketBorrowed,liquidator,borrower,seizeTokens }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.seizeAllowed(marketCollateral,marketBorrowed,liquidator,borrower,seizeTokens ).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // actualRepayAmount (The amount of underlying the account would repay)
  sightroller_seizeVerify: async ({commit,state}, { marketCollateral,marketBorrowed,liquidator,borrower,seizeTokens }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.seizeVerify(marketCollateral,marketBorrowed,liquidator,borrower,seizeTokens ).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

      // Checking if Redeem is allowed. We update GSighSupplyIndex and distribute GSigh
  // transferTokens (The number of cTokens to transfer)
  sightroller_transferAllowed: async ({commit,state}, { market,src,dst,transferTokens }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.transferAllowed(market,src,dst,transferTokens).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Dummy function. For extensibility purposes. 
  // transferTokens (The number of cTokens to transfer)
  sightroller_transferVerify: async ({commit,state}, { market,src,dst,transferTokens}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.transferVerify(market,src,dst,transferTokens).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  sightroller_getAccountLiquidity: async ({commit,state}, { account}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const getAccountLiquidity = SIGHTROLLER_Contract.methods.getAccountLiquidity(account).call();
      console.log(getAccountLiquidity);
    }
  },

  // redeemTokens - The number of tokens to hypothetically redeem
  // borrowAmount -  The amount of underlying to hypothetically borrow
  sightroller_getHypotheticalAccountLiquidity: async ({commit,state}, { account,market,redeemTokens,borrowAmount}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const getAccountLiquidity = SIGHTROLLER_Contract.methods.getHypotheticalAccountLiquidity(account,market,redeemTokens,borrowAmount).call();
      console.log(getAccountLiquidity);
    }
  },  


  // actualRepayAmount -- The amount of cTokenBorrowed underlying to convert into cTokenCollateral tokens
  sightroller_liquidateCalculateSeizeTokens: async ({commit,state}, { marketBorrowed,marketCollateral,actualRepayAmount}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const getAccountLiquidity = SIGHTROLLER_Contract.methods.liquidateCalculateSeizeTokens(marketBorrowed,marketCollateral,actualRepayAmount).call();
      console.log(getAccountLiquidity);
    }
  },  
  

  // transferTokens (The number of cTokens to transfer)
  sightroller_setPriceOracle: async ({commit,state}, { newPriceOracle}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setPriceOracle(newPriceOracle).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // transferTokens (The number of cTokens to transfer)
  sightroller_setCloseFactor: async ({commit,state}, { newCloseFactorMantissa}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setCloseFactor(newCloseFactorMantissa).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // transferTokens (The number of cTokens to transfer)
  sightroller_setCollateralFactor: async ({commit,state}, { market,  newCollateralFactorMantissa }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setCollateralFactor(market,  newCollateralFactorMantissa).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_setMaxAssets: async ({commit,state}, { newMaxAssets}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setMaxAssets(newMaxAssets).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_setLiquidationIncentive: async ({commit,state}, { newLiquidationIncentiveMantissa}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setLiquidationIncentive(newLiquidationIncentiveMantissa).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_supportMarket: async ({commit,state}, { supportMarket}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.supportMarket(supportMarket).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_setPauseGuardian: async ({commit,state}, { newPauseGuardian}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setPauseGuardian(newPauseGuardian).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_setMintPaused: async ({commit,state}, { market, boolstate}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setMintPaused( market, boolstate).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },


  // transferTokens (The number of cTokens to transfer)
  sightroller_setBorrowPaused: async ({commit,state}, { market, boolstate}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setBorrowPaused(market, boolstate).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // transferTokens (The number of cTokens to transfer)
  sightroller_setTransferPaused: async ({commit,state}, { boolstate}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setTransferPaused(boolstate).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_setSeizePaused: async ({commit,state}, { boolstate}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setSeizePaused(boolstate).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // Unitroller is the storage Implementation (Function calls get redirected here from there)
  // When new Functionality contract is being initiated (Sightroller Contract needs to be updated), we use this function
  // It is used to make the new implementation to be accepted by calling a function from Unitroller.
  sightroller__become: async ({commit,state}, { unitroller}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._become(unitroller).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_refreshGsighSpeeds: async ({commit,state}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.refreshGsighSpeeds().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // Claim all the Gsigh accrued by holder in the specified markets
  sightroller_claimGSigh: async ({commit,state}, { holder, markets}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.claimGSigh(holder, markets).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_claimGSigh: async ({commit,state}, { holders,markets,borrowers,suppliers }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.claimGSigh(holders,markets,borrowers,suppliers).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // ADMIN FUNCTIONS (SIGHTROLLER)
  // ADMIN FUNCTIONS (SIGHTROLLER)
  // ADMIN FUNCTIONS (SIGHTROLLER)
  // ADMIN FUNCTIONS (SIGHTROLLER)

  // transferTokens (The number of cTokens to transfer)
  sightroller_setGsighRate: async ({commit,state}, { gsighRate_}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.setGsighRate(gsighRate_).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },


  // transferTokens (The number of cTokens to transfer)
  sightroller__addGsighMarkets: async ({commit,state}, { markets}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._addGsighMarkets(markets).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // transferTokens (The number of cTokens to transfer)
  sightroller__dropGsighMarket: async ({commit,state}, { market}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._dropGsighMarket(market).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Return all of the markets
  sightroller__getAllMarkets: async ({commit,state}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const ret = await SIGHTROLLER_Contract.methods.getAllMarkets().call();
      console.log(ret);
    }
  },
  
  // Return all of the markets
  sightroller__getBlockNumber: async ({commit,state}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const ret =  SIGHTROLLER_Contract.methods.getBlockNumber().call();
      console.log(ret);
    }
  },

  // transferTokens (The number of cTokens to transfer)
  sightroller__getGSighAddress: async ({commit,state} ) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const ret =  SIGHTROLLER_Contract.methods.getGSighAddress().call();
      console.log(ret);
    }
  },
  







    toggleTheme({state,}, themeMode) {
      state.themeMode = themeMode;
      const themeObj = Object.keys(state.theme[themeMode]);
      for (let i = 0; i < themeObj.length; i++) {
        document.documentElement.style.setProperty(`--${themeObj[i]}`, state.theme[themeMode][themeObj[i]]);
      }
    },
  },

});


export default store;
