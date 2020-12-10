import Vue from 'vue';
import Vuex from 'vuex';
// import {dateToDisplayTime,} from '@/utils/utility';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
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
    sighFinancePollingInitiated: false,
    networkNotSupportedMessage: 'SIGH Finance Currently only supports KOVAN Test-net (Network: 42).',
// ######################################################
// ############ PROTOCOL CONTRACT ADDRESSES  ############
// ######################################################
    
    GlobalAddressesProviderContractKovan: "0x9f9A32c0F6Ee33c4558221675bB65c8Dad950A98",
    ethereumPriceOracleAddressKovan: "0x9803DB21B6b535923D3c69Cc1b000d4bd45CCb12",
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
    supportedInstrumentSIGHStates: new Map(),       //   INSTRUMENT                    // SIGH Speeds etc
    supportedInstrumentConfigs: new Map(),        //   INSTRUMENT                    // Instrument Address -> Instrument Config  MAPPING  (instrument's liquidation threshold etc)
    walletInstrumentStates: new Map(),            //   WALLET - INSTRUMENT           // CONNECTED WALLET --> "EACH INSTRUMENT" STATE MAPPING ( deposited, balance, borrowed, fee, etc )
    walletSIGH_FinanceState: {},                //   WALLET - SIGH FINANCE         // CONNECTED WALLET --> "SIGH FINANCE" STATE MAPPING (total deposited, total borrowed, lifeTime Deposit, lifeTime Borrowed,  )
    walletSIGHState: {},                        //   WALLET - SIGH Token           // CONNECTED WALLET --> "SIGH" STATE MAPPING (sigh balance, lifeTimeSighVolume, contributionRatio = lifeTimeSighVolume/ SighGlobalTradeVolume)
    SIGHFinanceState: {},                       //   SIGH FINANCE                  // SIGH's STATE (totalSupply, mintSpeed, burnSpeed, totalMinted, price, Sigh Global Trade Volume, bonding Curve Health)
    SIGHState: {},                              //   SIGH                          // SIGH's STATE (totalSupply, mintSpeed, burnSpeed, totalMinted, price, Sigh Global Trade Volume, bonding Curve Health)

    currentlySelectedInstrument : {symbol:'WBTC',instrumentAddress: '0x0000000000000000000000000000000000000000' , name: 'Wrapped Bitcoin', decimals: 18, iTokenAddress: '0x0000000000000000000000000000000000000000' , priceDecimals: 8, price: 0 },  // Currently Selected Instrument

    // TRANSACTIONS HISTORY FOR THE CURRENT SESSION
    sessionPendingTransactions : [],
    sessionSuccessfulTransactions : [],
    sessionFailedTransactions : [],
    
    // ETH / USD : PRICE 
    ethPriceDecimals: null,             // Decimals 
    ethereumPriceUSD: null,             // ETH Price in USD

    // SIGH / ETH : PRICE 
    sighPriceUSD: null,                  // SIGH Price in ETH
    sighPriceDecimals: null,             // Decimals 

    // BLOCKS REMAINING FOR SIGH SPEED REFRESH
    blocksRemainingForSIGHSpeedRefresh : 0,

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
    getSIGHPrice(state) {
      return state.sighPriceUSD;
    },     
    getSIGHPriceDecimals(state) {
      return state.sighPriceDecimals;
    },
    // SUPPRTED INSTRUMENTS ARRAY
    getSupportedInstrumentAddresses(state) {
      return state.supportedInstrumentAddresses;
    },
    getSupportedInstruments(state) {
      return state.supportedInstruments;
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
    },
    updateETHPrice(state, updatedPrice) {
      state.ethereumPriceUSD = updatedPrice;
    },
    setSIGHPriceDecimals(state, decimals) {
      state.sighPriceDecimals = decimals;
    },
    updateSIGHPrice(state, updatedPrice) {
      state.sighPriceUSD = updatedPrice;
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
    // SUPPRTED INSTRUMENTS - SIGH STATE (MAP)
    addToSupportedInstrumentSIGHStates(state,{instrumentAddress, instrumentSIGHState}) {
      state.supportedInstrumentSIGHStates.set(instrumentAddress,instrumentSIGHState);
      console.log('In addToSupportedInstrumentSIGHStates (MUTATION)');
      console.log(instrumentSIGHState);
    },
    resetSupportedInstrumentSIGHStates(state) {
      state.supportedInstrumentSIGHStates = new Map();
      console.log('In resetSupportedInstrumentSIGHStates -');
    },
    // SUPPRTED INSTRUMENTS - CONFIG STATE (MAP)    
    addToSupportedInstrumentConfigs(state,{instrumentAddress, instrumentConfig}) {
      state.supportedInstrumentConfigs.set(instrumentAddress,instrumentConfig);
      // console.log('In addToSupportedInstrumentConfigs (MUTATION)');
      // console.log(instrumentConfig);
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
    // UPDATE SELECTED INSTRUMENT
    updateSelectedInstrument(state, selectedInstrument_) {
      state.currentlySelectedInstrument = selectedInstrument_;
      console.log("In updateSelectedInstrument ");
      console.log(state.currentlySelectedInstrument)
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
  initiateSighFinancePolling: async ({state,commit}) => {

    if (state.GlobalAddressesProviderAddress) {
      try {  
        // state.sighFinancePollingInitiated = true;
        // FETCHING "SUPPRTED INSTRUMENT ADDRESSES" 
        let supportedInstrumentAddresses =  await store.dispatch("LendingPool_getInstruments"); ;
        commit("setSupportedInstrumentAddresses",supportedInstrumentAddresses);
    
        // ETH/USD : PRICE & PRICE DECIMALS
        let ethPriceDecimals = await store.dispatch("getInstrumentPriceDecimals",{_instrumentAddress: state.EthereumPriceOracleAddress});   
        commit('setEthPriceDecimals',ethPriceDecimals);                  // ETH Price Decimals
        let ethPriceUSD = await store.dispatch("getInstrumentPrice",{_instrumentAddress: state.EthereumPriceOracleAddress}); 
        commit('updateETHPrice',ethPriceUSD);                             // ETH/USD Price 

        // SIGH/ETH : PRICE & PRICE DECIMALS
        // let sighPriceDecimals = await store.dispatch("getInstrumentPriceDecimals",{_instrumentAddress: state.SIGHContractAddress});   
        // commit('setSIGHPriceDecimals',sighPriceDecimals);                  // SIGH/ETH Price Decimals
        // let sighPriceETH = await store.dispatch("getInstrumentPrice",{_instrumentAddress: state.EthereumPriceOracleAddress}); 
        // commit('updateSIGHPrice',sighPriceETH);                             // SIGH/ETH Price
        
        // INITIATE POLLING : ETH Price, Blocks Remaining, Transaction States
        store.dispatch('initiatePolling_ETHPrice_SpeedRefresh_Transactions');
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


  // [TESTED. WORKING AS EXPECTED] KEEP UPDATING ETH PRICE
  initiatePolling_ETHPrice_SpeedRefresh_Transactions: async ({commit,state}) => {
    console.log("initiatePolling_ETHPrice_SpeedRefresh_Transactions : updating ETH price");
    setInterval(async () => {
      // POLLING ETH/USD PRICE
      if (state.EthereumPriceOracleAddress) {
        let updatedPrice_ = await store.dispatch('getInstrumentPrice', { _instrumentAddress : state.EthereumPriceOracleAddress } );
        if (updatedPrice_) {
          commit("updateETHPrice",updatedPrice_);
          console.log( " ETH / USD : $ " + updatedPrice_);
        }
      }
      // POLLING SIGH/ETH PRICE
      // if (state.SIGHContractAddress) {
      //   let updatedPrice_ = await store.dispatch('getInstrumentPrice', { _instrumentAddress : state.SIGHContractAddress } );
      //   if (updatedPrice_) {
      //     commit("updateSIGHPrice",updatedPrice_);
      //     console.log( " SIGH / ETH : " + updatedPrice_ + " ETH");
      //   }
      // }
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
            let protocolStateInitialized = await store.dispatch("initiateSighFinancePolling");
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
             
        let userGlobalState = await store.dispatch("refresh_User_SIGH_Finance_State"); // Calls Lending Pool : getUserAccountData()
        commit("setWalletSIGH_FinanceState",userGlobalState);
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    }, 


  // GETS TOTAL LIQUIDITY, COLLATERAL, BORROWED AMOUNT, AVAILABLE BORROWS, LTV, LIQ. Threshold and HEATH Factor
  // for the Connected WALLET
  refresh_User_SIGH_Finance_State: async({commit,state}) => {    // Calls Lending Pool : getUserAccountData()
    if (state.web3 && state.isNetworkSupported && state.connectedWallet) {
      try {
        let userGlobalState = {};
        let userGlobalStateResponse = await store.dispatch("getUserProtocolState", {_user: state.connectedWallet} );

        userGlobalState.totalLiquidityETH = userGlobalStateResponse.totalLiquidityETH ;
        userGlobalState.totalCollateralETH = userGlobalStateResponse.totalCollateralETH ;
        userGlobalState.totalBorrowsETH = userGlobalStateResponse.totalBorrowsETH ;
        userGlobalState.totalFeesETH = userGlobalStateResponse.totalFeesETH ;
        userGlobalState.availableBorrowsETH = userGlobalStateResponse.availableBorrowsETH ;
        userGlobalState.currentLiquidationThreshold = userGlobalStateResponse.currentLiquidationThreshold ;
        userGlobalState.ltv = userGlobalStateResponse.ltv ;
        userGlobalState.healthFactor = userGlobalStateResponse.healthFactor ;  

        userGlobalState.totalLiquidityUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalLiquidityETH)}); 
        userGlobalState.totalCollateralUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalCollateralETH)}); 
        userGlobalState.totalBorrowsUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalBorrowsETH)}); 
        userGlobalState.totalFeesUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.totalFeesETH)}); 
        userGlobalState.availableBorrowsUSD = await store.dispatch("convertToUSD",{ETHValue: Number(userGlobalState.availableBorrowsETH)}); 
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
          walletSighState.totalSuppliedSighSpeedForUser = 0; //Number(walletSighState.totalSuppliedSighSpeedForUser) + Number(currentUserInstrumentState.suppliedSighSpeedForUser);
          walletSighState.totalBorrowedSighSpeedForUser = 0; //Number(walletSighState.totalBorrowedSighSpeedForUser) + Number(currentUserInstrumentState.borrowedSighSpeedForUser);
          walletSighState.totalSighSpeedForUser = 0; // Number(walletSighState.totalSighSpeedForUser) + Number(currentUserInstrumentState.SighSpeedForUser);
        }

        walletSighState.totalSighAccuredWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalSighAccured) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 
        walletSighState.totalSuppliedSighSpeedForUserWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalSuppliedSighSpeedForUser) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 
        walletSighState.totalBorrowedSighSpeedForUserWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalBorrowedSighSpeedForUser) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 
        walletSighState.totalSighSpeedForUserWorth = await store.dispatch("convertToUSD",{ETHValue: Number(walletSighState.totalSighSpeedForUser) * Number(state.SIGHState.priceETH) / Math.pow(10,Number(state.SIGHState.priceDecimals)) }); 

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
        cur_user_instrument_state.priceETH =  cur_instrument.priceETH;
        cur_user_instrument_state.priceDecimals = cur_instrument.priceDecimals;

        // USER - INSTRUMENT STATE
        // calls LendingPool : getUserInstrumentData()        
        let response = await store.dispatch('getUserInstrumentState',{_instrumentAddress:cur_instrument.instrumentAddress , _user: state.connectedWallet });
        cur_user_instrument_state.userDepositedBalance = BigNumber(response.currentITokenBalance).shiftedBy((-1)*Number(cur_instrument.decimals)).toNumber() ;
        cur_user_instrument_state.principalBorrowBalance =  BigNumber(response.principalBorrowBalance).shiftedBy((-1)*Number(cur_instrument.decimals)).toNumber() ; 
        cur_user_instrument_state.currentBorrowBalance =   BigNumber(response.currentBorrowBalance).shiftedBy((-1)*Number(cur_instrument.decimals)).toNumber()  ;
        cur_user_instrument_state.originationFee =  BigNumber(response.borrowFee).shiftedBy((-1)*Number(cur_instrument.decimals)).toNumber() ;

        cur_user_instrument_state.userBalance = await store.dispatch("ERC20_balanceOf",{tokenAddress: cur_instrument.instrumentAddress , account: state.connectedWallet});
        cur_user_instrument_state.userAvailableAllowance = await store.dispatch("ERC20_getAllowance",{tokenAddress: cur_instrument.instrumentAddress , owner: state.connectedWallet, spender: state.LendingPoolCoreContractAddress });

        cur_user_instrument_state.userBalanceWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.userBalance) * Number(cur_user_instrument_state.priceETH)  });
        cur_user_instrument_state.userAvailableAllowanceWorth = await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.userAvailableAllowance) * Number(cur_user_instrument_state.priceETH) });     
        cur_user_instrument_state.userDepositedBalanceWorth = await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.userDepositedBalance) * Number(cur_user_instrument_state.priceETH) }); 
        cur_user_instrument_state.principalBorrowBalanceWorth = await  store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.principalBorrowBalance) * Number(cur_user_instrument_state.priceETH) });
        cur_user_instrument_state.currentBorrowBalanceWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.currentBorrowBalance) * Number(cur_user_instrument_state.priceETH) }); 

        cur_user_instrument_state.borrowRateMode =  response.borrowRateMode ;
        cur_user_instrument_state.borrowRate =  response.borrowRate ;
        cur_user_instrument_state.liquidityRate =  response.liquidityRate ;
        cur_user_instrument_state.originationFeeWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.originationFee) * Number(cur_user_instrument_state.priceETH) });     
        cur_user_instrument_state.variableBorrowIndex =  response.variableBorrowIndex ;      
        cur_user_instrument_state.usageAsCollateralEnabled = response.usageAsCollateralEnabled ;       
  
        // INTEREST STREAM 
        cur_user_instrument_state.interestRedirectionAddress =  await store.dispatch("IToken_getInterestRedirectionAddress",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.redirectedBalance =  await store.dispatch("IToken_getRedirectedBalance",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet, decimals: cur_user_instrument_state.decimals }) ;
        cur_user_instrument_state.interestRedirectionAllowance =  await store.dispatch("IToken_getinterestRedirectionAllowances",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;

        // $SIGH STREAMS 
        response =  await store.dispatch("IToken_getSIGHStreamsRedirectedTo",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.liquiditySIGHStreamRedirectedTo = response.liquiditySIGHStreamRedirectionAddress
        cur_user_instrument_state.borrowingSIGHStreamRedirectedTo = response.BorrowingSIGHStreamRedirectionAddress
        response =  await store.dispatch("IToken_getSIGHStreamsAllowances",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;
        cur_user_instrument_state.liquiditySIGHStreamRedirectionAllowance = response.liquiditySIGHStreamRedirectionAllowance
        cur_user_instrument_state.borrowingSIGHStreamRedirectionAllowance = response.BorrowingSIGHStreamRedirectionAllowance
        response =  await store.dispatch("IToken_getSIGHStreamsRedirectedBalances",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet,  decimals: cur_user_instrument_state.decimals  }) ;
        cur_user_instrument_state.liquiditySIGHStreamRedirectedBalance = response.liquiditySIGHStreamRedirectedBalance
        cur_user_instrument_state.borrowingSIGHStreamRedirectedBalance = response.borrowingSIGHStreamRedirectedBalance
        cur_user_instrument_state.sighAccured =  await store.dispatch("IToken_getSighAccured",{iTokenAddress: cur_user_instrument_state.iTokenAddress , _user: state.connectedWallet }) ;

        cur_user_instrument_state.liquiditySIGHStreamRedirectedBalanceWorth = await  store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.liquiditySIGHStreamRedirectedBalance) * Number(cur_user_instrument_state.priceETH) });
        cur_user_instrument_state.borrowingSIGHStreamRedirectedBalanceWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.borrowingSIGHStreamRedirectedBalance) * Number(cur_user_instrument_state.priceETH) }); 
        cur_user_instrument_state.redirectedBalanceWorth =  await store.dispatch("convertToUSD",{ETHValue: Number(cur_user_instrument_state.redirectedBalance) * Number(cur_user_instrument_state.priceETH) }); 

        console.log("refresh_User_Instrument_State");
        console.log(cur_user_instrument_state);
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
    let response = await lendingPoolContract.methods.getUserAccountData(_user).call();
    // SINCE THE PRICE-ORACLE IS RETURNING ALL ETH PRICES SHIFTED RIGHT BY 18 DECIMALS, WE RECTIFY THAT
    if (Number(response.totalLiquidityETH)) {
      response.totalLiquidityETH = BigNumber(response.totalLiquidityETH).shiftedBy(-18);
      response.totalCollateralETH = BigNumber(response.totalCollateralETH).shiftedBy(-18);
      response.totalBorrowsETH = BigNumber(response.totalBorrowsETH).shiftedBy(-18);
      response.totalFeesETH = BigNumber(response.totalFeesETH).shiftedBy(-18);
      response.availableBorrowsETH = BigNumber(response.availableBorrowsETH).shiftedBy(-18);
      console.log(response);
      // response.currentLiquidationThreshold = response.currentLiquidationThreshold ;
      // response.ltv = response.ltv ;
      response.healthFactor = BigNumber(response.healthFactor).shiftedBy(-18);    
    }

    return response;
  }
  else {
    console.log('getUserProtocolState() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},

getUserInstrumentState: async ({commit,state},{_instrumentAddress, _user}) => {  // calls LendingPool : getUserInstrumentData()
  if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    console.log('getUserInstrumentState');
    console.log(_instrumentAddress);
    console.log(_user);

    try {
      let response = await lendingPoolContract.methods.getUserInstrumentData(_instrumentAddress,_user).call();
      console.log(response);
      if (Number(response.liquidityRate) > 0 || Number(response.borrowRate) > 0 ) {
        response.borrowRate = BigNumber(Number(response.borrowRate)).shiftedBy(-25);
        response.liquidityRate = BigNumber(Number(response.liquidityRate)).shiftedBy(-25);
      }
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

    // DECIMAL ADJUSTED
    getSIGHSpeedControllerBalance: async ({commit,state}) => {
      if (state.web3 && state.SIGHSpeedControllerAddress && state.SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, state.SIGHSpeedControllerAddress );
        try {
          let response = await sighSpeedControllerContract.methods.getSIGHBalance().call();
          let balance = BigNumber(response);
          balance = balance.shiftedBy(-18);
          return balance;
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
        try {
          let response = await sighSpeedControllerContract.methods.getSupportedProtocols().call();
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
        try {
          let response = await sighDistributionHandlerContract.methods.refreshSIGHSpeeds().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Speeds : Refresh' , amount : null  }; 
            commit('addToSessionPendingTransactions',transaction);
          });
            console.log("SIGHDistributionHandler_refreshSighSpeeds");
            console.log(response);
            return response;
          }  
        catch(error) {
          console.log(error);
          return error;
        } 
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },

    // DECIMAL ADJUSTED
    SIGHDistributionHandler_getSIGHBalance: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        let response = await sighDistributionHandlerContract.methods.getSIGHBalance().call();
        console.log("sighDistributionHandler SIGH Balance = " + response );   
        let balance = BigNumber(response);
        balance = balance.shiftedBy(-18);
        console.log("sighDistributionHandler SIGH Balance  (Decimal Adjusted) = " + balance );   
        return balance;            
      }
      else {
        console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
      }
    },

    SIGHDistributionHandler_getSIGHSpeed: async ({commit,state}) => {
      if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
        let response = await sighDistributionHandlerContract.methods.getSIGHSpeed().call();
        console.log("sighDistributionHandler SIGH Speed = " + response );        
        let sighSpeed = BigNumber(response);
        sighSpeed = sighSpeed.shiftedBy(-18);
        console.log("sighDistributionHandler SIGH Speed (Decimal Adjusted) = " + sighSpeed );        
        return sighSpeed;            
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

    // SIGHDistributionHandler_getInstrumentSighMechansimStates: async ({commit,state},{instrument_}) => {
    //   if (state.web3 && state.SIGHDistributionHandlerAddress && state.SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
    //     const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, state.SIGHDistributionHandlerAddress );
    //     let response = await sighDistributionHandlerContract.methods.getInstrumentSighMechansimStates(instrument_).call();
    //     console.log("sighDistributionHandler INSTRUMENT Data = " );
    //     console.log(response);                
    //     return response;            
    //   }
    //   else {
    //     console.log("SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on " + getters.networkName);
    //     return "SIGH Finance (SIGH Distribution Handler Contract) is currently not been deployed on ";
    //   }
    // },        
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

    // DECIMAL ADJUSTED
    SIGHStaking_stake_SIGH: async ({commit,state},{amountToBeStaked}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);
        try {   
          let quantity_ = new BigNumber(Number(amountToBeStaked));
          quantity_ = quantity_.shiftedBy(18).toFixed(0);
          console.log(symbol + " SIGH Being staked (BIG NUMBER, i.e Wei) = " + quantity_ );    
          const response = await sighStakingContract.methods.stake_SIGH(quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking', amount : Number(amountToBeStaked).toFixed(4) + ' SIGH'  }; 
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

    // DECIMAL ADJUSTED    
    SIGHStaking_unstake_SIGH: async ({commit,state},{amountToBeUNStaked}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);        
        try { 
          let quantity_ = new BigNumber(Number(amountToBeUNStaked));
          quantity_ = quantity_.shiftedBy(18).toFixed(0);
          console.log(symbol + " SIGH Being UNstaked (BIG NUMBER, i.e Wei) = " + quantity_ );              
          const response = await sighStakingContract.methods.unstake_SIGH(quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Un-Staking', amount : Number(amountToBeUNStaked).toFixed(4) + ' SIGH'  }; 
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
        try {         
          const response = await sighStakingContract.methods.claimAllAccumulatedInstruments().send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking : Claim Rewards', amount : null  }; 
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
        console.log("SIGH Finance (SIGH Staking Contract) is currently not been deployed on " + getters.networkName);
        return "SIGH Finance (SIGH Staking Contract) is currently not been deployed on ";
      }
    },

    SIGHStaking_claimAccumulatedInstrument: async ({commit,state},{instrumentToBeClaimed}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        console.log(sighStakingContract);
        try {       
          const response = await sighStakingContract.methods.claimAccumulatedInstrument(instrumentToBeClaimed).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : '$SIGH Staking : Claim Reward' , amount : null  }; 
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

    // DECIMAL ADJUSTED
    SIGHStaking_getStakedBalanceForStaker: async ({commit,state},{_user}) => {
      if (state.web3 && state.sighStakingContractAddress && state.sighStakingContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighStakingContract = new state.web3.eth.Contract(SighStakingInterface.abi, state.sighStakingContractAddress );
        // console.log(sighStakingContract);
        const response = await sighStakingContract.methods.getStakedBalanceForStaker(_user).call();
        console.log('SIGH Staked Balance = ' + response);
        let stakedBalance = BigNumber(response);
        stakedBalance = stakedBalance.shiftedBy(-18);
        console.log('SIGH Staked Balance (Decimal Adjusted) = ' + stakedBalance);
        return stakedBalance;
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

    // DECIMAL ADJUSTED
    LendingPool_deposit: async ({commit,state},{_instrument,_amount,_referralCode, symbol, decimals }) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {
          let quantity_ = new BigNumber(Number(_amount));
          quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
          console.log(symbol + " Being Deposited (BIG NUMBER, i.e Wei) = " + quantity_ );    
          const response = await lendingPoolContract.methods.deposit(_instrument ,quantity_ ,_referralCode).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'DEPOSIT' , amount : Number(_amount).toFixed(4) + ' ' + symbol}; 
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

    // DECIMAL ADJUSTED
    LendingPool_borrow: async ({commit,state},{_instrument,_amount,_interestRateMode,_referralCode, symbol, decimals}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {  
          let quantity_ = new BigNumber(Number(_amount));
          quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
          console.log(symbol + " Being Borrowed (BIG NUMBER, i.e Wei) = " + quantity_ );    
          const response = await lendingPoolContract.methods.borrow(_instrument, quantity_, _interestRateMode,_referralCode).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'BORROW' , amount : Number(_amount).toFixed(4) + ' ' + symbol}; 
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

    // DECIMAL ADJUSTED
    LendingPool_repay: async ({commit,state},{_instrument,_amount,_onBehalfOf,symbol,decimals}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {
          let quantity_ = new BigNumber(Number(_amount));
          quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
          console.log(symbol + " Being Repaid (BIG NUMBER, i.e Wei) = " + quantity_ );    
          const response = await lendingPoolContract.methods.repay(_instrument,quantity_,_onBehalfOf).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
            let transaction = {hash : hash, function : 'REPAY' , amount : Number(_amount).toFixed(4) + ' ' + symbol}; 
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
          let symbol = state.supportedInstrumentConfigs.get(_instrument).symbol;                    
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
          let symbol = state.supportedInstrumentConfigs.get(_instrument).symbol;                    
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

    LendingPool_setUserUseInstrumentAsCollateral: async ({commit,state},{_instrument,_useAsCollateral, symbol}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {
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
        try {
          const response = await lendingPoolContract.methods.getInstruments().call();
          // console.log("LendingPool_getInstruments");
          // console.log(response);
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

    LendingPool_getInstrumentConfigurationData: async ({commit,state},{_instrumentAddress}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {
          const response = await lendingPoolContract.methods.getInstrumentConfigurationData(_instrumentAddress).call();
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

    LendingPool_getInstrumentData: async ({commit,state},{_instrumentAddress}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {
          const response = await lendingPoolContract.methods.getInstrumentData(_instrumentAddress).call();
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

    LendingPool_getUserAccountData: async ({commit,state},{_user}) => {
      if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
        try {
          const response = await lendingPoolContract.methods.getUserAccountData(_user).call();
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

    // LendingPool_getUserInstrumentData: async ({commit,state},{_instrument, _user}) => {
    //   if (state.web3 && state.LendingPoolContractAddress && state.LendingPoolContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    //     const lendingPoolContract = new state.web3.eth.Contract(LendingPool.abi, state.LendingPoolContractAddress );
    //     try {
    //       const response = await lendingPoolContract.methods.getUserInstrumentData(_instrument, _user).call();
    //       console.log(response);
    //       return response;
    //       }
    //       catch(error) {
    //         console.log(error);
    //         return error;
    //       }
    //   }
    //   else {
    //     console.log("SIGH Finance (Lending Pool Contract) is currently not been deployed on " + getters.networkName);
    //     return "SIGH Finance (Lending Pool Contract) is currently not been deployed on ";
    //   }
    // },    
    
    LendingPoolCore_getUserBorrowBalances: async ({commit,state},{_instrument,_user}) => {
      if (state.web3 && state.LendingPoolCoreContractAddress && state.LendingPoolCoreContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const lendingPoolCoreContract = new state.web3.eth.Contract(LendingPoolCore.abi, state.LendingPoolCoreContractAddress );
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

// DECIMAL ADJUSTED
IToken_redeem: async ({commit,state},{iTokenAddress,_amount,symbol, decimals}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    try {
      let quantity_ = new BigNumber(Number(_amount));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Being Redeemed (BIG NUMBER, i.e Wei) = " + quantity_ );    
      const response = await iTokenContract.methods.redeem(quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : 'REDEEM' , amount : Number(_amount).toFixed(4) + ' ' + symbol}; 
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

IToken_redirectLiquiditySIGHStream: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectLiquiditySIGHStream(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH LIQUIDITY Stream Re-direction' , amount : null}; 
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

IToken_redirectBorrowingSIGHStream: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectBorrowingSIGHStream(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH BORROWING Stream Re-direction' , amount : null}; 
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

IToken_redirectLiquiditySIGHStreamOf: async ({commit,state},{iTokenAddress,_from,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectLiquiditySIGHStreamOf(_from,_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Liquidity Stream Re-direction (OF)' , amount : null}; 
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

IToken_redirectBorrowingSIGHStreamOf: async ({commit,state},{iTokenAddress,_from,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.redirectBorrowingSIGHStreamOf(_from,_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Borrowing Stream Re-direction (OF)' , amount : null}; 
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

IToken_allowLiquiditySIGHRedirectionTo: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    // console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.allowLiquiditySIGHRedirectionTo(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Liquidity Stream Allowance' , amount : null}; 
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

IToken_allowBorrowingSIGHRedirectionTo: async ({commit,state},{iTokenAddress,_to,symbol}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    // console.log(iTokenContract);
    try {
      const response = await iTokenContract.methods.allowBorrowingSIGHRedirectionTo(_to).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : symbol + ' $SIGH Liquidity Stream Allowance' , amount : null}; 
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

// DECIMAL ADJUSTED
IToken_principalBalanceOf: async ({commit,state},{iTokenAddress,_user, decimals}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.principalBalanceOf(_user).call();
    console.log("IToken_principalBalanceOf " + response);
    let principalBalance = BigNumber(response);
    principalBalance = principalBalance.shiftedBy((-1) * Number(decimals));
    console.log('IToken_principalBalanceOf (DECIMAL ADJUSTED) ' + principalBalance);
    return principalBalance;  
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getInterestRedirectionAddress: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.getInterestRedirectionAddress(_user).call();
    // console.log('IToken_getInterestRedirectionAddress ' + response);
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
    try {
      const response = await iTokenContract.methods.interestRedirectionAllowances(_user).call();
      // console.log('IToken_getinterestRedirectionAllowances - ' + response);
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


// DECIMAL ADJUSTED
IToken_getRedirectedBalance: async ({commit,state},{iTokenAddress,_user, decimals}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.getRedirectedBalance(_user).call();
    // console.log('IToken_getRedirectedBalance - ' + response);
    let redirectedBalance = BigNumber(response);
    redirectedBalance = redirectedBalance.shiftedBy((-1) * Number(decimals));
    // console.log('IToken_getRedirectedBalance (DECIMAL ADJUSTED) ' + redirectedBalance);
    return redirectedBalance;  
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

// DECIMAL ADJUSTED
IToken_getSighAccured: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.getSighAccured(_user).call();
    console.log('IToken_getSighAccured ' + response);
    let sighAccured = BigNumber(response);
    sighAccured = sighAccured.shiftedBy(-18);
    console.log('IToken_getSighAccured (DECIMAL ADJUSTED) ' + sighAccured);
    return sighAccured;
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getSIGHStreamsRedirectedTo: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.getSIGHStreamsRedirectedTo(_user).call();
    // console.log('IToken_getSIGHStreamsRedirectedTo ' + response);
    return response;
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getSIGHStreamsAllowances: async ({commit,state},{iTokenAddress,_user}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.getSIGHStreamsAllowances(_user).call();
    // console.log('IToken_getSIGHStreamsAllowances ' + response );
    return response;
  }
  else {
    console.log("This particular Instrument is currently not supported by SIGH Finance on " + getters.networkName);
    return "This particular Instrument is currently not supported by SIGH Finance on ";
  }
},

IToken_getSIGHStreamsRedirectedBalances: async ({commit,state},{iTokenAddress,_user, decimals}) => {
  if (state.web3 && iTokenAddress && iTokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const iTokenContract = new state.web3.eth.Contract(IToken.abi, iTokenAddress );
    const response = await iTokenContract.methods.getSIGHStreamsRedirectedBalances(_user).call();
    // console.log('IToken_getSIGHStreamsRedirectedBalances ' + response );
    let adjustedResponse = {};
    adjustedResponse.liquiditySIGHStreamRedirectedBalance = BigNumber(response.liquiditySIGHStreamRedirectedBalance);
    adjustedResponse.liquiditySIGHStreamRedirectedBalance = adjustedResponse.liquiditySIGHStreamRedirectedBalance.shiftedBy((-1) * Number(decimals));
    adjustedResponse.borrowingSIGHStreamRedirectedBalance = BigNumber(response.borrowingSIGHStreamRedirectedBalance);
    adjustedResponse.borrowingSIGHStreamRedirectedBalance = adjustedResponse.borrowingSIGHStreamRedirectedBalance.shiftedBy((-1) * Number(decimals));
    return adjustedResponse;
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

// Decimals Adjusted
ERC20_approve: async ({commit,state},{tokenAddress,spender,quantity,symbol, decimals }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    try {
      let quantity_ = new BigNumber(Number(quantity));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Being Approved (BIG NUMBER, i.e Wei) = " + quantity_ );
      const response = await erc20Contract.methods.approve(spender,quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' APPROVE' , amount : Number(quantity).toFixed(4) + ' ' + symbol}; 
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

// Decimals Adjusted
ERC20_mint: async ({commit,state},{tokenAddress,quantity,symbol, decimals }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(MintableERC20.abi, tokenAddress );
    try {
      let quantity_ = new BigNumber(Number(quantity));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Being Minted (BIG NUMBER, i.e Wei) = " + quantity_ );
      const response = await erc20Contract.methods.mint(quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
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

// Decimals Adjusted
ERC20_transfer: async ({commit,state},{tokenAddress,recepient,amount,symbol,decimals }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    try {
      let quantity_ = new BigNumber(Number(amount));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Transfer (BIG NUMBER, i.e Wei) = " + quantity_ );
      const response = await erc20Contract.methods.transfer(recepient,quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
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

// Decimals Adjusted
ERC20_transferFrom: async ({commit,state},{tokenAddress,sender,recepient,amount,symbol,decimals }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    try {
      let quantity_ = new BigNumber(Number(amount));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Transfer From (BIG NUMBER, i.e Wei) = " + quantity_ );
      const response = await erc20Contract.methods.transferFrom(sender,recepient,quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
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

// Decimals Adjusted
ERC20_increaseAllowance: async ({commit,state},{tokenAddress,spender,addedValue,symbol, decimals }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      let quantity_ = new BigNumber(Number(addedValue));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Increase Allowance (BIG NUMBER, i.e Wei) = " + quantity_ );
      const response = await erc20Contract.methods.increaseAllowance(spender,quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' INCREASE ALLOWANCE' , amount : Number(addedValue).toFixed(4) + ' ' + symbol}; 
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

// Decimals Adjusted
ERC20_decreaseAllowance: async ({commit,state},{tokenAddress,spender,subtractedValue,symbol, decimals }) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    console.log(erc20Contract);
    try {
      let quantity_ = new BigNumber(Number(subtractedValue));
      quantity_ = quantity_.shiftedBy(Number(decimals)).toFixed(0);
      console.log(symbol + " Decrease Allowance (BIG NUMBER, i.e Wei) = " + quantity_ );
      const response = await erc20Contract.methods.decreaseAllowance(spender,quantity_).send({from: state.connectedWallet}).on('transactionHash',function(hash) {
        let transaction = {hash : hash, function : ' DECREASE ALLOWANCE' , amount : Number(subtractedValue).toFixed(4) + ' ' + symbol}; 
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


// Decimals Adjusted
ERC20_getAllowance: async ({commit,getters,state},{tokenAddress,owner,spender }) => {
  if (state.web3 && owner && spender && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    let decimals = await store.dispatch("ERC20_decimals",{tokenAddress: tokenAddress}); 
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    const response = await erc20Contract.methods.allowance(owner,spender).call();
    console.log('Current allowance (value returned) - ' + response);
    let allowance = BigNumber(response);
    allowance = allowance.shiftedBy((-1)*Number(decimals)).toNumber();
    console.log('Current allowance (value returned) Decimals Adjusted - ' + allowance);
    return allowance;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

// Decimals Adjusted
ERC20_balanceOf: async ({commit,state},{tokenAddress,account }) => {
  if (state.web3 && account && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    let decimals = await store.dispatch("ERC20_decimals",{tokenAddress: tokenAddress}); 
    const response = await erc20Contract.methods.balanceOf(account).call();
    console.log('Current Balance (value returned) - ' + response);
    let balance = BigNumber(response);
    balance = balance.shiftedBy((-1)*Number(decimals)).toNumber();
    console.log('Current Balance (value returned) Decimals Adjusted - ' + balance);
    return balance;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

// Decimals Adjusted
ERC20_totalSupply: async ({commit,state},{tokenAddress}) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20.abi, tokenAddress );
    let decimals = await store.dispatch("ERC20_decimals",{tokenAddress: tokenAddress}); 
    const response = await erc20Contract.methods.totalSupply().call();
    console.log('Total Supply (value returned) - ' + response);
    let supply = BigNumber(response);
    supply = supply.shiftedBy((-1)*Number(decimals)).toNumber();
    console.log('Total Supply (value returned) Decimals Adjusted - ' + supply);
    return supply;
  }
  else {
    console.log("This ERC20 Contract has currently not been deployed on " + getters.networkName);
    return "This ERC20 Contract has currently not been deployed on ";
  }
},

ERC20_name: async ({commit,state},{tokenAddress}) => {
  if (state.web3 && tokenAddress && tokenAddress!= "0x0000000000000000000000000000000000000000" ) {
    const erc20Contract = new state.web3.eth.Contract(ERC20Detailed.abi, tokenAddress );
    const response = await erc20Contract.methods.name().call();
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
    const response = await erc20Contract.methods.symbol().call();
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
    const response = await erc20Contract.methods.decimals().call();
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

// Decimals Adjusted
getTotalSighBurnt: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getTotalSighBurnt().call();
    let sighBurnt = BigNumber(response);
    sighBurnt = sighBurnt.shiftedBy( -18 );
    return sighBurnt;
  }
  else {
    console.log('getTotalSighBurnt() function in store.js. Protocol not supported on connected blockchain network');
    return null;
  }
},

// Decimals Adjusted
getCurrentMintSpeed: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getCurrentMintSpeed().call();
    let mintSpeed = BigNumber(response);
    mintSpeed = mintSpeed.shiftedBy( -18 );
    return mintSpeed;
  }
  else {
    console.log('getCurrentMintSpeed() function in store.js. Protocol not supported on connected blockchain network');
    return null;
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

getSIGHInstrumentTreasury: async ({commit,state}) => {
  if (state.web3 && state.SIGHContractAddress && state.SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
    const sighInstrumentContract = new state.web3.eth.Contract(SIGHInstrument.abi, state.SIGHContractAddress );
    let response = await sighInstrumentContract.methods.getTreasury().call();
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

  getBalanceString: ({commit,state},{number}) => {
    if ( Number(number) > 1000000 ) {
      let inMil = (Number(number) / 1000000).toFixed(2);
      return inMil.toString() + ' M';
    } 
    if ( Number(number) > 1000 ) {
      let inK = (Number(number) / 1000).toFixed(3);
      return inK.toString() + ' K';
    } 
    return number;
  },


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
