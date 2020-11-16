import Vue from 'vue';
import Vuex from 'vuex';
// import {dateToDisplayTime,} from '@/utils/utility';
import Web3 from 'web3';
import BigNumber from "bignumber.js";

import GlobalAddressesProviderInterface from '@/contracts/IGlobalAddressesProvider.json'; // GlobalAddressesProviderContract Interface

import SIGHInstrument from '@/contracts/SIGH.json'; // SIGH Contract ABI
import SighSpeedController from '@/contracts/ISighSpeedController.json'; // SighSpeedController Interface ABI
import SighStakingInterface from '@/contracts/ISighStaking.json'; // SighStaking Interface ABI
import SighTreasuryInterface from '@/contracts/ISighTreasury.json'; // SighTreasury Interface ABI
import SighDistributionHandlerInterface from '@/contracts/ISighDistributionHandler.json'; // SighDistributionHandler Interface ABI

import LendingPool from '@/contracts/LendingPool.json'; // LendingPool Contract ABI
import LendingPoolCore from '@/contracts/LendingPoolCore.json'; // LendingPoolCore Contract ABI
import IToken from '@/contracts/IToken.json'; // IToken Contract ABI

import IPriceOracleGetter from '@/contracts/IPriceOracleGetter.json'; // IToken Contract ABI
import MintableERC20 from '@/contracts/MintableERC20.json'; // MINTABLE ERC20 Contract ABI
import ERC20 from '@/contracts/ERC20.json'; // ERC20 Contract ABI
import ERC20Detailed from '@/contracts/ERC20Detailed.json'; // ERC20 Contract ABI

const getRevertReason = require('eth-revert-reason');

// import { SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION } from "constants";

// import * as qs from 'qs';

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

// ###################################################################
// ############ WEB3 CONFIG AND CONNECTED WALLET ADDRESS  ############
// ###################################################################

    web3: null ,                                          //WEB3 INSTANCE
    isWalletConnected: false,
    connectedWallet: null,
    networkId: null,
    ethBalance: null,
    isNetworkSupported: false,
