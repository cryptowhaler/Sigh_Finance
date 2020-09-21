import Vue from 'vue';
import Vuex from 'vuex';
import {dateToDisplayTime,} from '@/utils/utility';
import Web3 from 'web3';

const EthereumTx = require("ethereumjs-tx").Transaction;

import SetProtocol from 'setprotocol.js'; // SET PROTOCOL SDK

import whitePaperInterestRateModel from '@/contracts/WhitePaperInterestRateModel.json';
import jumpRateModelV2 from '@/contracts/JumpRateModelV2.json';
import sighReservoir_ from '@/contracts/SighReservoir.json';
import SIGH from '@/contracts/SIGH.json';
import Sightroller from '@/contracts/Sightroller.json';
import Unitroller from '@/contracts/Unitroller.json';
import GSigh from '@/contracts/GSigh.json';
import GovernorAlpha from '@/contracts/GovernorAlpha.json';
import Timelock from '@/contracts/Timelock.json';
import GSighReservoir from '@/contracts/GSighReservoir.json';
import SighLens from '@/contracts/SighLens.json';
import CErc20 from '@/contracts/CErc20.json';

// import SetProtocol from 'setprotocol.js';

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
    loadWeb3: async ({ commit , state}) => {
        // const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');  //CONNECTING TO GANACHE
        // const web3 = new Web3(provider);
        // commit('SET_WEB3',web3);
      if (window.ethereum) {
        state.web3 = new Web3(window.ethereum);
        try {        // Request account access if needed
          await window.ethereum.enable();
          return state.web3;
        } 
        catch (error) {
          console.log('NOT enabled');        
          console.error(error);
        }
      }
      // // For older version dapp browsers ...
      else if (window.web3) {      //   // Use Mist / MetaMask's provider.
        state.web3 = window.web3;
        console.log('Injected web3 detected.', window.web3);
        return state.web3;
      }
      // If the provider is not found, it will default to the local network ...
      else {
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');  //CONNECTING TO GANACHE
        state.web3 = new Web3(provider);        
        console.log('No web3 instance injected, using Local web3.');
        return state.web3;
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

    //********************** 
    //********************** 
    //********************** 
    //  SEND ETHEREUM TO AN ADDRESS
    //********************** 
    //********************** 
    //********************** 

    // working
    sendEthereumFunction: async ({commit,state},{recepient, amount}) => {
      const web3 = state.web3;
      console.log(web3);
      var send = web3.eth.sendTransaction({from:state.web3Account, to:recepient, value:amount});

      // let details = {"to": recepient, "value": web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether'))};
      // const transaction = new EthereumTx(details);
      // let privateKey = '8259f0f96d82c3a696c0fb4310f22df498674782834c4068d6d2c5b49acd7cc2';
      // let privKey = Buffer('8259f0f96d82c3a696c0fb4310f22df498674782834c4068d6d2c5b49acd7cc2', 'hex')
      // transaction.sign(privKey);
      // const serializedTx = transaction.serialize();
      // web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
    },

    getETHBalance: async ({commit,state},{account}) => {
      const web3 = state.web3;
      console.log(web3);
      // let weiBalance = web3.eth.getBalance(account).toNumber();
      let weiBalance = web3.eth.getBalance(account)
      .then(balance => {
        console.log(balance);
      })
      .catch(er => {
        console.log(er);
      });

      // console.log('ETH Balance IN WEI ' + weiBalance);
      // let EthBalance = web3.fromWei(weiBalance, 'ether');
      // console.log('ETH Balance IN ETH ' + EthBalance);
    },








    //  WHITEPAPER_INTEREST_RATE_MODEL CONTRACT CALLS (START)
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 

    // working
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
        // working
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
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
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
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    //********************** 
    // SIGH_TOKEN RESERVOIR BASED FUNCTIONS (START)

  sighReservoirBeginDripping: async ({commit,state}, {dripRate,targetAddress}) => {
        const web3 = state.web3;
        const sighReservoir = sighReservoir_.networks[state.networkId];
        console.log(sighReservoir);
        if (sighReservoir) {
          let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
          console.log(sighReservoirContract);
          sighReservoirContract.methods.beginDripping(dripRate,targetAddress).send({from: state.web3Account, gas:3000000})
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
        let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
        console.log(sighReservoirContract);
        sighReservoirContract.methods.changeDripRate(dripRate).send({from: state.web3Account, gas:3000000})
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
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      sighReservoirContract.methods.drip().send({from: state.web3Account, gas:3000000})
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
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
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
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
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
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
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
      let  sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
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
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const lastDripBlockNumber = await sighReservoirContract.methods.lastDripBlockNumber().call();
      console.log(lastDripBlockNumber);
    }
  },

  sighReservoirgetRecentlyDrippedAmount: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const currentlyDrippedAmount = await sighReservoirContract.methods.recentlyDrippedAmount().call();
      console.log(currentlyDrippedAmount);
    }
  },
  sighReservoirgetTotalDrippedAmount: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const currentlyDrippedAmount = await sighReservoirContract.methods.totalDrippedAmount().call();
      console.log(currentlyDrippedAmount);
    }
  },
  sighReservoirgetadmin: async ({commit,state}) => {
    const web3 = state.web3;
    const sighReservoir = sighReservoir_.networks[state.networkId];
    console.log(sighReservoir);
    if (sighReservoir) {
      let sighReservoirContract = new web3.eth.Contract(sighReservoir_.abi, sighReservoir.address);
      console.log(sighReservoirContract);
      const admin = await sighReservoirContract.methods.admin().call();
      console.log(admin);
    }
  },

  // SIGH_TOKEN RESERVOIR BASED FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // SIGH_TOKEN FUNCTIONS (START)

  sighInitMinting: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.initMinting().send({from: state.web3Account, gas:3000000})
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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

  sightransferFrom: async ({commit,state}, {sender,recepient,amount}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.transferFrom(sender,recepient,amount).send({from: state.web3Account})
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      SIGH_Contract.methods.mintCoins().send({from: state.web3Account, gas:3000000})
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const getCurrentEra = SIGH_Contract.methods.getCurrentEra().call();
      console.log(getCurrentEra);
    }
  },

  sighgetallowance: async ({commit,state},{owner,spender}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const allowance = SIGH_Contract.methods.allowance(owner,spender).call();
      console.log(allowance);
    }
  },

  sighgetbalanceOf: async ({commit,state}, {account} )  => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const balanceOf = SIGH_Contract.methods.balanceOf(account).call();
      console.log(balanceOf);
    }
  },

  //working
  sigh_getTotalSupply: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
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
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const start_Time = SIGH_Contract.methods.start_Time().call();
      console.log(start_Time);
    }
  },

  //working
  sighgetdecimals: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const decimals = SIGH_Contract.methods.decimals().call();
      console.log(decimals);
    }
  },

  //working
  sighgetsymbol: async ({commit,state}) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const symbol = SIGH_Contract.methods.symbol().call();
      console.log(symbol);
    }
  },
  
  //working
  sighgetname: async ({commit,state},) => {
    const web3 = state.web3;
    const SIGH_ = SIGH.networks[state.networkId];
    console.log(SIGH_);
    if (SIGH_) {
      let SIGH_Contract = new web3.eth.Contract(SIGH.abi, SIGH_.address);
      console.log(SIGH_Contract);
      const name = SIGH_Contract.methods.name().call();
      console.log(name);
    }
  },  

  // SIGH_TOKEN FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // SIGHTROLLER FUNCTIONS (START)

  //Returns the List of markets the user has entered
  sightroller_getAssetsIn: async ({commit,state}, {account}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const getAssetsIn = SIGHTROLLER_Contract.methods.getAssetsIn(account).call();
      console.log(getAssetsIn);
    }
  },

  //Checks if the user has entered the given market
  sightroller_checkMembership: async ({commit,state}, {account,market}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const checkMembership = SIGHTROLLER_Contract.methods.checkMembership(account,market).call();
      console.log(checkMembership);
    }
  },

  // User provides a list of markets (array) that he wants to enter
  sightroller_enterMarkets: async ({commit,state}, { markets }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
  sightroller_redeemVerify: async ({commit,state}, { market,redeemer,actualRedeemAmount,redeemTokens}) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.redeemVerify(market,redeemer,actualRedeemAmount,redeemTokens).send({from: state.web3Account})
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
  sightroller_claimGSigh_bs: async ({commit,state}, { holders,markets,borrowers,suppliers }) => {
    const web3 = state.web3;
    const Sightroller_ = Sightroller.networks[state.networkId];
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
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
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      const ret =  SIGHTROLLER_Contract.methods.getGSighAddress().call();
      console.log(ret);
    }
  },
  
  // SIGHTROLLER FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // UNITROLLER FUNCTIONS (START)

  // Can be called by Admin. Used to set new 'pendingSightrollerImplementation'
  unitroller___setPendingImplementation: async ({commit,state}, { newPendingImplementation}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Sightroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._setPendingImplementation(newPendingImplementation).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },
  
  // Can be called by pendingSightrollerImplementation. Used to accept the responsibility.
  unitroller_acceptImplementation: async ({commit,state}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Sightroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._acceptImplementation().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
  unitroller_setPendingAdmin: async ({commit,state}, { newPendingAdmin}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Sightroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._setPendingAdmin(newPendingAdmin).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Accepts transfer of admin rights. msg.sender must be pendingAdmin
  unitroller_acceptAdmin: async ({commit,state}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Sightroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._acceptAdmin().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // UNITROLLER FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // GSIGH TOKEN FUNCTIONS (START)

  // Get the number of tokens `gsigh_spender` is approved to spend on behalf of `gsigh_holder`
  gsigh_allowance: async ({commit,state},{gsigh_holder,gsigh_spender}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      const ret = GSigh_Contract.methods.allowance(gsigh_holder,gsigh_spender).call();
      console.log(ret);
    }
  },

  // Get the number of tokens held by the `gsigh_holder`
  gsigh_balanceOf: async ({commit,state},{gsigh_holder}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      const ret = GSigh_Contract.methods.balanceOf(gsigh_holder).call();
      console.log(ret);
    }
  },

  // Approve `gsigh_spender` to transfer up to `gsigh_amount` from `msg.sender`
  gsigh_approve: async ({commit,state},{gsigh_spender, gsigh_amount}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      GSigh_Contract.methods.approve(gsigh_spender, gsigh_amount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Transfer `gsigh_amount` tokens from `msg.sender` to `gsigh_destination`
  gsigh_transfer: async ({commit,state},{gsigh_destination, gsigh_amount}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      GSigh_Contract.methods.transfer(gsigh_destination, gsigh_amount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Transfer `gsigh_amount` tokens from `msg.sender` to `gsigh_destination`
  gsigh_transferFrom: async ({commit,state},{gsigh_source,gsigh_destination, gsigh_amount}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      GSigh_Contract.methods.transferFrom(gsigh_source,gsigh_destination, gsigh_amount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Delegate votes from `msg.sender` to `delegatee`
  gsigh_delegate: async ({commit,state},{delegatee}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      GSigh_Contract.methods.delegate(delegatee).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Gets the current votes balance for `gsigh_holder`
  gsigh_getCurrentVotes: async ({commit,state},{gsigh_holder}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      const ret = GSigh_Contract.methods.getCurrentVotes(gsigh_holder).call();
      console.log(ret);
    }
  },

  // Determine the prior number of votes for an account as of a block number
  gsigh_getPriorVotes: async ({commit,state},{gsigh_holder,gsigh_blockNumber}) => {
    const web3 = state.web3;
    const GSigh_ = GSigh.networks[state.networkId];
    console.log(GSigh_);
    if (GSigh_) {
      let GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
      console.log(GSigh_Contract);
      const ret = GSigh_Contract.methods.getPriorVotes(gsigh_holder,gsigh_blockNumber).call();
      console.log(ret);
    }
  },

  // // Delegates votes from signatory to `delegatee`
  // gsigh_delegateBySig: async ({commit,state},{delegatee,nonce,expiry     }) => {
  //   const web3 = state.web3;
  //   const GSigh_ = GSigh.networks[state.networkId];
  //   console.log(GSigh_);
  //   if (GSigh_) {
  //     GSigh_Contract = new web3.eth.Contract(GSigh.abi, GSigh_.address);
  //     console.log(GSigh_Contract);
  //     GSigh_Contract.methods.delegateBySig(delegatee).send({from: state.web3Account})
  //     .then(receipt => {
  //       console.log(receipt);
  //     })
  //     .catch(error => {
  //       console.log(error);
  //     });
  //   }
  // },

  // GSIGH FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // GOVERNOR ALPHA FUNCTIONS (START)

  governorAlpha_quorumVotes: async ({commit,state}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.quorumVotes().call();
      console.log(ret);
    }
  },

  governorAlpha_proposalThreshold: async ({commit,state}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.proposalThreshold().call();
      console.log(ret);
    }
  },

  governorAlpha_proposalMaxOperations: async ({commit,state}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.proposalMaxOperations().call();
      console.log(ret);
    }
  },

  governorAlpha_votingDelay: async ({commit,state}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.votingDelay().call();
      console.log(ret);
    }
  },

  governorAlpha_votingPeriod: async ({commit,state}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.votingPeriod().call();
      console.log(ret);
    }
  },

  governorAlpha_proposalCount: async ({commit,state}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.proposalCount().call();
      console.log(ret);
    }
  },
  
  governorAlpha_propose: async ({commit,state},{p_targets,p_values,p_signatures,p_calldatas,p_description}  ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.propose(p_targets,p_values,p_signatures,p_calldatas,p_description).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // Add proposal to the queue
  governorAlpha_queue: async ({commit,state},{proposalId}  ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.queue(proposalId).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // Execute the proposal
  governorAlpha_execute: async ({commit,state},{proposalId}  ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.execute(proposalId).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },  

  // Cancel the proposal
  governorAlpha_cancel: async ({commit,state},{proposalId}  ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.cancel(proposalId).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },  

  // enter a Vote
  governorAlpha_castVote: async ({commit,state},{proposalId,bool_support}  ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.castVote(proposalId,bool_support).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },  

  // governorAlpha_castVoteBySig: async ({commit,state},{proposalId,bool_support,v,r,s}  ) => {
  //   const web3 = state.web3;
  //   const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
  //   console.log(GovernorAlpha_);
  //   if (GovernorAlpha_) {
  //     GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
  //     console.log(GovernorAlpha_Contract);
  //     const ret = GovernorAlpha_Contract.methods.castVoteBySig(proposalId,bool_support).send({from: state.web3Account})
  //     .then(receipt => {
  //       console.log(receipt);
  //     })
  //     .catch(error => {
  //       console.log(error);
  //     })
  //   }
  // }, 

  governorAlpha_getActions: async ({commit,state},{proposalId}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.getActions(proposalId).call();
      console.log(ret);
    }
  },

  governorAlpha_getReceipt: async ({commit,state},{proposalId}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.getReceipt(proposalId).call();
      console.log(ret);
    }
  },  

  governorAlpha_state: async ({commit,state},{proposalId}) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.state(proposalId).call();
      console.log(ret);
    }
  },    


  governorAlpha__acceptAdmin: async ({commit,state} ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.__acceptAdmin().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },  

  governorAlpha__abdicate: async ({commit,state} ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.__abdicate().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },    

  governorAlpha__queueSetTimelockPendingAdmin: async ({commit,state},{gov_newPendingAdmin,gov_eta} ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.__queueSetTimelockPendingAdmin({gov_newPendingAdmin,gov_eta}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },   

  governorAlpha__executeSetTimelockPendingAdmin: async ({commit,state},{gov_newPendingAdmin,gov_eta} ) => {
    const web3 = state.web3;
    const GovernorAlpha_ = GovernorAlpha.networks[state.networkId];
    console.log(GovernorAlpha_);
    if (GovernorAlpha_) {
      let GovernorAlpha_Contract = new web3.eth.Contract(GovernorAlpha.abi, GovernorAlpha_.address);
      console.log(GovernorAlpha_Contract);
      const ret = GovernorAlpha_Contract.methods.__executeSetTimelockPendingAdmin({gov_newPendingAdmin,gov_eta}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },     

  // GOVERNOR ALPHA FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // TIMELOCK FUNCTIONS (START)

  // Set the delay (between Min & Max) [only by Admin]
  Timelock__setDelay: async ({commit,state},{timelock_delay_} ) => {
    const web3 = state.web3;
    const Timelock_ = Timelock.networks[state.networkId];
    console.log(Timelock_);
    if (Timelock_) {
      let Timelock_Contract = new web3.eth.Contract(Timelock.abi, Timelock_.address);
      console.log(Timelock_Contract);
      const ret = Timelock_Contract.methods.setDelay({timelock_delay_}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 
  
    // Called by Admin to set the pendingAdmin
    Timelock__setPendingAdmin: async ({commit,state},{timelock_pendingAdmin_} ) => {
      const web3 = state.web3;
      const Timelock_ = Timelock.networks[state.networkId];
      console.log(Timelock_);
      if (Timelock_) {
        let Timelock_Contract = new web3.eth.Contract(Timelock.abi, Timelock_.address);
        console.log(Timelock_Contract);
        const ret = Timelock_Contract.methods.setPendingAdmin({timelock_pendingAdmin_}).send({from: state.web3Account})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        })
      }
    }, 
    

    // Called by pendingAdmin to be accepted as new Admin
  Timelock__acceptAdmin: async ({commit,state}) => {
    const web3 = state.web3;
    const Timelock_ = Timelock.networks[state.networkId];
    console.log(Timelock_);
    if (Timelock_) {
      let Timelock_Contract = new web3.eth.Contract(Timelock.abi, Timelock_.address);
      console.log(Timelock_Contract);
      const ret = Timelock_Contract.methods.acceptAdmin().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // Called by Admin to Queue a transaction
  Timelock__queueTransaction: async ({commit,state},{timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta} ) => {
    const web3 = state.web3;
    const Timelock_ = Timelock.networks[state.networkId];
    console.log(Timelock_);
    if (Timelock_) {
      let Timelock_Contract = new web3.eth.Contract(Timelock.abi, Timelock_.address);
      console.log(Timelock_Contract);
      const ret = Timelock_Contract.methods.queueTransaction({timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 
  
    // Called by Admin to Queue a transaction
  Timelock__cancelTransaction: async ({commit,state},{timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta} ) => {
    const web3 = state.web3;
    const Timelock_ = Timelock.networks[state.networkId];
    console.log(Timelock_);
    if (Timelock_) {
      let Timelock_Contract = new web3.eth.Contract(Timelock.abi, Timelock_.address);
      console.log(Timelock_Contract);
      const ret = Timelock_Contract.methods.cancelTransaction({timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 
  
    // Called by Admin to Execute a transaction  
  Timelock__executeTransaction: async ({commit,state},{timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta,EthValueInWei = 0} ) => {
    const web3 = state.web3;
    const Timelock_ = Timelock.networks[state.networkId];
    console.log(Timelock_);
    if (Timelock_) {
      let Timelock_Contract = new web3.eth.Contract(Timelock.abi, Timelock_.address);
      console.log(Timelock_Contract);
      const ret = Timelock_Contract.methods.executeTransaction({timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta}).send({from: state.web3Account,value: EthValueInWei})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 
    
  // TIMELOCK FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // GSIGH RESERVOIR FUNCTIONS (START)

    // Called by Admin to begin GSIGH's dripping from the Reservoir
    GSighReservoir_beginDripping: async ({commit,state},{gsigh_dripRate_ , gsigh_target_} ) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        GSighReservoir_Contract.methods.beginDripping(gsigh_dripRate_, gsigh_target_).send({from: state.web3Account, gas:3000000})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        })
      }
    }, 
 
    // Called by Admin to change Drip Rate
    GSighReservoir_changeDripRate: async ({commit,state},{gsigh_dripRate_} ) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        GSighReservoir_Contract.methods.changeDripRate(gsigh_dripRate_).send({from: state.web3Account})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        })
      }
    },     

    // Called by Admin to begin GSIGH's dripping from the Reservoir
    GSighReservoir_drip: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        GSighReservoir_Contract.methods.drip().send({from: state.web3Account, gas:3000000})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        })
      }
    }, 

    // Get the GSigh's Contract address
    GSighReservoir_getGSighAddress: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.getGSighAddress().call()
        console.log(ret);
      }
    },     

    // Get the Sightroller's Contract address
    GSighReservoir_getTargetAddress: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.getTargetAddress().call()
        console.log(ret);
      }
    },     

    // Get the lastDripBlockNumber (block number when the most recent drip took place)
    GSighReservoir_lastDripBlockNumber: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.lastDripBlockNumber().call()
        console.log(ret);
      }
    },     

    // Get the totalDrippedAmount (total GSigh dripped)
    GSighReservoir_totalDrippedAmount: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.totalDrippedAmount().call()
        console.log(ret);
      }
    },     

    // Get the recentlyDrippedAmount (recent GSigh dripped)
    GSighReservoir_recentlyDrippedAmount: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.recentlyDrippedAmount().call()
        console.log(ret);
      }
    },     

    // Get current Drip Rate
    GSighReservoir_dripRate: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.dripRate().call()
        console.log(ret);
      }
    }, 
    
    // Get dripStart
    GSighReservoir_dripStart: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.dripStart().call()
        console.log(ret);
      }
    }, 

    // Get Admin
    GSighReservoir_admin: async ({commit,state}) => {
      const web3 = state.web3;
      const GSighReservoir_ = GSighReservoir.networks[state.networkId];
      console.log(GSighReservoir_);
      if (GSighReservoir_) {
        let GSighReservoir_Contract = new web3.eth.Contract(GSighReservoir.abi, GSighReservoir_.address);
        console.log(GSighReservoir_Contract);
        const ret = GSighReservoir_Contract.methods.admin().call()
        console.log(ret);
      }
    },     
  
  // GSIGH RESERVOIR FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // SIGHLENS FUNCTIONS (START)

  // return all the data for a cToken (Market)
  SighLens_cTokenMetadata: async ({commit,state},{ cTokenAddress } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.cTokenMetadata({cTokenAddress}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> it reuturns a list of ctoken metadata for a list of cTokens 
  SighLens_cTokenMetadataAll: async ({commit,state},{ cTokenAddressArray } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.cTokenMetadataAll({cTokenAddressArray}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> returns balance information for a cToken for an account
  SighLens_cTokenBalances: async ({commit,state},{ cTokenAddress, sighlens_amount } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.cTokenBalances({cTokenAddress, sighlens_amount}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> returns balance information for a list of cToken markets for an account
  SighLens_cTokenBalancesAll: async ({commit,state},{ cTokenAddressArray, sighlens_amount } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.cTokenBalancesAll({cTokenAddressArray, sighlens_amount}).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> get underlying price for a cToken
  SighLens_cTokenUnderlyingPrice: async ({commit,state},{ cTokenAddress  } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.cTokenUnderlyingPrice({cTokenAddress }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> get underlying price for a list of cTokens
  SighLens_cTokenUnderlyingPriceAll: async ({commit,state},{ cTokenAddressArray } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.cTokenUnderlyingPriceAll({cTokenAddressArray }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },   

  // --> returns the liquidity and shortfall amount for a user's account by checking from Sightroller
  SighLens_getAccountLimits: async ({commit,state},{ sighlens_sightroller,sighlens_account  } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.getAccountLimits({ sighlens_sightroller,sighlens_account  }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },    

  // --> gets the voting history on proposals for the account
  SighLens_getGovReceipts: async ({commit,state},{ sighlens_governor, sighlens_account, sighlens_proposalIds  } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      SighLens_Contract.methods.getGovReceipts({  sighlens_governor, sighlens_account, sighlens_proposalIds }).call();
      console.log(ret);
    }
  },    

  // --> gets the information on proposals
  SighLens_getGovProposals: async ({commit,state},{ sighlens_governor, sighlens_proposalIds  } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      SighLens_Contract.methods.getGovProposals({  sighlens_governor, sighlens_proposalIds }).call();
      console.log(ret);
    }
  },    

  // --> gets the information on the balance, votes available, votes delegated for the account
  SighLens_getGSighBalanceMetadata: async ({commit,state},{ sighlens_gsigh_address, sighlens_account  } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      SighLens_Contract.methods.getGSighBalanceMetadata({  sighlens_gsigh_address, sighlens_account }).call();
      console.log(ret);
    }
  },    

  // --> gets the information on votes based on block numbers
  SighLens_getGSighVotes: async ({commit,state},{ sighlens_gsigh_address, sighlens_account , sighlens_blockNumbers } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      SighLens_Contract.methods.getGSighVotes({  sighlens_gsigh_address, sighlens_account, sighlens_blockNumbers }).call();
      console.log(ret);
    }
  },   

  // --> returns the liquidity and shortfall amount for a user's account by checking from Sightroller
  SighLens_getGSighBalanceMetadataExt: async ({commit,state},{ sighlens_gsigh_address, sighlens_sightroller, sighlens_account  } ) => {
    const web3 = state.web3;
    const SighLens_ = SighLens.networks[state.networkId];
    console.log(SighLens_);
    if (SighLens_) {
      let SighLens_Contract = new web3.eth.Contract(SighLens.abi, SighLens_.address);
      console.log(SighLens_Contract);
      const ret = SighLens_Contract.methods.getGSighBalanceMetadataExt({ sighlens_gsigh_address, sighlens_sightroller, sighlens_account  }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },  
  
  // GSIGH RESERVOIR FUNCTIONS (END)
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  //********************** 
  // CERC20 MARKET FUNCTIONS (START)

  // --> Initialize the new money market
  cERC20_initialize: async ({commit,state},{ cer20_underlying, cer20_sightroller , cer20_interestRateModel_, cer20_initialExchangeRateMantissa,cer20_name, cer20_symbol, cer20_decimals  } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.initialize({ cer20_underlying, cer20_sightroller, cer20_interestRateModel_, cer20_initialExchangeRateMantissa,cer20_name, cer20_symbol, cer20_decimals   }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> Sender supplies assets into the market and receives cTokens in exchange
  cERC20_mint: async ({commit,state},{ cer20_mintAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.mint({ cer20_mintAmount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> Sender redeems cTokens in exchange for the underlying asset
  cERC20_redeem: async ({commit,state},{ cer20_redeemTokens } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.redeem({ cer20_redeemTokens }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },   

  // --> Sender redeems cTokens in exchange for a specified amount of underlying asset
  cERC20_redeemUnderlying: async ({commit,state},{ cer20_redeemAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.redeemUnderlying({ cer20_redeemAmount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Sender borrows assets from the protocol to their own address
  cERC20_borrow: async ({commit,state},{ cer20_borrowAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrow({ cer20_borrowAmount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },


  // --> Sender repays their own borrow
  cERC20_repayBorrow: async ({commit,state},{ cer20_repayAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.repayBorrow({ cer20_repayAmount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Sender repays a borrow belonging to borrower
  cERC20_repayBorrowBehalf: async ({commit,state},{ cer20_borrower, cer20_repayAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.repayBorrowBehalf({ cer20_borrower, cer20_repayAmount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> The sender liquidates the borrowers collateral.
  cERC20_liquidateBorrow: async ({commit,state},{ cer20_borrower,  cer20_repayAmount, cer20_cTokenCollateral  } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.liquidateBorrow({ cer20_borrower,  cer20_repayAmount, cer20_cTokenCollateral }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> The sender liquidates the borrowers collateral.
  cERC20_addReserves: async ({commit,state},{ cer20_addAmount} ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._addReserves({ cer20_addAmount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Transfer `amount` tokens from `msg.sender` to `dst`
  cERC20_transfer: async ({commit,state},{ cer20_dst, cer20_amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.transfer({ cer20_dst, cer20_amount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Transfer `amount` tokens from `src` to `dst`
  cERC20_transferFrom: async ({commit,state},{ cer20_src, cer20_dst, cer20_amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.transferFrom({ cer20_src, cer20_dst, cer20_amount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Approve `spender` to transfer up to `amount` from `src`
  cERC20_approve: async ({commit,state},{ cer20_spender, cer20_amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.approve({ cer20_spender, cer20_amount }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Get the underlying balance of the `owner`
  cERC20_balanceOfUnderlying: async ({commit,state},{ cer20_owner } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.balanceOfUnderlying({ cer20_owner }).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Returns the current total borrows plus accrued interest for the Market
  cERC20_totalBorrowsCurrent: async ({commit,state} ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.totalBorrowsCurrent().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Accrue interest to updated borrowIndex and then calculate account's borrow balance using the updated borrowIndex
  cERC20_borrowBalanceCurrent: async ({commit,state}, {cer20_account } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrowBalanceCurrent(cer20_account).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Accrue interest then return the up-to-date exchange rate
  cERC20_exchangeRateCurrent: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.exchangeRateCurrent().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Applies accrued interest to total borrows and reserves
  cERC20_accrueInterest: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.accrueInterest().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  Get the current allowance from `owner` for `spender`
  cERC20_allowance: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.allowance().call();
      console.log(ret);
    }
  },

  // -->  Get the token balance of the `owner`
  cERC20_balanceOf: async ({commit,state},{cer20_owner}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.balanceOf(cer20_owner).call();
      console.log(ret);
    }
  },

  // -->  Get the token balance of the `owner`
  cERC20_getAccountSnapshot: async ({commit,state},{cer20_account}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.getAccountSnapshot(cer20_account).call();
      console.log(ret);
    }
  },

  // -->  Returns the current per-block borrow interest rate for this cToken
  cERC20_borrowRatePerBlock: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrowRatePerBlock().call();
      console.log(ret);
    }
  },

  // -->  Returns the current per-block supply interest rate for this cToken
  cERC20_supplyRatePerBlock: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.supplyRatePerBlock().call();
      console.log(ret);
    }
  },

  // -->  Returns the current per-block supply interest rate for this cToken
  cERC20_borrowBalanceStored: async ({commit,state},{cer20_account}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrowBalanceStored(cer20_account).call();
      console.log(ret);
    }
  },

  // -->  Calculates the exchange rate from the underlying to the CToken.
  // This function does not accrue interest before calculating the exchange rate
  cERC20_exchangeRateStored: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.exchangeRateStored().call();
      console.log(ret);
    }
  },

  // Get cash balance of this cToken in the underlying asset
  cERC20_getCash: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.getCash().call();
      console.log(ret);
    }
  },

  // --> Transfers collateral tokens (this market) to the liquidator.
  cERC20_seize: async ({commit,state}, { cerc20_liquidator, cerc20_borrower, cerc20_seizeTokens  }) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.seize(cerc20_liquidator, cerc20_borrower, cerc20_seizeTokens ).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
  cERC20_setPendingAdmin: async ({commit,state}, { cerc20_newPendingAdmin}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setPendingAdmin( cerc20_newPendingAdmin ).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Accepts transfer of admin rights. msg.sender must be pendingAdmin
  cERC20_acceptAdmin: async ({commit,state}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._acceptAdmin().send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Sets a new sightroller for the market
  cERC20_setSightroller: async ({commit,state}, {cerc20_newSightroller}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setSightroller(cerc20_newSightroller).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> accrues interest and sets a new reserve factor for the protocol using _setReserveFactorFresh
  cERC20_setReserveFactor: async ({commit,state}, {cerc20_newReserveFactorMantissa}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setReserveFactor(cerc20_newReserveFactorMantissa).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  Accrues interest and reduces reserves by transferring to admin
  cERC20_reduceReserves: async ({commit,state}, {cerc20_reduceAmount}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._reduceReserves(cerc20_reduceAmount).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  accrues interest and updates the interest rate model using _setInterestRateModelFresh
  cERC20_setInterestRateModel: async ({commit,state}, {cerc20_newInterestRateModel}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, CErc20_.address);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setInterestRateModel(cerc20_newInterestRateModel).send({from: state.web3Account})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
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
