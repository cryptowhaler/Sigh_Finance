import Vue from 'vue';
import Vuex from 'vuex';
// import {dateToDisplayTime,} from '@/utils/utility';
import Web3 from 'web3';
import BigNumber from "bignumber.js";
import EventBus, { EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

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
    ethereumPriceOracleAddressMainNet: "",
    GlobalAddressesProviderContractBSCTestnet: null,
    ethereumPriceOracleAddressBSCTestnet: "",
    GlobalAddressesProviderContractBSC: null,
    ethereumPriceOracleAddressBSC: "",

    GlobalAddressesProviderAddress: null,
    EthereumPriceOracleAddress: null,
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
    supportedInstrumentSIGHStates: new Map(),       //   INSTRUMENT                    // SIGH Speeds etc
    supportedInstrumentConfigs: new Map(),        //   INSTRUMENT                    // Instrument Address -> Instrument Config  MAPPING  (instrument's liquidation threshold etc)
    walletInstrumentStates: new Map(),            //   WALLET - INSTRUMENT           // CONNECTED WALLET --> "EACH INSTRUMENT" STATE MAPPING ( deposited, balance, borrowed, fee, etc )
    walletSIGH_FinanceState: {},                //   WALLET - SIGH FINANCE         // CONNECTED WALLET --> "SIGH FINANCE" STATE MAPPING (total deposited, total borrowed, lifeTime Deposit, lifeTime Borrowed,  )
    walletSIGHState: {},                        //   WALLET - SIGH Token           // CONNECTED WALLET --> "SIGH" STATE MAPPING (sigh balance, lifeTimeSighVolume, contributionRatio = lifeTimeSighVolume/ SighGlobalTradeVolume)
    SIGHFinanceState: {},                       //   SIGH FINANCE                  // SIGH's STATE (totalSupply, mintSpeed, burnSpeed, totalMinted, price, Sigh Global Trade Volume, bonding Curve Health)
    SIGHState: {},                              //   SIGH                          // SIGH's STATE (totalSupply, mintSpeed, burnSpeed, totalMinted, price, Sigh Global Trade Volume, bonding Curve Health)

    currentlySelectedInstrument : {symbol:'WBTC',instrumentAddress: '0x0000000000000000000000000000000000000000' , name: 'Wrapped Bitcoin', symbol: 'WBTC', decimals: 18, iTokenAddress: '0x0000000000000000000000000000000000000000' , priceDecimals: 8, price: 0 },  // Currently Selected Instrument

    // TRANSACTIONS HISTORY FOR THE CURRENT SESSION
    sessionPendingTransactions : [],
    sessionSuccessfulTransactions : [],
    sessionFailedTransactions : [],
    
    // ETH PRICE 
    ethPriceDecimals: null,             // Decimals 
    ethereumPriceUSD: null,             // ETH Price in USD

    // BLOCKS REMAINING FOR SIGH SPEED REFRESH
    blocksRemainingForSIGHSpeedRefresh : null,

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
    // ETH PRICE ORACLE ADDRESS, PRICE (ETH to USD), Price Decimals
    getETHPriceOracleAddress(state) {
      return state.EthereumPriceOracleAddress;
    },     
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
    // SUPPRTED INSTRUMENTS - SIGH STATE
    getsupportedInstrumentSIGHStates(state) {
      return state.supportedInstrumentSIGHStates;
    },
    getsupportedInstrumentSIGHState(state,instrumentAddress) {
      return state.supportedInstrumentSIGHStates.get(instrumentAddress);
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
    getblocksRemainingForSIGHSpeedRefresh(state) {
      return state.blocksRemainingForSIGHSpeedRefresh;
    },
    // TRAANSACTION HISTORY
    getSessionPendingTransactions() {
      return state.sessionPendingTransactions;
    },
    getSessionSuccessfulTransactions() {
      return state.sessionSuccessfulTransactions;
    },
    getSessionFailedTransactions() {
      return state.sessionFailedTransactions;
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
    setGlobalAddressesProviderAddress(state,newContractAddress) {         
      state.GlobalAddressesProviderAddress = newContractAddress;
      console.log("In setGlobalAddressesProviderAddress - " + state.GlobalAddressesProviderAddress);
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
    // ############ SESSION DATA ############
    // ######################################################
    // ETH PRICE ORACLE ADDRESS, PRICE (ETH to USD), Price Decimals
    setEthereumPriceOracleAddress(state, _EthereumPriceOracleAddress) {
      state.EthereumPriceOracleAddress = _EthereumPriceOracleAddress;
      console.log('setEthereumPriceOracleAddress ' + state.EthereumPriceOracleAddress);      
    },
    setEthPriceDecimals(state, decimals) {
      state.ethPriceDecimals = decimals;
      console.log('setEthPriceDecimals ' + state.ethPriceDecimals);      
    },
    updateETHPrice(state, updatedPrice) {
      state.ethereumPriceUSD = updatedPrice;
      // console.log('In updateETHPrice - ' + state.ethereumPriceUSD);
    },
    updateBlocksRemainingForSIGHSpeedRefresh(state,blockRemaining_) {
      state.blocksRemainingForSIGHSpeedRefresh = blockRemaining_;
      console.log('In updateBlocksRemainingForSIGHSpeedRefresh - ' + state.blocksRemainingForSIGHSpeedRefresh);
    },
    // SIGH FINANCE
    setSIGHFinanceState(state,sighFinanceState) {
      state.SIGHFinanceState = sighFinanceState;
      console.log('In setSIGHFinanceState (MUTATION)');
      console.log(state.SIGHFinanceState);
    },
    // SIGH INSTRUMENT
    setSIGHState(state,sighState) {
      state.SIGHState = sighState;
      console.log('In setSIGHState (MUTATION)');
      console.log(state.SIGHState);
    },
    // SUPPRTED INSTRUMENT ADDRESSES ARRAY
    setSupportedInstrumentAddresses(state,supportedInstrumentAddresses_) {
      state.supportedInstrumentAddresses = supportedInstrumentAddresses_;
      console.log('In setSupportedInstrumentAddresses (MUTATION)');
      console.log(state.supportedInstrumentAddresses);
    },
    addToSupportedInstrumentsArray(state,supportedInstrument_) {
      state.supportedInstruments.push(supportedInstrument_);
      console.log('In addToSupportedInstrumentsArray (MUTATION)');
      console.log(supportedInstrument_);
    },
    resetSupportedInstrumentsArray(state) {
      state.supportedInstruments = [];
      console.log('In resetSupportedInstrumentsArray -');
    },
    // SUPPRTED INSTRUMENTS - GLOBAL STATE (MAP)
    addToSupportedInstrumentGlobalStates(state,{instrumentAddress, instrumentGlobalState}) {
      state.supportedInstrumentGlobalStates.set(instrumentAddress,instrumentGlobalState);
      console.log('In addToSupportedInstrumentGlobalStates (MUTATION)');
      console.log(instrumentGlobalState);
    },
    resetSupportedInstrumentGlobalStates(state) {
      state.supportedInstrumentGlobalStates = new Map();
      console.log('In resetSupportedInstrumentGlobalStates -');
    },
    // SUPPRTED INSTRUMENTS - SIGH STATE (MAP)
    addToSupportedInstrumentSIGHStates(state,{instrumentAddress, instrumentSIGHState}) {
      state.supportedInstrumentSIGHStates.set(instrumentAddress,instrumentSIGHState);
      console.log('In addToSupportedInstrumentSIGHStates (MUTATION)');
      console.log(instrumentSIGHState);
    },
    resetSupportedInstrumentSIGHStates(state) {
      state.supportedInstrumentSIGHStates = new Map();
      console.log('In resetSupportedInstrumentGlobalStates -');
    },
    // SUPPRTED INSTRUMENTS - CONFIG STATE (MAP)    
    addToSupportedInstrumentConfigs(state,{instrumentAddress, instrumentConfig}) {
      state.supportedInstrumentConfigs.set(instrumentAddress,instrumentConfig);
      console.log('In addToSupportedInstrumentConfigs (MUTATION)');
      console.log(instrumentConfig);
    },
    resetSupportedInstrumentConfigs(state) {
      state.supportedInstrumentConfigs = new Map();
      console.log('In resetSupportedInstrumentConfigs -');
    },
    // WALLET  - SUPPORTED INSTRUMENTS (MAP)     
    addToWalletInstrumentStates(state,{instrumentAddress, walletInstrumentState}) {
      state.walletInstrumentStates.set(instrumentAddress,walletInstrumentState);
      console.log('In addToWalletInstrumentStates -');
      console.log(state.walletInstrumentStates.get(instrumentAddress));
    },
    resetWalletInstrumentStates(state) {
      state.walletInstrumentStates = new Map();
      console.log('In resetWalletInstrumentStates -');
    },
    // WALLET  - SIGH FINANCE   
    setWalletSIGH_FinanceState(state,walletSighFinanceState) {
      state.walletSIGH_FinanceState =  walletSighFinanceState;
      console.log('In setWalletSIGH_FinanceState -');
      console.log(state.walletSIGH_FinanceState);
    },
    // WALLET  - SIGH INSTRUMENT
    setWalletSIGHState(state,walletSIGHState_) {
      state.walletSIGHState =  walletSIGHState_;
      console.log('In setWalletSIGHState -');
      console.log(state.walletSIGHState);
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
    // TRANSACTIONS HISTORY
    setSessionPendingTransactions(state,pendingTransactions) {
      state.sessionPendingTransactions = pendingTransactions;
      console.log("In setSessionPendingTransactions ");
      console.log(state.sessionPendingTransactions);
    },
    addToSessionPendingTransactions(state,newTransaction) {
      state.sessionPendingTransactions.unshift(newTransaction);
      console.log("In addToSessionPendingTransactions ");
      console.log(newTransaction);
    },
    addToSessionSuccessfulTransactions(state,newTransaction) {
      state.sessionSuccessfulTransactions.unshift(newTransaction);
      console.log("In addToSessionSuccessfulTransactions ");
      console.log(newTransaction);
    },
    addToSessionFailedTransactions(state,newTransaction) {
      state.sessionFailedTransactions.unshift(newTransaction) ;
      console.log("In addToSessionFailedTransactions ");
      console.log(newTransaction);
    },



    toggleSidebar(state) {    //Disables/Enables page scroll when side-bar is loaded (mobile)
      if (!state.sidebarOpen) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
      state.sidebarOpen = !state.sidebarOpen;
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
        // console.log(state.web3);
        const networkId = await state.web3.eth.net.getId(); 
        // console.log(networkId);
        commit('networkId',networkId);        
        try {                                  // Request account access if needed
          await window.ethereum.enable();
          return 'EthereumEnabled';
        } 
        catch (error) {
          return 'EthereumNotEnabled';
        }
      }
      // IN CASE BINANCE-CHAIN HAS BEEN INJECTED IN THE WINDOW
      else if (window.BinanceChain) {
        state.web3 = new Web3(window.BinanceChain);
        const networkId = await state.web3.BinanceChain.chainId;
        // console.log(networkId);
        commit('networkId',networkId);        
        return 'BSCConnected';
      } 
      // OLDER BROWSERS etc
      else if (window.web3) {      //   // // // For older version dapp browsers ... Use Mist / MetaMask's provider.
        state.web3 = new Web3(window.web3.currentProvider);
        const networkId = await state.web3.eth.net.getId(); 
        // console.log(networkId);
        commit('networkId',networkId);        
        return 'Web3Connected';
      }
      else {    // If the provider is not found, it will default to the local network ...
        console.log("No Ethereum interface injected into browser. Read-only access");
        return 'false';
      }
    },



  // calls getAddresses() to fetch and store all the contract addresses based on the network we are connected to
  getContractsBasedOnNetwork: async ({commit, state}) => {
    console.log("getContractsBasedOnNetwork ACTION FUNCTION CALLED IN STORE");
    if ( state.networkId == '42')  {    // KOVAN 
      commit("setEthereumPriceOracleAddress",state.ethereumPriceOracleAddressKovan);
      commit("setGlobalAddressesProviderAddress",state.GlobalAddressesProviderContractKovan);
      return await store.dispatch('getProtocolContractAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractKovan });
    }  
    else if (state.networkId == '97') {   // BSC TESTNET
      commit("setEthereumPriceOracleAddress",state.ethereumPriceOracleAddressBSCTestnet);
      commit("setGlobalAddressesProviderAddress",state.GlobalAddressesProviderContractBSCTestnet);
      return await store.dispatch('getProtocolContractAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractBSCTestnet });
    }
    else if (state.networkId == '1') {    // ETHEREUM MAINNET
      commit("setEthereumPriceOracleAddress",state.ethereumPriceOracleAddressMainNet);
      commit("setGlobalAddressesProviderAddress",state.GlobalAddressesProviderContractMainNet);
      return await store.dispatch('getProtocolContractAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractMainNet });
    }
    else if (state.networkId == '56') {   // BSC MAINNET
      commit("setEthereumPriceOracleAddress",state.ethereumPriceOracleAddressBSC);
      commit("setGlobalAddressesProviderAddress",state.GlobalAddressesProviderContractBSC);
      return await store.dispatch('getProtocolContractAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractBSC });
    }
  },



  // [TESTED. WORKING AS EXPECTED] fetches and stores the protocol's contract addresses 
  getProtocolContractAddresses: async ({commit,state},{globalAddressesProviderAddress}) => {

    const currentGlobalAddressesProviderContract = new state.web3.eth.Contract(GlobalAddressesProviderInterface.abi, globalAddressesProviderAddress );
    console.log(currentGlobalAddressesProviderContract);

    if (currentGlobalAddressesProviderContract) {
      console.log(globalAddressesProviderAddress);

      try {
        const sighAddress = await currentGlobalAddressesProviderContract.methods.getSIGHAddress().call();        
        console.log(sighAddress);
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

        return true;
      }
      catch (error) {
        return false;
      }
    }
  },

  // [TESTED. WORKING AS EXPECTED] fetches and stores the SIGH FINANCE GLOBAL STATE 
  fetchSighFinanceProtocolState: async ({state,commit}) => {

    if (state.GlobalAddressesProviderAddress) {
      try {
        // FETCHING "SIGH INSTRUMENT" STATE
        console.log(" SIGH INSTRUMENT : STATE FETCHED (SESSION INITIALIALIZATION)");
        let sighDetails = await store.dispatch("refresh_SIGH_State");
        commit("setSIGHState",sighDetails);
  
        // FETCHING "SIGH FINANCE" STATE
        console.log(" SIGH SPEED CONTROLLER (Treasury, Distribution Handler) : STATE FETCHED (SESSION INITIALIALIZATION)");
        let sighFinanceDetails = await store.dispatch("refresh_Sigh_Finance_State");
        commit("setSIGHFinanceState",sighFinanceDetails);
  
        // FETCHING "SUPPRTED INSTRUMENT ADDRESSES" 
        let supportedInstrumentAddresses =  await store.dispatch("LendingPool_getInstruments"); ;
        commit("setSupportedInstrumentAddresses",supportedInstrumentAddresses);
  
        // FETCHING "SUPPRTED INSTRUMENT" STATES  : STATE, GLOBAL BALANCES, CONFIG
        for (let i=0; i<supportedInstrumentAddresses.length; i++) {
          let data = await store.dispatch('refershInstrumentState',{instrumentAddress: supportedInstrumentAddresses[i] });
          console.log(" SUPPORTED INSTRUMENT - " + i + " : STATE FETCHED (SESSION INITIALIALIZATION)");
          console.log(data);
  
          console.log(" SUPPORTED INSTRUMENT - " + i + " : BASIC STATE");
          commit("addToSupportedInstrumentsArray",data.instrumentState);
  
          console.log(" SUPPORTED INSTRUMENT - " + i + " : CONFIGURATION");
          commit("addToSupportedInstrumentConfigs",{instrumentAddress: supportedInstrumentAddresses[i] , instrumentConfig: data.instrumentConfiguration});
  
          console.log(" SUPPORTED INSTRUMENT - " + i + " : GLOBAL BALANCES");          // console.log(data.instrumentGlobalBalances);
          commit("addToSupportedInstrumentGlobalStates",{instrumentAddress: supportedInstrumentAddresses[i] , instrumentGlobalState: data.instrumentGlobalBalances});

          console.log(" SUPPORTED INSTRUMENT - " + i + " : SIGH STATES");          // console.log(data.instrumentGlobalBalances);
          commit("addToSupportedInstrumentSIGHStates",{instrumentAddress: supportedInstrumentAddresses[i] , instrumentSIGHState: data.instrumentSighState});
        }
  
        // LENDING PROTOCOL TOTAL STATE
        // commit("addToSupportedInstrumentGlobalStates",instrumentGlobalBalances);
  
        // 
        commit('updateSelectedInstrument',state.supportedInstruments[0]); // THE FIRST INSTRUMENT IS BY DEFAULT THE SELECTED INSTRUMENT
  
        // ETHEREUM PRICE (IN USD ) & PRICE DECIMALS
        let ethPriceDecimals = await store.dispatch("getInstrumentPriceDecimals",{_instrumentAddress: state.EthereumPriceOracleAddress});   
        commit('setEthPriceDecimals',ethPriceDecimals);                  // ETH Price Decimals
        let ethPriceUSD = await store.dispatch("getInstrumentPrice",{_instrumentAddress: state.EthereumPriceOracleAddress}); 
        commit('updateETHPrice',ethPriceUSD);                             // ETH Price 
  
        store.dispatch('initiatePolling_ETH_PricesAnd_BlocksRemaining');
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    }
    else {
      return false;
    }
  },

  // FETCHES SIGH FINANCE STATE ( SIGH SPEED CONTROLLER, TREASURY, DISTRIBUTION HANDLER )
  refresh_SIGH_State: async ({commit,state}) => {
    let sighDetails = {};
    if ( state.web3 && state.isNetworkSupported ) {
      sighDetails.name = await store.dispatch("ERC20_name",{tokenAddress: state.SIGHContractAddress}); 
      sighDetails.symbol = await store.dispatch("ERC20_symbol",{tokenAddress: state.SIGHContractAddress}); 
      sighDetails.decimals = await store.dispatch("ERC20_decimals",{tokenAddress: state.SIGHContractAddress}); 
      sighDetails.treasuryAddress = await store.dispatch("getSIGHInstrumentTreasury",{tokenAddress: state.SIGHContractAddress}); 
      sighDetails.SIGHDistributionHandlerAddress = state.SIGHDistributionHandlerAddress;        
      sighDetails.speedControllerAddress = await store.dispatch("getSighInstrumentSpeedController",{tokenAddress: state.SIGHContractAddress}); 
      sighDetails.priceETH = await store.dispatch("getInstrumentPrice",{_instrumentAddress: state.SIGHContractAddress}); 
      sighDetails.priceDecimals = await store.dispatch("getInstrumentPriceDecimals",{_instrumentAddress: state.SIGHContractAddress});   
      console.log('refresh_SIGH_State - 1'); 
      console.log(sighDetails); 
      let response1 = await store.dispatch("getCurrentCycle");
      let response2 = await store.dispatch("getMintSnapshotForCycle",{cycle: (Number(response1) - 1) });
      sighDetails.cycle = response1;
      sighDetails.era = response2.era;
      sighDetails.inflationRate = response2.inflationRate;
      sighDetails.mintedAmount = response2.mintedAmount;
      sighDetails.prevMintSpeed = response2.mintSpeed;
      sighDetails.newTotalSupply = response2.newTotalSupply;
      sighDetails.minter = response2.minter;
      sighDetails.blockNumber = response2.blockNumber;
      console.log('refresh_SIGH_State - 2'); 
      console.log(sighDetails); 
      sighDetails.totalSighBurnt = await store.dispatch("getTotalSighBurnt");
      sighDetails.blocksRemainingToMint = await store.dispatch("getBlocksRemainingToMint");
      sighDetails.currentMintSpeed = await store.dispatch("getCurrentMintSpeed");
      console.log('refresh_SIGH_State - 3'); 
      console.log(sighDetails); 
    }
    return sighDetails;
  },  

  // FETCHES SIGH FINANCE STATE ( SIGH SPEED CONTROLLER, TREASURY, DISTRIBUTION HANDLER )
  refresh_Sigh_Finance_State: async ({commit,state}) => {
    let sighFinanceDetails = {};
    if ( state.web3 && state.isNetworkSupported ) {
      sighFinanceDetails.speedControllerBalance = await store.dispatch("getSIGHSpeedControllerBalance"); 
      sighFinanceDetails.supportedProtocolAddresses = await store.dispatch("getSIGHSpeedControllerSupportedProtocols"); 
      sighFinanceDetails.supportedProtocolStates = [];
      // Loop Over Supported Protocols
      let addresses = sighFinanceDetails.supportedProtocolAddresses;
      for (let i=0; i<addresses.length; i++ ) {
        let response = await store.dispatch("getSIGHSpeedControllerSupportedProtocolState",{protocolAddress: addresses[i] }); 
        response.SighBalance = await store.dispatch("ERC20_balanceOf",{tokenAddress: state.SIGHContractAddress , account: addresses[i]});
        sighFinanceDetails.supportedProtocolStates.push(response);
        // Handling TREASURY
        if (sighDetails.treasuryAddress == addresses[i] ) {
          sighFinanceDetails.treasuryAddress = addresses[i];
          sighFinanceDetails.treasuryState = response;
        }
        // Handling DISTRIBUTION HANDLER        
        if (sighDetails.SIGHDistributionHandlerAddress == addresses[i] ) {
          sighFinanceDetails.SIGHDistributionHandlerAddress = addresses[i];
          sighFinanceDetails.SIGHDistributionHandlerState = response;
          sighFinanceDetails.SIGHDistributionHandlerState.SighSpeed =  await store.dispatch("SIGHDistributionHandler_getSIGHSpeed");
        }
      }
    }
    return sighFinanceDetails;
  },



    // FETCHES THE DATA FOR AN INSTRUMENT (CONFIGURATION & BALANCES)
  refershInstrumentState: async ({commit,state},{instrumentAddress}) => {
    let instrumentState = {};    
    let instrumentConfiguration = {};    
    let instrumentGlobalBalances = {};   
    let instrumentSighState = {}; 
  
    if ( state.web3 && instrumentAddress && instrumentAddress!= '0x0000000000000000000000000000000000000000') {
      // INSTRUMENT BASIC DATA
      instrumentState.instrumentAddress = instrumentAddress;
      instrumentState.name = await store.dispatch("ERC20_name",{tokenAddress: instrumentAddress}); 
      instrumentState.symbol =  await store.dispatch("ERC20_symbol",{tokenAddress: instrumentAddress}); 
      instrumentState.decimals =  await store.dispatch("ERC20_decimals",{tokenAddress: instrumentAddress}); 
      instrumentState.priceETH = await store.dispatch("getInstrumentPrice",{_instrumentAddress: instrumentAddress}); 
      instrumentState.priceDecimals = await store.dispatch("getInstrumentPriceDecimals",{_instrumentAddress: instrumentAddress}); 
  
      // INSTRUMENT CONFIGURATION          
      let instrumentConfig = await store.dispatch("LendingPool_getInstrumentConfigurationData",{_instrumentAddress: instrumentAddress });  
      instrumentConfiguration.interestRateStrategyAddress = instrumentConfig.interestRateStrategyAddress;
      instrumentConfiguration.liquidationThreshold = instrumentConfig.liquidationThreshold;
      instrumentConfiguration.liquidationBonus = instrumentConfig.liquidationBonus;
      instrumentConfiguration.ltv = instrumentConfig.ltv;
      instrumentConfiguration.usageAsCollateralEnabled = instrumentConfig.usageAsCollateralEnabled;
      instrumentConfiguration.borrowingEnabled = instrumentConfig.borrowingEnabled;
      instrumentConfiguration.stableBorrowRateEnabled = instrumentConfig.stableBorrowRateEnabled;
      instrumentConfiguration.isActive = instrumentConfig.isActive;
      instrumentConfiguration.symbol = instrumentState.symbol;
  
      // INSTRUMENT GLOBAL BALANCES   
      let instrumentGlobalState = await store.dispatch("LendingPool_getInstrumentData",{_instrumentAddress:instrumentAddress });           
      instrumentState.iTokenAddress = instrumentGlobalState.iTokenAddress;
      instrumentGlobalBalances.iTokenAddress = instrumentGlobalState.iTokenAddress;        
      instrumentGlobalBalances.totalLiquidity = instrumentGlobalState.totalLiquidity;
      instrumentGlobalBalances.totalBorrowsStable = instrumentGlobalState.totalBorrowsStable;
      instrumentGlobalBalances.totalBorrowsVariable = instrumentGlobalState.totalBorrowsVariable;
      instrumentGlobalBalances.totalBorrows = Number(instrumentGlobalState.totalBorrowsStable) + Number(instrumentGlobalState.totalBorrowsVariable) ;
      instrumentGlobalBalances.availableLiquidity = instrumentGlobalState.availableLiquidity;
      instrumentGlobalBalances.liquidityRate = instrumentGlobalState.liquidityRate;
      instrumentGlobalBalances.variableBorrowRate = instrumentGlobalState.variableBorrowRate;
      instrumentGlobalBalances.stableBorrowRate = instrumentGlobalState.stableBorrowRate;
      instrumentGlobalBalances.averageStableBorrowRate = instrumentGlobalState.averageStableBorrowRate;
      instrumentGlobalBalances.utilizationRate = instrumentGlobalState.utilizationRate;
      instrumentGlobalBalances.liquidityIndex = instrumentGlobalState.liquidityIndex;
      instrumentGlobalBalances.variableBorrowIndex = instrumentGlobalState.variableBorrowIndex;  
      instrumentGlobalBalances.symbol = instrumentState.symbol;

      // INSTRUMENT - SIGH STATE         
      let curInstrumentSIGHState = await store.dispatch("SIGHDistributionHandler_getInstrumentData",{instrument_:instrumentAddress });           
      instrumentSighState.isSIGHMechanismActivated = curInstrumentSIGHState.isSIGHMechanismActivated;
      instrumentSighState.borrowindex = curInstrumentSIGHState.borrowindex;
      instrumentSighState.supplyindex = curInstrumentSIGHState.supplyindex;
      curInstrumentSIGHState = await store.dispatch("SIGHDistributionHandler_getInstrumentSpeeds",{instrument_:instrumentAddress });           
      instrumentSighState.percentageTotalVolatility = curInstrumentSIGHState.percentageTotalVolatility;
      instrumentSighState.losses_24_hrs = curInstrumentSIGHState.losses_24_hrs;
      instrumentSighState.suppliers_Speed = curInstrumentSIGHState.suppliers_Speed;
      instrumentSighState.borrowers_Speed = curInstrumentSIGHState.borrowers_Speed;
      instrumentSighState.staking_Speed = curInstrumentSIGHState.staking_Speed;
      instrumentSighState.symbol = instrumentState.symbol;
      
    }
    // console.log(instrumentState);
    // console.log(instrumentConfiguration);
    // console.log(instrumentGlobalBalances);
    return {instrumentState, instrumentConfiguration,instrumentGlobalBalances,instrumentSighState};
  },


  // [TESTED. WORKING AS EXPECTED] KEEP UPDATING ETH PRICE
  initiatePolling_ETH_PricesAnd_BlocksRemaining: async ({commit,state}) => {
    console.log("initiatePolling_ETH_PricesAnd_BlocksRemaining : updating ETH price");
    setInterval(async () => {
      // POLLING ETH/USD PRICE
      if (state.EthereumPriceOracleAddress) {
        let updatedPrice_ = await store.dispatch('getInstrumentPrice', { _instrumentAddress : state.EthereumPriceOracleAddress } );
        if (updatedPrice_) {
          commit("updateETHPrice",updatedPrice_);
          console.log( " ETH - current price is " + updatedPrice_);
        }
      }
      // POLLING BLOCKS REMAINING TO REFRESH $SIGH SPEEDS
      if (state.SIGHDistributionHandlerAddress) {
        let blocksRemaining_ = await store.dispatch('SIGHDistributionHandler_getBlocksRemainingToNextSpeedRefresh');
        commit("updateBlocksRemainingForSIGHSpeedRefresh",blocksRemaining_);
        console.log( " BLOCKS REMAINING (SIGH SPEED REFRESH) : " + blocksRemaining_);
      }
      // POLLING TRANSACTION STATES
      if (Web3.utils.isAddress(state.connectedWallet)) {
        let newPendingTxs = [];
        let _pendingTransactions = state.sessionPendingTransactions;
        for (let i=0; i<_pendingTransactions.length; i++) {
          let tx =  await state.web3.eth.getTransactionReceipt(_pendingTransactions[i].hash);
          console.log(tx);
          if (tx == null) {
            console.log("tx.status == null");
            newPendingTxs.push(_pendingTransactions[i]);
          }
          else {
            if (tx.status == 1) {
              console.log("tx.status == 1");
              commit('addToSessionSuccessfulTransactions',_pendingTransactions[i] );
            }
            else if (tx.status != 1) {
              console.log("tx.status != 1");
              commit('addToSessionFailedTransactions',_pendingTransactions[i] );
            }
          }
        }
        commit('setSessionPendingTransactions',newPendingTxs);
      }
    }, 5000);
  },











    // SETS USER ACCOUNT FROM THE WEB3 OBJECT OF THE STORE
    getWalletConfig: async ({commit,state}) => {
      console.log("getWalletConfig ACTION FUNCTION CALLED IN STORE"); 
      if (!state.web3 || !state.isNetworkSupported ) {
        console.log("getWalletConfig ACTION FUNCTION CALLED IN STORE = web3 not set yet");
        await store.dispatch("loadWeb3");
        if (state.web3 && state.isNetworkSupported) {
          let contractsInitialized = await store.dispatch("getContractsBasedOnNetwork");
          if (contractsInitialized) {
            let protocolStateInitialized = await store.dispatch("fetchSighFinanceProtocolState");
            if (protocolStateInitialized) {
              await store.dispatch("getConnectedWalletState");
            }
          }
        }
        else {
          return "No Web3 Object detected. Read-only access" ;
        }
      }
      else {
        await store.dispatch("getConnectedWalletState");
        }
    },

    // GETS WALLET ADDRESS. LOADS WALLET-SIGH_FINANCE STATE, WALLET-LENDING_PROTOCOL STATE
    getConnectedWalletState: async ({commit,state}) => {
      if (state.web3 && state.isNetworkSupported ) {
        let accounts = await state.web3.eth.getAccounts();
        console.log(accounts);
        if (accounts) {
          commit('connectedWallet',accounts[0]);
          commit('isWalletConnected',true);  
          let response = await store.dispatch("getWalletSIGHFinanceState");
          // console.log( 'Account - ' + state.connectedWallet );
          store.dispatch('polling'); 
          return response;
        }
        else {
          commit('connectedWallet',null);
          commit('isWalletConnected',false);  
          return false;
        }     
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
          let response = await store.dispatch("getWalletSIGHFinanceState");
          if (response) {
            ExchangeDataEventBus.$emit(EventNames.ConnectedWalletSesssionRefreshed);    
          }
        } 
        else if (newBalance_ !== state.ethBalance) {    // ONLY BALANCE UPDATED WHEN IT IS CHANGED
          commit('updateBalance',newBalance_);
        }
      }, 500);
    },


    getWalletSIGHFinanceState: async ({commit,state}) => {
      try {
        // RESETTING WALLET - INSTRUMENT STATES (AS THEY ARE REFRESHED DURING WALLET-SIGH STATE REFRESH)
        console.log("FETCHING USER SESSION : BEGINNING INITIALIZATION ");

        // REFRESSHING AND COMITTITNG THE LATEST WALLET - SIGH STATE
        let ConnectedWallet_SIGH_State = await store.dispatch("refresh_User_SIGH__State"); 
        commit("setWalletSIGHState",ConnectedWallet_SIGH_State);

        // REFRESSHING AND COMITTITNG THE USER GLOBAL SIGH FINANCE STATE               
        let userGlobalState = await store.dispatch("refresh_User_SIGH_Finance_State");
        commit("setWalletSIGH_FinanceState",userGlobalState);
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    }, 



  refresh_User_SIGH_Finance_State: async({commit,state}) => {
    if (state.web3 && state.isNetworkSupported && state.connectedWallet) {
      try {
        let userGlobalState = {};
        let userGlobalStateResponse = await store.dispatch("getUserProtocolState", {_user: state.connectedWallet} );
        userGlobalState.totalLiquidityETH = userGlobalStateResponse.totalLiquidityETH ;
        userGlobalState.totalLiquidityUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalLiquidityETH)}); 
        userGlobalState.totalCollateralETH = userGlobalStateResponse.totalCollateralETH ;
        userGlobalState.totalCollateralUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalCollateralETH)}); 
        userGlobalState.totalBorrowsETH = userGlobalStateResponse.totalBorrowsETH ;
        userGlobalState.totalBorrowsUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalBorrowsETH)}); 
        userGlobalState.totalFeesETH = userGlobalStateResponse.totalFeesETH ;
        userGlobalState.totalFeesUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalFeesETH)}); 
        userGlobalState.availableBorrowsETH = userGlobalStateResponse.availableBorrowsETH ;
        userGlobalState.availableBorrowsUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.availableBorrowsETH)}); 
        userGlobalState.currentLiquidationThreshold = userGlobalStateResponse.currentLiquidationThreshold ;
        userGlobalState.ltv = userGlobalStateResponse.ltv ;
        userGlobalState.healthFactor = userGlobalStateResponse.healthFactor ;  
        return userGlobalState;
      }
      catch (error) {
        console.log("refresh_User_SIGH_Finance_State");
        console.log(error);
        return {};
      }
    }
    return {};
  },


  refresh_User_SIGH__State: async({commit,state}) => {
    if (state.web3 && state.isNetworkSupported && state.connectedWallet) {
      try {
        let walletSighState = {};
        walletSighState.sighBalance = await store.dispatch("ERC20_balanceOf",{tokenAddress: state.SIGHContractAddress , account: state.connectedWallet});
        walletSighState.sighBalanceWorth = Number(walletSighState.sighBalance) * (Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals))) * (Number(state.ethereumPriceUSD) / Math.pow(10,state.ethPriceDecimals));

        walletSighState.sighStaked = await store.dispatch("SIGHStaking_getStakedBalanceForStaker",{ _user: state.connectedWallet});
        walletSighState.sighStakedWorth = Number(walletSighState.sighStaked) * (Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals))) * (Number(state.ethereumPriceUSD) / Math.pow(10,state.ethPriceDecimals));

        walletSighState.sighStakingAllowance = await store.dispatch("ERC20_getAllowance",{tokenAddress: state.SIGHContractAddress , owner: state.connectedWallet, spender: state.sighStakingContractAddress });

        walletSighState.sighStakedAPY = 0 ;  //await store.dispatch("SIGHStaking_getStakedBalanceForStaker",{ _user: state.connectedWallet});
        walletSighState.yourSighStakedAPY =  0;  // Number(walletSighState.sighStaked) * (Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals))) * (Number(state.ethereumPriceUSD) / Math.pow(10,state.ethPriceDecimals));

        commit("resetWalletInstrumentStates"); // RESETTING WALLET - INSTRUMENT STATE
        for (let i=0; i < state.supportedInstruments.length; i++) { 
          let currentUserInstrumentState = await store.dispatch("refresh_User_Instrument_State",{cur_instrument: state.supportedInstruments[i]  }); 
          commit("addToWalletInstrumentStates",{ instrumentAddress: state.supportedInstruments[i].instrumentAddress, walletInstrumentState: currentUserInstrumentState }); 
          // Calculating Protocol Level Values by adding across instruments
          walletSighState.totalSighAccured = Number(walletSighState.totalSighAccured) + Number(currentUserInstrumentState.sighAccured) ;
          walletSighState.totalSuppliedSighSpeedForUser = Number(walletSighState.totalSuppliedSighSpeedForUser) + Number(currentUserInstrumentState.suppliedSighSpeedForUser);
          walletSighState.totalBorrowedSighSpeedForUser = Number(walletSighState.totalBorrowedSighSpeedForUser) + Number(currentUserInstrumentState.borrowedSighSpeedForUser);
          walletSighState.totalSighSpeedForUser = Number(walletSighState.totalSighSpeedForUser) + Number(currentUserInstrumentState.SighSpeedForUser);
        }

        walletSighState.totalSighAccuredWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalSighAccured) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 
        walletSighState.totalSuppliedSighSpeedForUserWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalSuppliedSighSpeedForUser) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 
        walletSighState.totalBorrowedSighSpeedForUserWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalBorrowedSighSpeedForUser) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 
        walletSighState.totalSighSpeedForUserWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalSighSpeedForUser) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 

        walletSighState.marketTotalVolatility = 0;
        walletSighState.SighYieldsLossRatio = 0;
        return walletSighState;
      }
      catch (error) {
        console.log("refresh_User_SIGH__State");
        console.log(error);
        return {};
      }
    }
    return {};
  },



  refresh_User_Instrument_State: async({commit,state},{cur_instrument}) => {
    if (state.web3 && state.isNetworkSupported && state.connectedWallet) {
      try {
        let cur_user_instrument_state = {};

        // Instrument Basic Info
        cur_user_instrument_state.symbol = cur_instrument.symbol;
        cur_user_instrument_state.instrumentAddress = cur_instrument.instrumentAddress;      
        cur_user_instrument_state.iTokenAddress = cur_instrument.iTokenAddress;      
        cur_user_instrument_state.decimals = cur_instrument.decimals;
        cur_user_instrument_state.priceETH =  await store.dispatch('getInstrumentPrice',{_instrumentAddress:cur_instrument.instrumentAddress });
        cur_user_instrument_state.priceDecimals = cur_instrument.priceDecimals;
        
        // User Balances
        cur_user_instrument_state.userBalance = await store.dispatch("ERC20_balanceOf",{tokenAddress: cur_instrument.instrumentAddress , account: state.connectedWallet});
        cur_user_instrument_state.userBalanceWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.userBalance) * Number(cur_user_instrument_state.priceETH) / Math.pow(10,Number(cur_instrument.priceDecimals)) });
        let response = await store.dispatch('getUserInstrumentState',{_instrumentAddress:cur_instrument.instrumentAddress , _user: state.connectedWallet });
        console.log("Calling ERC20_getAllowance while updating Wallet - Instrument state in function refresh_User_Instrument_State in store.js ");
        cur_user_instrument_state.userAvailableAllowance = await store.dispatch("ERC20_getAllowance",{tokenAddress: cur_instrument.instrumentAddress , owner: state.connectedWallet, spender: state.LendingPoolCoreContractAddress });
        cur_user_instrument_state.userAvailableAllowanceWorth = await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.userAvailableAllowance) * Number(cur_user_instrument_state.priceETH) / Math.pow(10,Number(cur_instrument.priceDecimals)) }); 
        cur_user_instrument_state.userDepositedBalance = response.currentITokenBalance;
        cur_user_instrument_state.userDepositedBalanceWorth = await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.userDepositedBalance) * Number(cur_user_instrument_state.priceETH) / Math.pow(10,Number(cur_instrument.priceDecimals)) }); 
        cur_user_instrument_state.principalBorrowBalance = response.principalBorrowBalance;
        cur_user_instrument_state.principalBorrowBalanceWorth = await  store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.principalBorrowBalance) * Number(cur_user_instrument_state.priceETH) / Math.pow(10,Number(cur_instrument.priceDecimals)) });
        cur_user_instrument_state.currentBorrowBalance = response.currentBorrowBalance;
        cur_user_instrument_state.currentBorrowBalanceWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.currentBorrowBalance) * Number(cur_user_instrument_state.priceETH) / Math.pow(10,Number(cur_instrument.priceDecimals)) }); 

        // Additional Parameters (APYs, fee, SIGH Yield etc etc)
        cur_user_instrument_state.borrowRateMode =  response.borrowRateMode ;
        cur_user_instrument_state.borrowRate =  response.borrowRate ;
        cur_user_instrument_state.liquidityRate =  response.liquidityRate ;
        cur_user_instrument_state.originationFee =  response.originationFee ;
        cur_user_instrument_state.variableBorrowIndex =  response.variableBorrowIndex ;      
        cur_user_instrument_state.usageAsCollateralEnabled = response.usageAsCollateralEnabled ;       

        // INSTRUMENT SIGH SPEEDS 
        let sighSpeeds = await store.dispatch("SIGHDistributionHandler_getInstrumentSpeeds",{instrument_:cur_instrument.instrumentAddress });           
        cur_user_instrument_state.sighSupplierSpeed =   sighSpeeds.suppliers_Speed ;       
        cur_user_instrument_state.sighBorrowerSpeed = sighSpeeds.borrowers_Speed ;       
        cur_user_instrument_state.sighStakingSpeed = sighSpeeds.staking_Speed ;       

        // INTEREST STREAM 
        cur_user_instrument_state.redirectedBalance =  await store.dispatch("IToken_getRedirectedBalance",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.interestRedirectionAllowance =  await store.dispatch("IToken_getinterestRedirectionAllowances",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.interestRedirectionAddress =  await store.dispatch("IToken_getInterestRedirectionAddress",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;

        // SIGH STREAM 
        cur_user_instrument_state.sighAccured =  await store.dispatch("IToken_getSighAccured",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.sighStreamRedirectedTo =  await store.dispatch("IToken_getSighStreamRedirectedTo",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.sighStreamAllowance =  await store.dispatch("IToken_getSighStreamAllowances",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ; 

        // SIGH SPEEDS FOR THE USER
        let globalState = state.supportedInstrumentGlobalStates.get(cur_instrument.instrumentAddress);
        let suppliedSighSpeedForUser = 0;        
        let borrowedSighSpeedForUser = 0;        
        if (globalState.totalLiquidity > 0) {
          suppliedSighSpeedForUser = ( Number(sighSpeeds.suppliers_Speed) + Number(sighSpeeds.staking_Speed) ) * ( Number(cur_user_instrument_state.userDepositedBalance) / Number(globalState.totalLiquidity) );
        }
        if (globalState.totalBorrows > 0) {
          borrowedSighSpeedForUser = ( Number(sighSpeeds.borrowers_Speed) + Number(sighSpeeds.staking_Speed) ) * ( Number(cur_user_instrument_state.currentBorrowBalance) / Number(globalState.totalBorrows) );
        }
        cur_user_instrument_state.suppliedSighSpeedForUser = suppliedSighSpeedForUser;
        cur_user_instrument_state.borrowedSighSpeedForUser = borrowedSighSpeedForUser;
        cur_user_instrument_state.SighSpeedForUser = Number(suppliedSighSpeedForUser) + Number(borrowedSighSpeedForUser);

        // NET PERFORMANCE ( INSTRUMENT PERFORMANCE +  SUPPLIED APY (USD) - BORROWED APY (USD) + SIGH YIELD (USD) )        
        cur_user_instrument_state.netPerformance = 0 ;

        return cur_user_instrument_state;
      }
      catch (error) {
        console.log("refresh_User_Instrument_State");
        console.log(error);
        return {};
      }
    }
    return {};
  },  

  convertToUSD: ({state},{ETHValue}) => {
    return Number(ETHValue) * (Number(state.ethereumPriceUSD) / Math.pow(10,state.ethPriceDecimals)) ;
  },



// ######################################################
// ############ getInstrumentPrice --- VIEW Funtion to get instrument's price from the price oracle
// ######################################################

  // [TESTED. WORKING AS EXPECTED] Gets the current price of the instrument
  getInstrumentPrice: async ({commit,state},{_instrumentAddress}) => {
    if (state.web3 && state.IPriceOracleGetterAddress && state.IPriceOracleGetterAddress!= "0x0000000000000000000000000000000000000000" ) {
      const priceOracleContract = new state.web3.eth.Contract(IPriceOracleGetter.abi, state.IPriceOracleGetterAddress );
      // console.log(_instrumentAddress);
      let response = await priceOracleContract.methods.getAssetPrice(_instrumentAddress).call();
      // console.log('getInstrumentPrice = ' + response);
      return response;
    }
    else {
      console.log('getInstrumentPrice() function in store.js. Protocol not supported on connected blockchain network');
      return null;
    }
  },

  // [TESTED. WORKING AS EXPECTED] Gets the current price of the instrument
  getInstrumentPriceDecimals: async ({commit,state},{_instrumentAddress}) => {
    if (state.web3 && state.IPriceOracleGetterAddress && state.IPriceOracleGetterAddress!= "0x0000000000000000000000000000000000000000" ) {
      const priceOracleContract = new state.web3.eth.Contract(IPriceOracleGetter.abi, state.IPriceOracleGetterAddress );
      let response = await priceOracleContract.methods.getAssetPriceDecimals(_instrumentAddress).call();
      // console.log('getInstrumentPriceDecimals ' + response);
      return response;
    }
    else {
      console.log('getInstrumentPriceDecimals() function in store.js. Protocol not supported on connected blockchain network');
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
// ############ SIGHSPEEDCONTROLLER --- DRIP() FUNCTION 
// ######################################################

    SIGHSpeedController_drip: async ({commit,state}) => {
      if (state.web3 && state.SIGHSpeedControllerAddress && state.SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, state.SIGHSpeedControllerAddress );
        console.log(sighSpeedControllerContract);
        sighSpeedControllerContract.methods.drip().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
          let transaction = {hash : hash, function : '$SIGH Controller : Drip' , amount : null  }; 
          commit('addToSessionPendingTransactions',transaction);
        })  
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

    getSIGHSpeedControllerBalance: async ({commit,state}) => {
      if (state.web3 && state.SIGHSpeedControllerAddress && state.SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, state.SIGHSpeedControllerAddress );
        // console.log(sighSpeedControllerContract);
        try {
          let response = await sighSpeedControllerContract.methods.getSIGHBalance().call();
          // console.log("getSIGHSpeedControllerBalance" + response);
          return response;
          }
        catch(error) {
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on ";
      }
    },

    getSIGHSpeedControllerSupportedProtocols: async ({commit,state}) => {
      if (state.web3 && state.SIGHSpeedControllerAddress && state.SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, state.SIGHSpeedControllerAddress );
        // console.log(sighSpeedControllerContract);
        try {
          let response = await sighSpeedControllerContract.methods.getSupportedProtocols().call();
          // console.log('getSIGHSpeedControllerSupportedProtocols');
          // console.log(response);
          return response;
          }
        catch(error) {
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on ";
      }
    },

    getSIGHSpeedControllerSupportedProtocolState: async ({commit,state},{protocolAddress}) => {
      if (state.web3 && state.SIGHSpeedControllerAddress && state.SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, state.SIGHSpeedControllerAddress );
        // console.log(sighSpeedControllerContract);
        try {
          let response = await sighSpeedControllerContract.methods.getSupportedProtocolState(protocolAddress).call();
          // console.log('getSIGHSpeedControllerSupportedProtocolState');
          // console.log(response);
          return response;
        }
        catch(error) {
          console.log(error);
          return error;
        }
      }
      else {
        console.log("SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Speed Controller Contract) is currently not been deployed on ";
      }
    },    



    
// ######################################################
// ############ SIGHDISTRIBUTIONHANDLER --- REFRESHSIGHSPEEDS() FUNCTION 
// ######################################################

    SIGHDistributionHandler_refreshSighSpeeds: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        console.log(sighDistributionHandlerContract);
        sighDistributionHandlerContract.methods.refreshSIGHSpeeds().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
          let transaction = {hash : hash, function : '$SIGH Speeds : Refresh' , amount : null  }; 
          commit('addToSessionPendingTransactions',transaction);
        })  
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

    SIGHDistributionHandler_getSIGHBalance: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        // console.log(sighDistributionHandlerContract);
        let response = await sighDistributionHandlerContract.methods.getSIGHBalance().call();
        console.log("sighDistributionHandler SIGH Balance = " + response );        
        return response;            
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },

    SIGHDistributionHandler_getSIGHSpeed: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        // console.log(sighDistributionHandlerContract);
        let response = await sighDistributionHandlerContract.methods.getSIGHSpeed().call();
        console.log("sighDistributionHandler SIGH Speed = " + response );        
        return response;            
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },

    SIGHDistributionHandler_getBlocksRemainingToNextSpeedRefresh: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        // console.log(sighDistributionHandlerContract);
        let response = await sighDistributionHandlerContract.methods.getBlocksRemainingToNextSpeedRefresh().call();
        console.log("sighDistributionHandler Blocks remaining to refresh = " + response );        
        return response;            
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },

    SIGHDistributionHandler_getInstrumentData: async ({commit,state},{instrument_}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        // console.log(sighDistributionHandlerContract);
        let response = await sighDistributionHandlerContract.methods.getInstrumentData(instrument_).call();
        console.log("sighDistributionHandler INSTRUMENT Data = " );
        console.log(response);   
        return response;            
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },    

    SIGHDistributionHandler_getInstrumentSpeeds: async ({commit,state},{instrument_}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        // console.log(sighDistributionHandlerContract);
        let response = await sighDistributionHandlerContract.methods.getInstrumentSpeeds(instrument_).call();
        console.log("sighDistributionHandler INSTRUMENT Data = " );
        console.log(response);                
        return response;            
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },        
// ######################################################################
// ############ SIGHTREASURY --- BURN() FUNCTION ########################
// ############ SIGHTREASURY --- DRIP() FUNCTION ########################
// ############ SIGHTREASURY --- UPDATEINSTRUMENT() FUNCTION ############
// ######################################################################

    SighTreasury_burnSIGHTokens: async ({commit,state}) => {
      if (state.web3 && state.SIGHTreasuryContractAddress && state.SIGHTreasuryContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighTreasuryContract = new state.web3.eth.Contract(SighTreasuryInterface.abi, state.SIGHTreasuryContractAddress );
        console.log(sighTreasuryContract);
        sighTreasuryContract.methods.burnSIGHTokens().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
          let transaction = {hash : hash, function : 'SIGH Treasury : Burn' , amount : null  }; 
          commit('addToSessionPendingTransactions',transaction);
        })  
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
        sighTreasuryContract.methods.drip().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
          let transaction = {hash : hash, function : 'SIGH Treasury : Drip' , amount : null  }; 
          commit('addToSessionPendingTransactions',transaction);
        })  
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
        sighTreasuryContract.methods.updateInstrumentBalance(instrument_address).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
          let transaction = {hash : hash, function : '$SIGH Treasury : Update Balance' , amount : null  }; 
          commit('addToSessionPendingTransactions',transaction);
        })  
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
        try {            
          const response = await sighStakingContract.methods.stake_SIGH(amountToBeStaked).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking', amount : amountToBeStaked + ' SIGH'  }; 
            commit('addToSessionPendingTransactions',transaction);
          });
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
          const response = await sighStakingContract.methods.unstake_SIGH(amountToBeUNStaked).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Un-Staking', amount : amountToBeUNStaked + ' SIGH'  }; 
            commit('addToSessionPendingTransactions',transaction);
          });
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
          const response = await sighStakingContract.methods.claimAllAccumulatedInstruments().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking : Claim Rewards', amount : null  }; 
            commit('addToSessionPendingTransactions',transaction);
          });
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
          const response = await sighStakingContract.methods.claimAccumulatedInstrument(instrumentToBeClaimed).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking : Claim Reward' , amount : null  }; 
            commit('addToSessionPendingTransactions',transaction);
          });
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
          const response = await sighStakingContract.methods.updateBalance(instrument).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking : Update Balance' , amount : null  }; 
            commit('addToSessionPendingTransactions',transaction);
          });
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
        // console.log(sighStakingContract);
        const response = await sighStakingContract.methods.getStakedBalanceForStaker(_user).call();
        console.log('SIGH Staked Balance = ' + response);
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
        try {
          let symbol = state.supportedInstrumentGlobalStates.get(_instrument).symbol;
          const response = await lendingPoolContract.methods.deposit(_instrument,_amount,_referralCode).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'DEPOSIT' , amount : _amount + ' ' + symbol}; 
            commit('addToSessionPendingTransactions',transaction);
          });
          console.log(response);
          return response;
          }
          catch(error) {
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
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {            
          let symbol = state.supportedInstrumentGlobalStates.get(_instrument).symbol;          
          const response = await lendingPoolContract.methods.borrow(_instrument,_amount,_interestRateMode,_referralCode).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'BORROW' , amount : _amount + ' ' + symbol}; 
            commit('addToSessionPendingTransactions',transaction);
          });
          console.log(response);
          return response;
        }
        catch(error) {               
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
        try {
          let symbol = state.supportedInstrumentGlobalStates.get(_instrument).symbol;                    
          const response = await lendingPoolContract.methods.repay(_instrument,_amount,_onBehalfOf).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'REPAY' , amount : _amount + ' ' + symbol}; 
            commit('addToSessionPendingTransactions',transaction);
          });
          console.log(response);
          return response;
          }
        catch(error) {
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
        try {
          let symbol = state.supportedInstrumentGlobalStates.get(_instrument).symbol;                    
          const response = await lendingPoolContract.methods.swapBorrowRateMode(_instrument).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'Swap Borrow Rate Mode : ' + symbol , amount : null}; 
            commit('addToSessionPendingTransactions',transaction);
          });
          console.log(response);
          return response;
          }
          catch(error) {
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
        try {
          let symbol = state.supportedInstrumentGlobalStates.get(_instrument).symbol;                    
          const response = await lendingPoolContract.methods.rebalanceStableBorrowRate(_instrument,_user).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'Rebalance Stable borrow Rate :' + symbol, amount : null}; 
            commit('addToSessionPendingTransactions',transaction);
          });
          console.log(response);
          return response;
          }
          catch(error) {
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
        try {
          let symbol = state.supportedInstrumentGlobalStates.get(_instrument).symbol;                    
          const response = await lendingPoolContract.methods.setUserUseInstrumentAsCollateral(_instrument,_useAsCollateral).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'Use As Collateral : ' + symbol , amount : null}; 
            commit('addToSessionPendingTransactions',transaction);
          });
          console.log(response);
          return response;
          }
          catch(error) {
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
        try {
          const response = await lendingPoolContract.methods.liquidationCall(_collateral,_instrument,_user,_purchaseAmount,_receiveIToken).send({from: state.connectedWallet})
                          .on('transactionHash',function(hash) {
                              let transaction = {hash : hash, function : 'Liquidation Call' , amount : null}; 
                              commit('addToSessionPendingTransactions',transaction);
                          });
          console.log(response);
          return response;
          }
          catch(error) {
            console.log(error);
            return error;
          }
      }
      else {
        console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
      }
    },

    // LendingPool_flashLoan: async ({commit,state},{_receiver,_instrument,_user,_amount,_params}) => {
    //   if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    //     const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    //     try {
    //       const response = await lendingPoolContract.methods.flashLoan(_instrument,_useAsCollateral).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
    //         let transaction = {hash : hash, function : 'FLASH LOAN' , amount : null}; 
    //         commit('addToSessionPendingTransactions',transaction);
    //       });
    //       console.log(response);
    //       return response;
    //       }
    //       catch(error) {
    //         // console.log('Making transaction (in store - catch)');
    //         console.log(error);
    //         return error;
    //       }
    //   }
    //   else {
    //     console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
    //     return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
    //   }
    // },

    LendingPool_getInstruments: async ({commit,state}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        // console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getInstruments().call();
          // console.log("LendingPool_getInstruments");
          // console.log(response);
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

    LendingPool_getInstrumentConfigurationData: async ({commit,state},{_instrumentAddress}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        // console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getInstrumentConfigurationData(_instrumentAddress).call();
          // console.log('LendingPool_getInstrumentConfigurationData');
          // console.log(response);
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

    LendingPool_getInstrumentData: async ({commit,state},{_instrumentAddress}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        // console.log(lendingPoolContract);
        try {
          const response = await lendingPoolContract.methods.getInstrumentData(_instrumentAddress).call();
          // console.log('LendingPool_getInstrumentData');
          // console.log(response);
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

IToken_redeem: async ({commit,state},{iTokenAddress,_amount,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    try {
      const response = await iTokenContract.methods.redeem(_amount).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : 'REDEEM' , amount : _amount + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_redirectInterestStream: async ({commit,state},{iTokenAddress,_to, symbol}) => {
  // Instrument Not supported on the connected Network
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    try {
      const response = await iTokenContract.methods.redirectInterestStream(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' Interest Stream Re-direction : ' + symbol , amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_allowInterestRedirectionTo: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    try {
      const response = await iTokenContract.methods.allowInterestRedirectionTo(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' Interest Stream Allowance', amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_redirectInterestStreamOf: async ({commit,state},{iTokenAddress,_from,_to, symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectInterestStreamOf(_from,_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' Interest Stream Re-direction (OF)' , amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_redirectSighStream: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectSighStream(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Stream Re-direction' , amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_redirectSighStreamOf: async ({commit,state},{iTokenAddress,_from,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectSighStreamOf(_from,_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Stream Re-direction (OF)' , amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_allowSighRedirectionTo: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    // console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.allowSighRedirectionTo(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Stream Allowance' , amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

IToken_claimMySIGH: async ({commit,state},{iTokenAddress,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    // console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.claimMySIGH().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' Claim $SIGH' , amount : null}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.isTransferAllowed(_user,_amount).call();
    console.log( "IToken_isTransferAllowed " + response);
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
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.principalBalanceOf(_user).call();
    console.log("IToken_principalBalanceOf " + response);
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
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.getInterestRedirectionAddress(_user).call();
    console.log('IToken_getInterestRedirectionAddress ' + response);
    // console.log(response);
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
    // console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.interestRedirectionAllowances(_user).call();
      console.log('IToken_getinterestRedirectionAllowances - ' + response);
      // console.log(response);
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
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.getRedirectedBalance(_user).call();
    console.log('IToken_getRedirectedBalance - ' + response);
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
    // console.log(iTokenAddress);
    // console.log(_user);
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.getRedirectedBalance(_user).call();
    console.log('IToken_getSighAccured ' + response);
    // console.log(response);
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
    // console.log(iTokenAddress);
    // console.log(_user);
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.getSighStreamRedirectedTo(_user).call();
    console.log('IToken_getSighStreamRedirectedTo ' + response);
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
    console.log(iTokenAddress);
    console.log(_user);
    // console.log(iTokenContract);
    const response = await iTokenContract.methods.getSighStreamAllowances(_user).call();
    console.log('IToken_getSighStreamAllowances ' + response );
    // console.log(response);
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

ERC20_approve: async ({commit,state},{tokenAddress,spender,amount,symbol }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    try {
      const response = await erc20Contract.methods.approve(spender,amount).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' APPROVE' , amount : amount + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

ERC20_mint: async ({commit,state},{tokenAddress,quantity, symbol }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(MintableERC20.abi, tokenAddress );
    try {
      const response = await erc20Contract.methods.mint(quantity).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' MINT' , amount : quantity + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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


ERC20_transfer: async ({commit,state},{tokenAddress,recepient,amount,symbol }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    try {
      const response = await erc20Contract.methods.transfer(recepient,amount).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' TRANSFER' , amount : amount + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

ERC20_transferFrom: async ({commit,state},{tokenAddress,sender,recepient,amount,symbol }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    try {
      const response = await erc20Contract.methods.transferFrom(sender,recepient,amount).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' TRANSFER FROM' , amount : amount + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

ERC20_increaseAllowance: async ({commit,state},{tokenAddress,spender,addedValue,symbol }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.increaseAllowance(spender,addedValue).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' INCREASE ALLOWANCE' , amount : addedValue + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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

ERC20_decreaseAllowance: async ({commit,state},{tokenAddress,spender,subtractedValue,symbol }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      const response = await erc20Contract.methods.decreaseAllowance(spender,subtractedValue).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' DECREASE ALLOWANCE' , amount : subtractedValue + ' ' + symbol}; 
        commit('addToSessionPendingTransactions',transaction);
        });
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
  console.log(owner);
  console.log(spender);
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
    // console.log(erc20Contract);
    // console.log('Balance Of Call');
    const response = await erc20Contract.methods.balanceOf(account).call();
    console.log(tokenAddress + ' Balance ' + response);
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

ERC20_name: async ({commit,state},{tokenAddress}) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20Detailed.abi, tokenAddress );
    // console.log(erc20Contract);
    const response = await erc20Contract.methods.name().call();
    // console.log("ERC20_name " + response);
    return response;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_symbol: async ({commit,state},{tokenAddress}) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20Detailed.abi, tokenAddress );
    // console.log(erc20Contract);
    const response = await erc20Contract.methods.symbol().call();
    // console.log("ERC20_symbol " + response);
    return response;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_decimals: async ({commit,state},{tokenAddress}) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20Detailed.abi, tokenAddress );
    // console.log(erc20Contract);
    const response = await erc20Contract.methods.decimals().call();
    // console.log("ERC20_decimals " + response);
    return response;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},


// #########################################
// ############ SIGH INSTRUMENT ############
// #########################################

SIGH_mintCoins: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    // console.log(sighContract);
    sighContract.methods.mintCoins().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
      let transaction = {hash : hash, function : ' MINT SIGH' , amount : null}; 
      commit('addToSessionPendingTransactions',transaction);
      })
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
getCurrentCycle: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getCurrentCycle().call();
    // console.log('SIGH getCurrentCycle' + response);
    return response;
  }
  else {
    console.log('getLatestMintSnapshot() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},
getMintSnapshotForCycle: async ({commit,state},{cycle}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    // console.log('SIGH getMintSnapshotForCycle');
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getMintSnapshotForCycle(cycle).call();
    // console.log(response);
    return response;
  }
  else {
    console.log('getLatestMintSnapshot() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},
getLatestMintSnapshot: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    // console.log('getLatestMintSnapshot');
    let response = await sighInstrumentContract.methods.getLatestMintSnapshot().call();
    // console.log(response);
    return response;
  }
  else {
    console.log('getLatestMintSnapshot() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},
getTotalSighBurnt: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getTotalSighBurnt().call();
    // console.log('getTotalSighBurnt = ' + response);
    return response;
  }
  else {
    console.log('getTotalSighBurnt() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},
getBlocksRemainingToMint: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getBlocksRemainingToMint().call();
    // console.log('getBlocksRemainingToMint = ' + response);
    return response;
  }
  else {
    console.log('getBlocksRemainingToMint() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},
getCurrentMintSpeed: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getCurrentMintSpeed().call();
    // console.log('getCurrentMintSpeed = ' + response);
    return response;
  }
  else {
    console.log('getCurrentMintSpeed() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},  
getSIGHInstrumentTreasury: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getTreasury().call();
    // console.log('getSIGHInstrumentTreasury ' + response );
    return response;
  }
  else {
    console.log('getSIGHInstrumentTreasury() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},  
getSighInstrumentSpeedController: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getSpeedController().call();
    // console.log('getSighInstrumentSpeedController ' + response );
    return response;
  }
  else {
    console.log('getSighInstrumentSpeedController() function in store.js. Protocol not supported on connected blockchain network');
    return null;
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