// ######################################################
// ############ PROTOCOL CONTRACT ADDRESSES  ############
// ######################################################
    
    GlobalAddressesProviderContractKovan: "0x745e43654860a51A1666185171D800bcbCF56145",
    ethereumPriceOracleAddressKovan: "0xa077B3b82c7205eE5bCA46C553520F65e516eF5A",
    GlobalAddressesProviderContractMainNet: null,
    GlobalAddressesProviderContractBSCTestnet: null,
    GlobalAddressesProviderContractBSC: null,

    SIGHContractAddress: null,                                 // Approve, Transfer, TransferFrom, Allowance,      totalSupply, BalanceOf
    SIGHSpeedControllerAddress: null,                  // Drip
    sighStakingContractAddress: null,                          // Stake, Unstake, ClaimAllAccumulatedInstruments
    SIGHTreasuryContractAddress: null,                         // Mainly queries
    SIGHDistributionHandlerAddress: null,              // RefreshSpeeds
    // SIGHFinanceConfiguratorContract: null,
    // SIGHFinanceManager: null,    

    // SupportedInstrumentStates: {},                      // CONFIG DATA FOR THE SUPPORTED INSTRUMENTS
    // InstrumentContracts: {},                            // ERC20 INSTRUMENTS
    // ITokenContracts: {},                                // Redeem, redirectInterestStream, allowInterestRedirectionTo, redirectInterestStreamOf, Approve, 
                                                        // Transfer, TransferFrom, Allowance, claimMySIGH
                                                        // redirectSighStream, allowSighRedirectionTo, redirectSighStreamOf
                                                        // principalBalanceOf, totalSupply, BalanceOf, getRedirectedBalance, getInterestRedirectionAddress, getUserIndex
                                                        // getSighAccured, getSighStreamRedirectedTo, getSupplierIndexes, getBorrowerIndexes
    LendingPoolContractAddress: null,                          // deposit, borrow, repay, swapBorrowRateMode, rebalanceStableBorrowRate, setUserUseInstrumentAsCollateral, liquidationCall
                                                        // getInstruments, getInstrumentData, getUserAccountData, getUserInstrumentData
    LendingPoolCoreContractAddress: null,
    LendingPoolDataProviderContract: null,                      // calculateUserGlobalData, balanceDecreaseAllowed, calculateCollateralNeededInETH, getInstrumentConfigurationData, getUserInstrumentData, getUserAccountData
    // LendingPoolConfiguratorContract: null,
    // LendingPoolMananger: null,

    IPriceOracleGetterAddress: null,          // Keeps updating the price of the supported instruments 

    // ######################################################
    // ############ TO BE WORKED UPON ############
    // ######################################################
    NETWORKS : { '1': 'Main Net', '2': 'Deprecated Morden test network','3': 'Ropsten test network',
      '4': 'Rinkeby test network','42': 'Kovan test network', '1337': 'Tokamak network', '4447': 'Truffle Develop Network','5777': 'Ganache Blockchain',
      '56':'Binance Smart Chain Main Network','97':'Binance Smart Chain Test Network'},
    supportedNetworks: ['42'],
    // SESSION DATA 
    supportedInstrumentAddresses: null,    //          INSTRUMENT                    // Array of Addresses
    supportedInstruments : [],             //          INSTRUMENT                    // INSTRUMENTS SUPPORTED BY THE PROTOCOL (FOR LENDING - ITOKEN & INSTRUMENT ADDRESSES + SYMBOL/NAME WILL BE STORED)
    supportedInstrumentGlobalStates: new Map(),   //   INSTRUMENT                    // Instrument Address -> Instrument GLOBAL STATES (APY, SIGH YIELDS, TOTAL LIQUIDITY ETC) MAPPING  
    supportedInstrumentConfigs: new Map(),        //   INSTRUMENT                    // Instrument Address -> Instrument Config  MAPPING  (instrument's liquidation threshold etc)
    walletInstrumentStates: new Map(),            //   WALLET - INSTRUMENT           // CONNECTED WALLET --> "EACH INSTRUMENT" STATE MAPPING ( deposited, balance, borrowed, fee, etc )
    walletSIGH_FinanceState: null,                //   WALLET - SIGH FINANCE         // CONNECTED WALLET --> "SIGH FINANCE" STATE MAPPING (total deposited, total borrowed, lifeTime Deposit, lifeTime Borrowed,  )
    walletSIGHState: null,                        //   WALLET - SIGH Token           // CONNECTED WALLET --> "SIGH" STATE MAPPING (sigh balance, lifeTimeSighVolume, contributionRatio = lifeTimeSighVolume/ SighGlobalTradeVolume)
    SIGHFinanceState: null,                       //   SIGH FINANCE                  // SIGH's STATE (totalSupply, mintSpeed, burnSpeed, totalMinted, price, Sigh Global Trade Volume, bonding Curve Health)
    SIGHState: null,                              //   SIGH                          // SIGH's STATE (totalSupply, mintSpeed, burnSpeed, totalMinted, price, Sigh Global Trade Volume, bonding Curve Health)

    currentlySelectedInstrument : {symbol:'WBTC'}, //  {instrumentAddress: '0x00' , name: 'Wrapped Bitcoin', symbol: 'WBTC', decimals: 18, iTokenAddress: '0x00' , priceDecimals: 8, price: 0 },  // Currently Selected Instrument

    sessionTransactions : [],
    
    // ETH PRICE & SIGH PRICE
    ethPriceDecimals: null,             // Decimals 
    ethereumPriceUSD: null,             // ETH Price in USD

    username: null, //Added
    websocketStatus: 'Closed',
    loaderCounter: 0,
    loaderCancellable: false,
    isLoggedIn: true,
    sidebarOpen: false,
    tradePaneClosed: false,
    bookPaneClosed: false,
    liveTradePrice: 1,
    limitIOCTab: false, //Added
  },













  getters: {
    themeMode(state) {
      return state.themeMode;
    },
// ###################################################################
// ############ WEB3 CONFIG AND CONNECTED WALLET GETTERS  ############
// ###################################################################
    getWeb3(state) {
      return state.web3;
    },
    isWalletConnected(state) {      // FOR SIGH FINANCE (WALLET CONNECTED ?? )
      return state.isWalletConnected;
    },
    connectedWallet(state) {         // Account Address
      return state.connectedWallet;    
    },    
    networkId(state) {         // networkId
      return state.networkId;    
    },   
    networkName(state) {
      return state.NETWORKS[state.networkId];
    },
    ethBalance(state) {
      return state.ethBalance;
    },
    isNetworkSupported(state) {
      return state.isNetworkSupported;
    },
// ####################################################
// ############  PROTOCOL CONTRACT GETTERS ############
// ####################################################
    GlobalAddressesProviderContractKovan(state) {         
      return state.GlobalAddressesProviderContractKovan;    
    },    
    GlobalAddressesProviderContractMainNet(state) {         
      return state.GlobalAddressesProviderContractMainNet;    
    },    
    SIGHContractAddress(state) {         
      return state.SIGHContractAddress;    
    },    
    SIGHSpeedControllerAddress(state) {         
      return state.SIGHSpeedControllerAddress;    
    },    
    sighStakingContractAddress(state) {         
      return state.sighStakingContractAddress;    
    },    
    SIGHTreasuryContractAddress(state) {         
      return state.SIGHTreasuryContractAddress;    
    },    
    SIGHDistributionHandler(state) {         
      return state.SIGHDistributionHandlerAddress;    
    },    
    ITokenContracts(state) {         
      return state.ITokenContracts;    
    },    
    LendingPoolContractAddress(state) {         
      return state.LendingPoolContractAddress;    
    },    
    LendingPoolCoreContractAddress(state) {         
      return state.LendingPoolCoreContractAddress;    
    },    
    LendingPoolDataProviderContract(state) {         
      return state.LendingPoolDataProviderContract;    
    },    
    IPriceOracleGetterAddress(state) {         
      return state.IPriceOracleGetterAddress;    
    },        
    // ######################################################
    // ############ SESSION DATA ############
    // ######################################################
    // ETH PRICE
    getETHPrice(state) {
      return state.ethereumPriceUSD;
    },     
    getEthPriceDecimals(state) {
      return state.ethPriceDecimals;
    },
    // SUPPRTED INSTRUMENTS ARRAY
    getSupportedInstrumentAddresses(state) {
      return state.supportedInstrumentAddresses;
    },
    getSupportedInstruments(state) {
      return state.supportedInstruments;
    },
    // SUPPRTED INSTRUMENTS - GLOBAL STATE
    getsupportedInstrumentGlobalStates(state) {
      return state.supportedInstrumentGlobalStates;
    },
    getsupportedInstrumentGlobalState(state,instrumentAddress) {
      return state.supportedInstrumentGlobalStates.get(instrumentAddress);
    },
    // SUPPRTED INSTRUMENTS - CONFIG STATE    
    getInstrumentConfigs(state) {
    return state.supportedInstrumentConfigs;
    },
    getInstrumentConfig(state,instrumentAddress) {
      return state.supportedInstrumentConfigs.get(instrumentAddress);
    },
    // WALLET  - SUPPORTED INSTRUMENTS   
    getWalletInstrumentStates(state) {
      return state.walletInstrumentStates;
    },
    getWalletInstrumentState(state,instrumentAddress) {
      return state.walletInstrumentStates.get(instrumentAddress);
    },
    // WALLET  - SIGH FINANCE   
    getWalletSIGH_FinanceState(state) {
      return state.walletSIGH_FinanceState;
    },
    // WALLET  - SIGH INSTRUMENT
    getWalletSIGHState(state) {
      return state.walletSIGHState;
    },
    // SIGH FINANCE
    getSIGHFinanceState(state) {
      return state.SIGHFinanceState;
    },
    // SIGH INSTRUMENT
    getSIGHState(state) {
      return state.SIGHState;
    },
  
    currentlySelectedInstrument(state) {
      return state.currentlySelectedInstrument;
    },
    getSighPrice(state) {
      return state.SIGHState.priceETH;
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
  },










  mutations: {
// #####################################################################
// ############ WEB3 CONFIG AND CONNECTED WALLET MUTATIONS  ############
// #####################################################################
    web3(state,payload) {         
      state.web3 = payload;
      console.log(payload);
      console.log(state.web3);

    },    
    isWalletConnected(state,isWalletConnected) {         
      state.isWalletConnected = isWalletConnected;
      console.log("isWalletConnected MUTATION CALLED IN STORE - " + state.isWalletConnected);
    },    
    connectedWallet(state,connectedWallet) {         
      state.connectedWallet = connectedWallet;
      console.log("connectedWallet MUTATION CALLED IN STORE - " + state.connectedWallet);
    },    
    networkId(state,networkId) {         
      state.networkId = networkId;
      for (let i=0;i <state.supportedNetworks.length; i++ ) {
        if ( state.networkId == state.supportedNetworks[i] ) {
          state.isNetworkSupported = true;
        }
        else {
          state.isNetworkSupported = false;
        }
      }
      console.log("networkId MUTATION CALLED IN STORE - " + state.networkId);
    },   
    updateWallet(state,{newWallet,newBalance}) {
      console.log("UPDATEWALLET MUTATION CALLED IN STORE");
      state.connectedWallet = newWallet;
      state.ethBalance = newBalance;
    },
    updateBalance(state,newBalance) {
      console.log("updateBalance MUTATION CALLED IN STORE");
      state.ethBalance = newBalance;
    },

// ######################################################
// ############ PROTOCOL CONTRACT ADDRESSES  ############
// ######################################################
    GlobalAddressesProviderContractKovan(state,newContractAddress) {         
      state.GlobalAddressesProviderContractKovan = newContractAddress;
      console.log("In GlobalAddressesProviderContractKovan - " + state.GlobalAddressesProviderContractKovan);
    },    
    GlobalAddressesProviderContractMainNet(state,newContractAddress) {         
      state.GlobalAddressesProviderContractMainNet = newContractAddress;
      console.log("In GlobalAddressesProviderContractMainNet - " + state.GlobalAddressesProviderContractMainNet);
    },    
    GlobalAddressesProviderContractBSCTestnet(state,newContractAddress) {         
      state.GlobalAddressesProviderContractBSCTestnet = newContractAddress;
      console.log("In GlobalAddressesProviderContractBSCTestnet - " + state.GlobalAddressesProviderContractBSCTestnet);
    },    
    GlobalAddressesProviderContractBSC(state,newContractAddress) {         
      state.GlobalAddressesProviderContractBSC = newContractAddress;
      console.log("In GlobalAddressesProviderContractBSC - " + state.GlobalAddressesProviderContractBSC);
    },    
    // SIGH RELATED CONTRACTS
    updateSIGHContractAddress(state,newContractAddress) {         
      state.SIGHContractAddress = newContractAddress;
      state.SIGHState.address = newContractAddress;
      console.log("In updateSIGHContractAddress - " + state.SIGHContractAddress);
    },    
    updateSIGHSpeedControllerAddress(state,newContractAddress) {         
      state.SIGHSpeedControllerAddress = newContractAddress;
      console.log("In updateSIGHSpeedControllerAddress - " + state.SIGHSpeedControllerAddress);
    },    
    updatesighStakingContractAddress(state,newContractAddress) {         
      state.sighStakingContractAddress = newContractAddress;
      console.log("In updatesighStakingContractAddress - " + state.sighStakingContractAddress);
    },    
    updateSIGHTreasuryContractAddress(state,newContractAddress) {         
      state.SIGHTreasuryContractAddress = newContractAddress;
      console.log("In updateSIGHTreasuryContractAddress - " + state.SIGHTreasuryContractAddress);
    },    
    updateSIGHDistributionHandlerAddress(state,newContractAddress) {         
      state.SIGHDistributionHandlerAddress = newContractAddress;
      console.log("In updateSIGHDistributionHandlerAddress - " + state.SIGHDistributionHandlerAddress);
    },    
    updateLendingPoolContractAddress(state,newContractAddress) {         
      state.LendingPoolContractAddress = newContractAddress;
      console.log("In updateLendingPoolContractAddress - " + state.LendingPoolContractAddress);
    },    
    updateLendingPoolCoreContractAddress(state,newContractAddress) {         
      state.LendingPoolCoreContractAddress = newContractAddress;
      console.log("In updateLendingPoolCoreContractAddress - " + state.LendingPoolCoreContractAddress);
    },    
    updateLendingPoolDataProviderContract(state,newContractAddress) {         
      state.LendingPoolDataProviderContract = newContractAddress;
      console.log("In updateLendingPoolDataProviderContract - " + state.LendingPoolDataProviderContract);
    },    
    updateIPriceOracleGetterAddress(state,newContractAddress) {         
      state.IPriceOracleGetterAddress = newContractAddress;
      console.log("In updateIPriceOracleGetterAddress - " + state.IPriceOracleGetterAddress);
    },    
    // ######################################################
    // ############ TO BE WORKED UPON ############
    // ######################################################
    // ETH PRICE
    setEthPriceDecimals(state, decimals) {
      state.ethPriceDecimals = decimals;
      console.log('setEthPriceDecimals' + state.ethPriceDecimals);      
    },
    updateETHPrice(state, updatedPrice) {
      state.ethereumPriceUSD = updatedPrice;
      console.log('In updateETHPrice -' + state.ethereumPriceUSD);
    },
    // SUPPRTED INSTRUMENTS ARRAY
    setSupportedInstrumentAddresses(state,supportedInstrumentAddresses_) {
      state.supportedInstrumentAddresses = supportedInstrumentAddresses_;
      console.log('In setSupportedInstrumentAddresses -' + state.supportedInstrumentAddresses);
    },
    setSupportedInstruments(state,supportedInstruments_) {
      state.supportedInstruments = supportedInstruments_;
      console.log('In setSupportedInstruments -' + state.supportedInstruments);
    },
    // SUPPRTED INSTRUMENTS - GLOBAL STATE (MAP)
    addToSupportedInstrumentGlobalStates(state,{instrumentAddress, instrumentGlobalState}) {
      state.supportedInstrumentGlobalStates.set(instrumentAddress,instrumentGlobalState);
      console.log('In addToSupportedInstrumentGlobalStates -' + state.supportedInstrumentGlobalStates.get(instrumentAddress));
    },
    // SUPPRTED INSTRUMENTS - CONFIG STATE (MAP)    
    addToSupportedInstrumentConfigs(state,{instrumentAddress, instrumentConfig}) {
      state.supportedInstrumentConfigs.set(instrumentAddress,instrumentConfig);
      console.log('In addToSupportedInstrumentConfigs -' + state.supportedInstrumentConfigs.get(instrumentAddress));
    },
    // WALLET  - SUPPORTED INSTRUMENTS (MAP)     
    addToWalletInstrumentStates(state,{instrumentAddress, walletInstrumentState}) {
      state.walletInstrumentStates.set(instrumentAddress,walletInstrumentState);
      console.log('In addToWalletInstrumentStates -' + state.walletInstrumentStates.get(instrumentAddress));
    },
    // WALLET  - SIGH FINANCE   
    setWalletSIGH_FinanceState(state,walletSighFinanceState) {
      state.walletSIGH_FinanceState =  walletSighFinanceState;
      console.log('In setWalletSIGH_FinanceState -' + state.walletSIGH_FinanceState);
    },
    // WALLET  - SIGH INSTRUMENT
    setWalletSIGHState(state,walletSIGHState_) {
      state.walletSIGHState =  walletSIGHState_;
      console.log('In setWalletSIGHState -' + state.walletSIGHState);
    },
    // SIGH FINANCE
    setSIGHFinanceState(state,sighFinanceState) {
      state.SIGHFinanceState = sighFinanceState;
      console.log('In getSIGHFinanceState -' + state.SIGHFinanceState);
    },
    // SIGH INSTRUMENT
    setSIGHState(state,sighState) {
      state.SIGHState = sighState;
      console.log('In setSIGHState -' + state.SIGHState);
    },
    // UPDATE INSTRUMENT PRICE
    updateInstrumentPrice(state,{instrumentAddress,updatedPrice}) {               // UPDATES THE CURRENT INSTRUMENT PRICE. CONSTANTLY CALLED BY THE PRICE POLLING FUNCTION
      let instrumentConfig = state.supportedInstrumentConfigs.get(instrumentAddress); 
      instrumentConfig.price = updatedPrice;      
      state.supportedInstrumentConfigs.set(instrumentAddress,instrumentConfig);
    },
    // UPDATE SELECTED INSTRUMENT
    updateSelectedInstrument(state, selectedInstrument_) {
      state.currentlySelectedInstrument = selectedInstrument_;
      console.log("In updateSelectedInstrument " + state.currentlySelectedInstrument);
    },
    addTransactionDetails(state,{status,Hash,Utility,Service}) {
      let obj = {};
      obj.status = status;
      obj.hash = Hash;
      obj.utility = Utility;
      obj.service = Service;
      state.sessionTransactions.push(obj);
      console.log(obj);
      console.log('Transaction history stored');
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
    changeInvest_Invest_Tab(state) {
      state.marketIOCTab = false;
    },
    changeInvest_Withdraw_Tab(state) {
      state.marketIOCTab = true;
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
  },




  actions: {

// ######################################################
// ############ loadWeb3 : CONNECTS TO WEB3 NETWORK (ETHEREUM/BSC ETC) ############
// ############ getWalletConfig : SETS USER ACCOUNT FROM THE WEB3 OBJECT OF THE STORE ############
// ############ polling : UPDATES ACCOUNT AND WALLET WHENEVER THEY CHANGE ############
// ######################################################

    // CONNECTS TO WEB3 NETWORK (ETHEREUM/BSC ETC) : Only stores networkId, web3 Object. No contract / wallet related calls
    loadWeb3: async ({ commit , state, store}) => {
      // IN CASE ETHEREUM HAS BEEN INJECTED IN THE WINDOW
      if (window.ethereum) {  
        state.web3 = new Web3(window.ethereum);
        console.log(state.web3);
        const networkId = await state.web3.eth.net.getId(); 
        console.log(networkId);
        commit('networkId',networkId);        
        try {                                  // Request account access if needed
          await window.ethereum.enable();
          console.log('Ethereum Enabled');  
          return 'EthereumEnabled';
        } 
        catch (error) {
          console.log('Ethereum NOT enabled');  
          console.error(error);
          return 'EthereumNotEnabled';
        }
      }
      // IN CASE BINANCE-CHAIN HAS BEEN INJECTED IN THE WINDOW
      else if (window.BinanceChain) {
        state.web3 = new Web3(window.BinanceChain);
        const networkId = await state.web3.BinanceChain.chainId;
        console.log(networkId);
        commit('networkId',networkId);        
        return 'BSCConnected';
      } 
      // OLDER BROWSERS etc
      else if (window.web3) {      //   // // // For older version dapp browsers ... Use Mist / MetaMask's provider.
        state.web3 = new Web3(window.web3.currentProvider);
        const networkId = await state.web3.eth.net.getId(); 
        console.log(networkId);
        commit('networkId',networkId);        
        return 'Web3Connected';
      }
      else {    // If the provider is not found, it will default to the local network ...
        console.log("No Ethereum interface injected into browser. Read-only access");
        return 'false';
      }
    },


    // SETS USER ACCOUNT FROM THE WEB3 OBJECT OF THE STORE
    getWalletConfig: async ({commit,state}) => {
      console.log("getWalletConfig ACTION FUNCTION CALLED IN STORE"); 
      let accounts = null;     
      if (!state.web3) {
        console.log("getWalletConfig ACTION FUNCTION CALLED IN STORE = web3 not set yet");
        await store.dispatch("loadWeb3");
        if (state.web3) {
          await store.dispatch("getContractAddresses");
        }
      }
      if (state.web3) {
        accounts = await state.web3.eth.getAccounts();
        console.log(accounts);
        if (accounts) {
          commit('connectedWallet',accounts[0]);
          commit('isWalletConnected',true);  
          console.log( 'Account - ' + state.connectedWallet );
          store.dispatch('polling'); 
          return "You are now connected with wallet - ";
        }
        else {
          commit('connectedWallet',null);
          commit('isWalletConnected',false);  
          return "No Wallet detected. Read-only access" ;
        }
      }
      else {
          return "No Web3 Object detected. Read-only access" ;
        }
   },

  // UPDATES ACCOUNT AND BALANCE (ETH) WHENEVER THEY CHANGE
   polling: async ({commit,store,state}) => {
    console.log("polling ACTION FUNCTION CALLED IN STORE");
      setInterval(async () => {
        const accounts = await state.web3.eth.getAccounts();
        const account = accounts[0];
        // console.log(account);
        const newBalance_ = await state.web3.eth.getBalance(account);
        // console.log(newBalance_);
        if (account !== state.connectedWallet) {  // ACCOUNT CONNECTED CHANGED. BOTH ACCOUNT AND BALANCE UPDATED 
          commit('updateWallet',{ newWallet: account, newBalance: newBalance_});
          await store.dispatch("refreshConnectedWalletState");
          // EventBus.$emit(EventNames.userWalletConnected, { username: walletConnected,}); //User has logged in (event)          
        } 
        else if (newBalance_ !== state.ethBalance) {    // ONLY BALANCE UPDATED WHEN IT IS CHANGED
          commit('updateBalance',newBalance_);
        }
      }, 500);
    },


// ######################################################
// ############ getContractAddresses : calls getAddresses() to fetch and store all the contract addresses based on the network we are connected to (ETHEREUM/BSC) ############
// ############ getAddressesAndGlobalState : // fetches and updates all the contract addresses and the State ############
// ############ getSupportedInstrumentStatesData : Gets the addresses of the ITokens and the corresponding Insturments ############
// ######################################################

  // calls getAddresses() to fetch and store all the contract addresses based on the network we are connected to
  getContractAddresses: async ({commit, state}) => {
    console.log("getContractAddresses ACTION FUNCTION CALLED IN STORE");
    if ( state.networkId == '42')  {    // KOVAN 
      return await store.dispatch('getAddressesAndGlobalState',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractKovan });
    }  
    else if (state.networkId == '97') {   // BSC TESTNET
      return await store.dispatch('getAddressesAndGlobalState',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractBSCTestnet });
    }
    else if (state.networkId == '1') {    // ETHEREUM MAINNET
      return await store.dispatch('getAddressesAndGlobalState',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractMainNet });
    }
    else if (state.networkId == '56') {   // BSC MAINNET
      return await store.dispatch('getAddressesAndGlobalState',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractBSC });
    }
  },

  // [TESTED. WORKING AS EXPECTED] fetches and stores the protocol's contract addresses 
  getAddressesAndGlobalState: async ({commit,state},{globalAddressesProviderAddress}) => {

    const currentGlobalAddressesProviderContract = new state.web3.eth.Contract(GlobalAddressesProviderInterface.abi, globalAddressesProviderAddress );
    console.log(currentGlobalAddressesProviderContract);

    if (currentGlobalAddressesProviderContract) {
      console.log(globalAddressesProviderAddress);
      const sighAddress = await currentGlobalAddressesProviderContract.methods.getSIGHAddress().call();        
      commit('updateSIGHContractAddress',sighAddress);

      const sighSpeedControllerAddress = await currentGlobalAddressesProviderContract.methods.getSIGHSpeedController().call();        
      commit('updateSIGHSpeedControllerAddress',sighSpeedControllerAddress);

      const sighStakingContractAddress = await currentGlobalAddressesProviderContract.methods.getSIGHStaking().call();        
      commit('updatesighStakingContractAddress',sighStakingContractAddress);
      
      const sighTreasuryAddress = await currentGlobalAddressesProviderContract.methods.getSIGHTreasury().call();        
      commit('updateSIGHTreasuryContractAddress',sighTreasuryAddress);

      const sighDistributionHandlerAddress = await currentGlobalAddressesProviderContract.methods.getSIGHMechanismHandler().call();        
      commit('updateSIGHDistributionHandlerAddress',sighDistributionHandlerAddress);

      const lendingPoolAddress = await currentGlobalAddressesProviderContract.methods.getLendingPool().call();        
      commit('updateLendingPoolContractAddress',lendingPoolAddress);
  
      const lendingPoolCoreAddress = await currentGlobalAddressesProviderContract.methods.getLendingPoolCore().call();        
      commit('updateLendingPoolCoreContractAddress',lendingPoolCoreAddress);

      const lendingPoolDataProviderAddress = await currentGlobalAddressesProviderContract.methods.getLendingPoolDataProvider().call();        
      commit('updateLendingPoolDataProviderContract',lendingPoolDataProviderAddress);

      const iPriceOracleGetterAddress = await currentGlobalAddressesProviderContract.methods.getPriceOracle().call();        
      commit('updateIPriceOracleGetterAddress',iPriceOracleGetterAddress);

      await store.dispatch('getSupportedInstrumentStatesData');  // SUPPORTED INSTRUMENTS BASIC DATA

      return true;
    }
    else {
      return false;
    }
  },

  // [TESTED. WORKING AS EXPECTED] Gets the addresses of the ITokens and the corresponding Supported Instrument STATES
  getSupportedInstrumentStatesData: async ({commit,state}) => { 
    console.log("getSupportedInstrumentStatesData ACTION");
    if (state.web3 && state.isNetworkSupported && state.LendingPoolCoreContractAddress && state.LendingPoolCoreContractAddress != "0x0000000000000000000000000000000000000000") {
      const lendingPoolCoreContract = new state.web3.eth.Contract(LendingPoolCore.abi, state.LendingPoolCoreContractAddress );
      console.log(lendingPoolCoreContract);

      // Returns an array of supported instrument addresses
      const instruments = await lendingPoolCoreContract.methods.getInstruments().call();        
      commit('setSupportedInstrumentAddresses',instruments);

      const priceOracleContract = new state.web3.eth.Contract(IPriceOracleGetter.abi, state.IPriceOracleGetterAddress );

      // Loop over the instrument addresses to fetch iToken Address, name, symbol, decimals and add them to the supported instruments list
      if (instruments) {
        for (let i=0; i<instruments.length; i++) {
          let data = await store.dispatch('refershInstrumentState',{instrumentAddress: instruments[i] });
          let instrumentState = data.instrumentState;
          let instrumentConfiguration = data.instrumentConfiguration;
          let instrumentBalances = data.instrumentBalances;
          console.log('RETURNED DATA');
          console.log(instrumentState);
          console.log(instrumentConfiguration);
          console.log(instrumentBalances);
          instrumentState.price = null;
          commit('addToSupportedInstrumentsArray',instrumentState);
          commit('addToSupportedInstrumentsConfigsMapping',{instrumentAddress:instruments[i], instrumentDetails:instrumentState});
        }
        commit('updateSelectedInstrument',state.supportedInstruments[0]); // THE FIRST INSTRUMENT IS BY DEFAULT THE SELECTED INSTRUMENT

        let ethPriceDecimals = await priceOracleContract.methods.getAssetPriceDecimals(state.ethereumPriceOracleAddressKovan).call();
        commit('setEthPriceDecimals',ethPriceDecimals);                                                         // ETH Price Decimals
        let sighPriceDecimals  = await priceOracleContract.methods.getAssetPriceDecimals(state.SIGHContractAddress).call();
        commit('setSighPriceDecimals',sighPriceDecimals);                                                        // SIGH Price Decimals

        store.dispatch('initiatePollingETH_SIGHPrices');
      }
      return true;
    }
    else {
      console.log("Contracts have not been currently deployed on this network");
      return false;
    }
  },



  // FETCHES THE DATA FOR AN INSTRUMENT (CONFIGURATION & BALANCES)
  refershInstrumentState: async ({commit,state},{instrumentAddress}) => {
    let instrumentState = {};    
    let instrumentConfiguration = {};    
    let instrumentBalances = {};    

    const priceOracleContract = new state.web3.eth.Contract(IPriceOracleGetter.abi, state.IPriceOracleGetterAddress );
    if ( state.web3 && instrumentAddress && instrumentAddress!= '0x0000000000000000000000000000000000000000') {
      let erc20Contract = new state.web3.eth.Contract(ERC20Detailed.abi, instrumentAddress );      
      // INSTRUMENT BASIC DATA
      instrumentState.instrumentAddress = instrumentAddress;
      instrumentState.name = await erc20Contract.methods.name().call();
      instrumentState.symbol = await erc20Contract.methods.symbol().call();
      instrumentState.decimals = await erc20Contract.methods.decimals().call();
      instrumentState.priceDecimals = await priceOracleContract.methods.getAssetPriceDecimals(instrumentAddress).call();
      // INSTRUMENT CONFIGURATION          
      let instrumentConfig = await store.dispatch("getInstrumentConfiguration",{_instrumentAddress:instrumentAddress });  
      instrumentConfiguration.liquidationThreshold = instrumentConfig.liquidationThreshold;
      instrumentConfiguration.liquidationBonus = instrumentConfig.liquidationBonus;
      instrumentConfiguration.ltv = instrumentConfig.ltv;
      instrumentConfiguration.usageAsCollateralEnabled = instrumentConfig.usageAsCollateralEnabled;
      instrumentConfiguration.borrowingEnabled = instrumentConfig.borrowingEnabled;
      instrumentConfiguration.stableBorrowRateEnabled = instrumentConfig.stableBorrowRateEnabled;
      instrumentConfiguration.isActive = instrumentConfig.isActive;
      // INSTRUMENT GLOBAL BALANCES          
      let supportedInstrumentGlobalStates = await store.dispatch("getInstrumentMarketState",{_instrumentAddress:instrumentAddress });           
      instrumentState.iTokenAddress = supportedInstrumentGlobalStates.iTokenAddress;
      instrumentBalances.totalLiquidity = supportedInstrumentGlobalStates.totalLiquidity;
      instrumentBalances.totalBorrowsStable = supportedInstrumentGlobalStates.totalBorrowsStable;
      instrumentBalances.totalBorrowsVariable = supportedInstrumentGlobalStates.totalBorrowsVariable;
      instrumentBalances.totalBorrows = Number(supportedInstrumentGlobalStates.totalBorrowsStable) + Number(supportedInstrumentGlobalStates.totalBorrowsVariable) ;
      instrumentBalances.availableLiquidity = supportedInstrumentGlobalStates.availableLiquidity;
      instrumentBalances.liquidityRate = supportedInstrumentGlobalStates.liquidityRate;
      instrumentBalances.variableBorrowRate = supportedInstrumentGlobalStates.variableBorrowRate;
      instrumentBalances.stableBorrowRate = supportedInstrumentGlobalStates.stableBorrowRate;
      instrumentBalances.averageStableBorrowRate = supportedInstrumentGlobalStates.averageStableBorrowRate;
      instrumentBalances.utilizationRate = supportedInstrumentGlobalStates.utilizationRate;
      instrumentBalances.liquidityIndex = supportedInstrumentGlobalStates.liquidityIndex;
      instrumentBalances.variableBorrowIndex = supportedInstrumentGlobalStates.variableBorrowIndex;  
    }
    console.log(instrumentState);
    console.log(instrumentConfiguration);
    console.log(instrumentBalances);
      return {instrumentState, instrumentConfiguration,instrumentBalances};
  },




  refreshConnectedWalletState: async ({commit, state}) => {
    console.log("refreshConnectedWalletState : refreshing user Balances");
    try {
      let globalBalances = await store.dispatch("getUserProtocolState",{_user: state.connectedWallet});
      console.log('Global balances retrieved for the connected wallet');
      console.log(globalBalances);
      commit("setUserProtocolStateBalances",globalBalances);  // SETTING CONNECTED WALLET'S PROTOCOL LEVEL BALANCES
      console.log(state.supportedInstruments);
      commit("resetwalletInstrumentStates");  // SETTING CONNECTED WALLET'S PROTOCOL LEVEL BALANCES
      for (let i=0; i<state.supportedInstruments.length; i++ ) {
        console.log(state.supportedInstruments[i]);
        let userInstrumentBalance = {};
        userInstrumentBalance.instrument = state.supportedInstruments[i].instrumentAddress;
        userInstrumentBalance.symbol = state.supportedInstruments[i].symbol;
        userInstrumentBalance.decimals = state.supportedInstruments[i].decimals;
        userInstrumentBalance.priceDecimals = state.supportedInstruments[i].priceDecimals;
        userInstrumentBalance = await store.dispatch("getUserInstrumentState",{_instrumentAddress: state.supportedInstrumentAddresses[i] , _user :state.connectedWallet } );
        console.log(userInstrumentBalance);
        commit("addTowalletInstrumentStates",userInstrumentBalance);  // ADDING TO THE CONNECTED WALLET'S INSTRUMENT LEVEL BALANCES
      }    
      return true;
    }
    catch (error) {
      console.log(error);
      return false;
    }
  },



  // [TESTED. WORKING AS EXPECTED] KEEP UPDATING PRICES OF THE SUPPORTED INSTRUMENTS
  initiatePollingETH_SIGHPrices: async ({commit,state}) => {
    console.log("initiatePollingETH_SIGHPrices : updating prices");
    let instruments = state.supportedInstrumentAddresses;
    console.log(instruments);
    setInterval(async () => {
      if (instruments) {
          let updatedPrice_ = await store.dispatch('getInstrumentPrice', { _instrumentAddress : state.ethereumPriceOracleAddressKovan } );
          if (updatedPrice_) {
            commit("updateETHPrice",updatedPrice_);
            console.log( " ETH - current price is " + updatedPrice_);
          }
          let updatedSighPrice_ = await store.dispatch('getInstrumentPrice', { _instrumentAddress : state.SIGHContractAddress } );
          if (updatedSighPrice_) {
            console.log(" SIGH - current price is " + updatedSighPrice_);
            commit('updateSIGHPrice',updatedSighPrice_);  
          }
        }
    }, 5000);
  },

// ######################################################
// ############ getInstrumentPrice --- VIEW Funtion to get instrument's price from the price oracle
// ######################################################

  // [TESTED. WORKING AS EXPECTED] Gets the current price of the instrument
  getInstrumentPrice: async ({commit,state},{_instrumentAddress}) => {
    if (state.web3 && state.IPriceOracleGetterAddress && state.IPriceOracleGetterAddress!= "0x0000000000000000000000000000000000000000" ) {
      const priceOracleContract = new state.web3.eth.Contract(IPriceOracleGetter.abi, state.IPriceOracleGetterAddress );
      console.log('getInstrumentPrice');
      console.log(_instrumentAddress);
      let response = await priceOracleContract.methods.getAssetPrice(_instrumentAddress).call();
      console.log(response);
      return response;
    }
    else {
      console.log('getInstrumentPrice() function in store.js. Protocol not supported on connected blockchain network');
      return null;
    }
  },

// ######################################################
// ############ GET SUPPORTED INSTRUMENT's MARKET CONFIGURATION AND STATE
// ######################################################

getInstrumentConfiguration: async ({commit,state},{_instrumentAddress}) => {
  if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    console.log('getInstrumentConfiguration');
    console.log(_instrumentAddress);
    let response = await lendingPoolContract.methods.getInstrumentConfigurationData(_instrumentAddress).call();
    console.log(response);
    return response;
  }
  else {
    console.log('getInstrumentConfiguration() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},

getInstrumentMarketState: async ({commit,state},{_instrumentAddress}) => {
  if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    console.log('getInstrumentMarketState');
    console.log(_instrumentAddress);
    let response = await lendingPoolContract.methods.getInstrumentData(_instrumentAddress).call();
    console.log(response);
    return response;
  }
  else {
    console.log('getInstrumentMarketState() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},

// ######################################################
// ############ GET THE CONNECTED ACCOUNT's GLOBAL STATE AND INSTRUMENT MARKET STATE
// ######################################################

getUserProtocolState: async ({commit,state},{_user}) => {
  if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    console.log('getUserProtocolState');
    console.log(_user);
    let response = await lendingPoolContract.methods.getUserAccountData(_user).call();
    console.log(response);
    return response;å
  }
  else {
    console.log('getUserProtocolState() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},

getUserInstrumentState: async ({commit,state},{_instrumentAddress, _user}) => {
  if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    console.log('getUserInstrumentState');
    console.log(_instrumentAddress);
    console.log(_user);
    try {
      let response = await lendingPoolContract.methods.getUserInstrumentData(_instrumentAddress,_user).call();
      console.log(response);
      return response;
    }
    catch (error) {
      console.log(error);
      return [];
    }
  }
  else {
    console.log('getUserInstrumentState() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},


// ######################################################
// ############ SIGH ---  SIGH_mintCoins() FUNCTION : mint new Coins when cycle gets completed
// ############ SIGHSPEEDCONTROLLER --- DRIP() FUNCTION 
// ######################################################

    SIGH_mintCoins: async ({commit,state}) => {
      if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
        console.log(sighContract);
        sighContract.methods.mintCoins().send({from: state.connectedWallet})
        .then(receipt => { 
          console.log(receipt);
          return receipt;
          })
        .catch(error => {
          console.log(error);
          return error;
        })
      }
      else {
        console.log("SIGH Finance (SIGH Instrument Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Instrument Contract) is currently not been deployed on ";
      }
    },

    SIGHSpeedController_drip: async ({commit,state}) => {
      if (state.web3 && state.SIGHSpeedControllerAddress && state.SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, state.SIGHSpeedControllerAddress );
        console.log(sighSpeedControllerContract);
        sighSpeedControllerContract.methods.drip().send({from: state.connectedWallet})
        .then(receipt => { 
          console.log(receipt);
          return receipt;
          })
        .catch(error => {
          console.log(error);
          return error;
        })
      }
      else {
        console.log("SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on ";
      }
    },

// ######################################################
// ############ SIGHDISTRIBUTIONHANDLER --- REFRESHSIGHSPEEDS() FUNCTION 
// ############ SIGHTREASURY --- BURN() FUNCTION ############
// ############ SIGHTREASURY --- DRIP() FUNCTION ############
// ############ SIGHTREASURY --- UPDATEINSTRUMENT() FUNCTION ############
// ######################################################

    SIGHDistributionHandler_refreshSighSpeeds: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        console.log(sighDistributionHandlerContract);
        sighDistributionHandlerContract.methods.refreshSIGHSpeeds().send({from: state.connectedWallet})
        .then(receipt => { 
          console.log(receipt);
          return receipt;
          })
        .catch(error => {
          console.log(error);
          return error;
        })
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },

    SighTreasury_burnSIGHTokens: async ({commit,state}) => {
      if (state.web3 && state.SIGHTreasuryContractAddress && state.SIGHTreasuryContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighTreasuryContract = new state.web3.eth.Contract(SighTreasuryInterface.abi, state.SIGHTreasuryContractAddress );
        console.log(sighTreasuryContract);
        sighTreasuryContract.methods.burnSIGHTokens().send({from: state.connectedWallet})
        .then(receipt => { 
          console.log(receipt);
          return receipt;
          })
        .catch(error => {
          console.log(error);
          return error;
        })
      }
      else {
        console.log("SIGH Finance (SIGH Treasury Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Treasury Contract) is currently not been deployed on ";
      }
    },

    SighTreasury_drip: async ({commit,state}) => {
      if (state.web3 && state.SIGHTreasuryContractAddress && state.SIGHTreasuryContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighTreasuryContract = new state.web3.eth.Contract(SighTreasuryInterface.abi, state.SIGHTreasuryContractAddress );
        console.log(sighTreasuryContract);
        sighTreasuryContract.methods.drip().send({from: state.connectedWallet})
        .then(receipt => { 
          console.log(receipt);
          return receipt;
          })
        .catch(error => {
          console.log(error);
          return error;
        })
      }
      else {
        console.log("SIGH Finance (SIGH Treasury Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Treasury Contract) is currently not been deployed on ";
      }
    },

    // instrument_address --> address of the instrument (should be supported by the treasury) whose balance is to be updated
    SighTreasury_updateInstrumentBalance: async ({commit,state},{instrument_address}) => {
      if (state.web3 && state.SIGHTreasuryContractAddress && state.SIGHTreasuryContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighTreasuryContract = new state.web3.eth.Contract(SighTreasuryInterface.abi, state.SIGHTreasuryContractAddress );
        console.log(sighTreasuryContract);
        sighTreasuryContract.methods.updateInstrumentBalance(instrument_address).send({from: state.connectedWallet})
        .then(receipt => { 
          console.log(receipt);
          return receipt;
          })
        .catch(error => {
          console.log(error);
          return error;
        })
      }
      else {
        console.log("SIGH Finance (SIGH Treasury Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Treasury Contract) is currently not been deployed on ";
      }
    },

// ######################################################
// ############ SIGH Staking --- stake_SIGH() FUNCTION 
// ############ SIGH Staking --- unstake_SIGH() FUNCTION ############
// ############ SIGH Staking --- claimAllAccumulatedInstruments() FUNCTION ############
// ############ SIGH Staking --- instrumentToBeClaimed() FUNCTION ############
// ############ SIGH Staking --- updateBalance() FUNCTION ############
// ############ SIGH Staking --- getStakedBalanceForStaker() VIEW FUNCTION ############
// ######################################################

    SIGHStaking_stake_SIGH: async ({commit,state},{amountToBeStaked}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);
        try {             // console.log('Making transaction (in store)');
          const response = await sighStakingContract.methods.stake_SIGH(amountToBeStaked).send({from: state.connectedWallet});
          console.log(response);
          return response;
        }
        catch(error) {    // console.log('Making transaction (in store - catch)');            
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Staking Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Staking Contract) is currently not been deployed on ";
      }
    },

    SIGHStaking_unstake_SIGH: async ({commit,state},{amountToBeUNStaked}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);        
        try {             // console.log('Making transaction (in store)');
          const response = await sighStakingContract.methods.unstake_SIGH(amountToBeUNStaked).send({from: state.connectedWallet});
          console.log(response);
          return response;
        }
        catch(error) {    // console.log('Making transaction (in store - catch)');            
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Staking Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Staking Contract) is currently not been deployed on ";
      }
    },

    SIGHStaking_claimAllAccumulatedInstruments: async ({commit,state}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);        
        try {             // console.log('Making transaction (in store)');
          const response = await sighStakingContract.methods.claimAllAccumulatedInstruments().send({from: state.connectedWallet});
          console.log(response);
          return response;
        }
        catch(error) {    // console.log('Making transaction (in store - catch)');            
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Staking Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Staking Contract) is currently not been deployed on ";
      }
    },

    SIGHStaking_claimAccumulatedInstrument: async ({commit,state},{instrumentToBeClaimed}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);
        try {             // console.log('Making transaction (in store)');
          const response = await sighStakingContract.methods.claimAccumulatedInstrument(instrumentToBeClaimed).send({from: state.connectedWallet});
          console.log(response);
          return response;
        }
        catch(error) {    // console.log('Making transaction (in store - catch)');            
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Staking Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Staking Contract) is currently not been deployed on ";
      }
    },

    SIGHStaking_updateBalance: async ({commit,state},{instrument}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);        
        try {             // console.log('Making transaction (in store)');
          const response = await sighStakingContract.methods.updateBalance(instrument).send({from: state.connectedWallet});
          console.log(response);
          return response;
        }
        catch(error) {    // console.log('Making transaction (in store - catch)');            
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Staking Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Staking Contract) is currently not been deployed on ";
      }
    },

    SIGHStaking_getStakedBalanceForStaker: async ({commit,state},{_user}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);
        const response = await sighStakingContract.methods.getStakedBalanceForStaker(_user).call();
        console.log(response);
        return response;
      }
      else {
        console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
        return "This particular Instrument is currently not supported by SIGH Finance on ";
      }
    },

// ######################################################
// ############ Lending Pool --- deposit() FUNCTION 
// ############ Lending Pool --- borrow() FUNCTION 
// ############ Lending Pool --- repay() [] FUNCTION 
// ############ Lending Pool --- swapBorrowRateMode() [SWAP BETWEEN STABLE AND VARIABLE BORROW RATE MODES] FUNCTION 
// ############ Lending Pool --- rebalanceStableBorrowRate() [rebalances the stable interest rate of a user if current liquidity rate > user stable rate] FUNCTION 
// ############ Lending Pool --- setUserUseInstrumentAsCollateral() [DEPOSITORS CAN ENABLE DISABLE SPECIFIC DEPOSIT AS COLLATERAL  ] FUNCTION 
// ############ Lending Pool --- liquidationCall() [users can invoke this function to liquidate an undercollateralized position ] FUNCTION 
// ############ Lending Pool --- flashLoan() [FLASH LOAN (total fee = protocol fee + fee distributed among depositors)] FUNCTION 
// ######################################################

    // INTEGRATED. FUNCTIONING AS EXPECTED
    LendingPool_deposit: async ({commit,state},{_instrument,_amount,_referralCode}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          // console.log('Making transaction (in store)');
          // let quantityInBigNumber = new BigNumber(this._amount);
          // quantityInBigNumber.shiftedBy(state.supportedInstrumentConfigs.get(_instrument).decimals);
          // console.log('Quantity To Deposit (Big Number)' + quantityInBigNumber);
          const response = await lendingPoolContract.methods.deposit(_instrument,_amount,_referralCode).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_borrow: async ({commit,state},{_instrument,_amount,_interestRateMode,_referralCode}) => {
      console.log(_instrument);     
      console.log(_amount);     
      console.log(_interestRateMode);     
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {             // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.borrow(_instrument,_amount,_interestRateMode,_referralCode).send({from: state.connectedWallet});
          console.log(response);
          return response;
        }
        catch(error) {    // console.log('Making transaction (in store - catch)');            
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_repay: async ({commit,state},{_instrument,_amount,_onBehalfOf}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        const response = await lendingPoolContract.methods.repay(_instrument,_amount,_onBehalfOf).send({from: state.connectedWallet});
        try {
          // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.repay(_instrument,_amount,_onBehalfOf).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
        catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
        }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_swapBorrowRateMode: async ({commit,state},{_instrument}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.swapBorrowRateMode(_instrument).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_rebalanceStableBorrowRate: async ({commit,state},{_instrument,_user}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.rebalanceStableBorrowRate(_instrument,_user).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_setUserUseInstrumentAsCollateral: async ({commit,state},{_instrument,_useAsCollateral}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.setUserUseInstrumentAsCollateral(_instrument,_useAsCollateral).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_liquidationCall: async ({commit,state},{_collateral,_instrument,_user,_purchaseAmount,_receiveIToken}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.liquidationCall(_collateral,_instrument,_user,_purchaseAmount,_receiveIToken).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_flashLoan: async ({commit,state},{_receiver,_instrument,_user,_amount,_params}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          // console.log('Making transaction (in store)');
          const response = await lendingPoolContract.methods.flashLoan(_instrument,_useAsCollateral).send({from: state.connectedWallet});
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_getInstrumentConfigurationData: async ({commit,state},{_instrument}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getInstrumentConfigurationData(_instrument).call();
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },    

    LendingPool_getInstrumentData: async ({commit,state},{_instrument}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getInstrumentData(_instrument).call();
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_getUserAccountData: async ({commit,state},{_user}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getUserAccountData(_user).call();
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    LendingPool_getUserInstrumentData: async ({commit,state},{_instrument, _user}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getUserInstrumentData(_instrument, _user).call();
          console.log(response);
          return response;
          }
          catch(error) {
            // console.log('Making transaction (in store - catch)');
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },    
    
    LendingPoolCore_getUserBorrowBalances: async ({commit,state},{_instrument,_user}) => {
      if (state.web3 && state.LendingPoolCoreContractAddress && state.LendingPoolCoreContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolCoreContract = new state.web3.eth.Contract(LendingPoolCore.abi, state.LendingPoolCoreContractAddress );
        console.log(lendingPoolCoreContract);
        const response = await lendingPoolCoreContract.methods.getUserBorrowBalances(_instrument,_user).call();
        console.log(response);
        return response;
      }
      else {
        console.log("SIGH Finance (Lending Pool Core Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Core Contract) is currently not been deployed on ";
      }
    },

    LendingPoolCore_getUserBasicInstrumentData: async ({commit,state},{_instrument,_user}) => {
      if (state.web3 && state.LendingPoolCoreContractAddress && state.LendingPoolCoreContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolCoreContract = new state.web3.eth.Contract(LendingPoolCore.abi, state.LendingPoolCoreContractAddress );
        console.log('LendingPoolCore_getUserBasicInstrumentData');
        console.log(_instrument);
        console.log(_user);
        console.log(lendingPoolCoreContract);
        const response = await lendingPoolCoreContract.methods.getUserBasicInstrumentData(_instrument,_user).call();
        console.log(response);
        return response;
      }
      else {
        console.log("SIGH Finance (Lending Pool Core Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Core Contract) is currently not been deployed on ";
      }
    },
    
    

// ######################################################
// ############ ITOKEN Functions --- redeem() FUNCTION 
// ************* Interest Streaming Functions *************
// ############ ITOKEN Functions --- redirectInterestStream() FUNCTION 
// ############ ITOKEN Functions --- allowInterestRedirectionTo() FUNCTION 
// ############ ITOKEN Functions --- redirectInterestStreamOf() FUNCTION 
// ************* SIGH Streaming Functions *************
// ############ ITOKEN Functions --- redirectSighStream()  FUNCTION 
// ############ ITOKEN Functions --- allowSighRedirectionTo()  FUNCTION 
// ############ ITOKEN Functions --- redirectSighStreamOf()  FUNCTION 
// ############ ITOKEN Functions --- claimMySIGH() FUNCTION 
// ************* VIEW Functions *************
// ############ ITOKEN Functions --- isTransferAllowed() VIEW FUNCTION 
// ############ ITOKEN Functions --- principalBalanceOf() VIEW FUNCTION 
// ############ ITOKEN Functions --- getInterestRedirectionAddress() VIEW FUNCTION 
// ############ ITOKEN Functions --- interestRedirectionAllowances() VIEW FUNCTION 
// ############ ITOKEN Functions --- getRedirectedBalance() VIEW FUNCTION 
// ############ ITOKEN Functions --- getSighAccured() VIEW FUNCTION 
// ############ ITOKEN Functions --- getSighStreamRedirectedTo() VIEW FUNCTION 
// ############ ITOKEN Functions --- getSighStreamAllowances() VIEW FUNCTION 
// ######################################################

IToken_redeem: async ({commit,state},{iTokenAddress,_amount}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redeem(_amount).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_redirectInterestStream: async ({commit,state},{iTokenAddress,_to}) => {
  // Instrument Not supported on the connected Network
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectInterestStream(_to).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_allowInterestRedirectionTo: async ({commit,state},{iTokenAddress,_to}) => {
  // Instrument Not supported on the connected Network
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.allowInterestRedirectionTo(_to).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_redirectInterestStreamOf: async ({commit,state},{iTokenAddress,_from,_to}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectInterestStreamOf(_from,_to).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_redirectSighStream: async ({commit,state},{iTokenAddress,_to}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectSighStream(_to).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_redirectSighStreamOf: async ({commit,state},{iTokenAddress,_from,_to}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectSighStreamOf(_from,_to).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_allowSighRedirectionTo: async ({commit,state},{iTokenAddress,_to}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.allowSighRedirectionTo(_to).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_claimMySIGH: async ({commit,state},{iTokenAddress}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.claimMySIGH().send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_isTransferAllowed: async ({commit,state},{iTokenAddress,_user,_amount}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    const response = await iTokenContract.methods.isTransferAllowed(_user,_amount).call();
    console.log(response);
    return response;  
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_principalBalanceOf: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    const response = await iTokenContract.methods.principalBalanceOf(_user).call();
    console.log(response);
    return response;  
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getInterestRedirectionAddress: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log('IToken_getInterestRedirectionAddress');
    console.log(iTokenContract);
    const response = await iTokenContract.methods.getInterestRedirectionAddress(_user).call();
    console.log(response);
    return response;  
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},


// Returns the account which holds the right to re-direct interest of the user account
IToken_getinterestRedirectionAllowances: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log('IToken_getinterestRedirectionAllowances');
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.interestRedirectionAllowances(_user).call();
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;    
    }
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},



IToken_getRedirectedBalance: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log('IToken_getRedirectedBalance');
    console.log(iTokenContract);
    const response = await iTokenContract.methods.getRedirectedBalance(_user).call();
    console.log(response);
    return response;  
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getSighAccured: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log('IToken_getSighAccured');
    console.log(iTokenAddress);
    console.log(_user);
    console.log(iTokenContract);
    const response = await iTokenContract.methods.getRedirectedBalance(_user).call();
    console.log(response);
    return response;
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getSighStreamRedirectedTo: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log('IToken_getSighStreamRedirectedTo');
    console.log(iTokenAddress);
    console.log(_user);
    console.log(iTokenContract);
    const response = await iTokenContract.methods.getSighStreamRedirectedTo(_user).call();
    console.log(response);
    return response;
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getSighStreamAllowances: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log('IToken_getSighStreamAllowances');
    console.log(iTokenAddress);
    console.log(_user);
    console.log(iTokenContract);
    const response = await iTokenContract.methods.getSighStreamAllowances(_user).call();
    console.log(response);
    return response;
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

// ######################################################
// ############ ERC20 Standard Functions --- approve() FUNCTION 
// ############ ERC20 Standard Functions --- transfer() FUNCTION 
// ############ ERC20 Standard Functions --- transferFrom() FUNCTION 
// ############ ERC20 Standard Functions --- increaseAllowance() FUNCTION 
// ############ ERC20 Standard Functions --- decreaseAllowance() FUNCTION 
// ############ ERC20 Standard Functions --- allowance() VIEW FUNCTION 
// ############ ERC20 Standard Functions --- totalSupply() VIEW FUNCTION 
// ############ ERC20 Standard Functions --- balanceOf() VIEW FUNCTION 
// ######################################################

ERC20_approve: async ({commit,state},{tokenAddress,spender,amount }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      // let quantityInBigNumber = new BigNumber(amount);
      // console.log(quantityInBigNumber);
      // console.log(state.supportedInstrumentConfigs.get(tokenAddress).decimals);
      // quantityInBigNumber.shiftedBy(Number(state.supportedInstrumentConfigs.get(tokenAddress).decimals));
      // console.log('Quantity To Deposit (Big Number)' + quantityInBigNumber);
      const response = await erc20Contract.methods.approve(spender,amount).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_mint: async ({commit,state},{tokenAddress,quantity }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(MintableERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.mint(quantity).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},


ERC20_transfer: async ({commit,state},{tokenAddress,recepient,amount }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.transfer(recepient,amount).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_transferFrom: async ({commit,state},{tokenAddress,sender,recepient,amount }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.transferFrom(sender,recepient,amount).send({from: state.connectedWallet});
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_increaseAllowance: async ({commit,state},{tokenAddress,spender,addedValue }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.increaseAllowance(spender,addedValue).send({from: state.connectedWallet})
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_decreaseAllowance: async ({commit,state},{tokenAddress,spender,subtractedValue }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.decreaseAllowance(spender,subtractedValue).send({from: state.connectedWallet})
      console.log(response);
      return response;  
    }
    catch (error) {
      console.log(error);
      return error;
    }
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_getAllowance: async ({commit,getters,state},{tokenAddress,owner,spender }) => {
  console.log(tokenAddress);
  if (state.web3 && owner && spender && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    // console.log(erc20Contract);
    const response = await erc20Contract.methods.allowance(owner,spender).call();
    // console.log(response);
    // let quantityInBigNumber = new BigNumber(response);
    // quantityInBigNumber.shiftedBy( -1 * Number(state.supportedInstrumentConfigs.get(tokenAddress).decimals));
    console.log('Current allowance (value returned) - ' + response);
    return response;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_balanceOf: async ({commit,state},{tokenAddress,account }) => {
  if (state.web3 && account && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    console.log('Balance Of Call');
    const response = await erc20Contract.methods.balanceOf(account).call();
    console.log(response);
    return response;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_totalSupply: async ({commit,state},{tokenAddress}) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    const response = await erc20Contract.methods.totalSupply().call();
    console.log(response);
    return response;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

// #########################################
// ############ UTILITY ACTIONS ############
// #########################################

  getRevertReason: async ({commit,state},{txhash,blockNumber}) => {

    console.log(await getRevertReason(txhash)); // ''

    let network = 'kovan';
    let kovanNet = "https://ropsten.infura.io/v3/b058e74d0b9e43f8aefbc2a1a0debbe7";
    const provider = new Web3.providers.HttpProvider(kovanNet);
    console.log(await getRevertReason(txhash, network, blockNumber, provider)) // 'BA: Insufficient gas (ETH) for refund'
  },

  getMarketChartFromCoinGecko: async({state},{address}) => {
    const ratePerDay = {};
    address: '0x514910771af9ca656af840dff83e8264ecf986ca';
    const uri = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}/market_chart?vs_currency=usd&days=60`;
    try {
      const marketChart = await fetch(uri).then(res => res.json());
      marketChart.prices.forEach(p => {
        const date = new Date();
        date.setTime(p[0]);
        const day = date.toISOString();
        ratePerDay[day] = p[1];
      });
      return ratePerDay;
    } catch (e) {
      return Promise.reject();
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
