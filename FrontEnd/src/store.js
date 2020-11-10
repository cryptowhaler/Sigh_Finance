import Vue from 'vue';
import Vuex from 'vuex';
import {dateToDisplayTime,} from '@/utils/utility';
import Web3 from 'web3';
import NotificationPlugin from './plugins/notifications.js';
import Notifications from 'vue-notification';

const qs = require('qs');
const EthereumTx = require("ethereumjs-tx").Transaction;

import GlobalAddressesProviderInterface from '@/contracts/IGlobalAddressesProvider.json'; // GlobalAddressesProviderContract Interface

import SIGHInstrument from '@/contracts/SIGH.json'; // SIGH Contract
import SighSpeedController from '@/contracts/ISighSpeedController.json'; // SighSpeedController Interface
import SighStakingInterface from '@/contracts/ISighStaking.json'; // SighStaking Interface
import SighTreasuryInterface from '@/contracts/ISighTreasury.json'; // SighTreasury Interface
import SighDistributionHandlerInterface from '@/contracts/ISighDistributionHandler.json'; // SighDistributionHandler Interface

import LendingPool from '@/contracts/LendingPool.json'; // GlobalAddressesProviderContract Interface
import LendingPoolCore from '@/contracts/LendingPoolCore.json'; // GlobalAddressesProviderContract Interface

const getRevertReason = require('eth-revert-reason');

// import { SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION } from "constants";

// import * as qs from 'qs';

Vue.use(Vuex);
Vue.use(NotificationPlugin);
Vue.use(Notifications);

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
// ######################################################
// ############ PROTOCOL CONTRACT ADDRESSES  ############
// ######################################################
    
    GlobalAddressesProviderContractKovan: "0x73CF074FE89E6f942Be3a505B1cD2fe3A4fdb4D7",
    GlobalAddressesProviderContractMainNet: null,
    GlobalAddressesProviderContractBSCTestnet: null,
    GlobalAddressesProviderContractBSC: null,

    SIGHContractAddress: null,                                 // Approve, Transfer, TransferFrom, Allowance,      totalSupply, BalanceOf
    SIGHSpeedControllerAddress: null,                  // Drip
    SIGHStakingContract: null,                          // Stake, Unstake, ClaimAllAccumulatedInstruments
    SIGHTreasuryContract: null,                         // Mainly queries
    SIGHDistributionHandlerAddress: null,              // RefreshSpeeds
    // SIGHFinanceConfiguratorContract: null,
    // SIGHFinanceManager: null,    

    SupportedInstrumentStates: {},                      // CONFIG DATE FOR THE SUPPORTED INSTRUMENTS
    InstrumentContracts: {},                            // ERC20 INSTRUMENTS
    ITokenContracts: {},                                // Redeem, redirectInterestStream, allowInterestRedirectionTo, redirectInterestStreamOf, Approve, 
                                                        // Transfer, TransferFrom, Allowance, claimMySIGH
                                                        // redirectSighStream, allowSighRedirectionTo, redirectSighStreamOf
                                                        // principalBalanceOf, totalSupply, BalanceOf, getRedirectedBalance, getInterestRedirectionAddress, getUserIndex
                                                        // getSighAccured, getSighStreamRedirectedTo, getSupplierIndexes, getBorrowerIndexes
    LendingPoolContract: null,                          // deposit, borrow, repay, swapBorrowRateMode, rebalanceStableBorrowRate, setUserUseInstrumentAsCollateral, liquidationCall
                                                        // getInstruments, getInstrumentData, getUserAccountData, getUserInstrumentData
    LendingPoolCoreContract: null,
    LendingPoolDataProviderContract: null,                      // calculateUserGlobalData, balanceDecreaseAllowed, calculateCollateralNeededInETH, getInstrumentConfigurationData, getUserInstrumentData, getUserAccountData
    // LendingPoolConfiguratorContract: null,
    // LendingPoolMananger: null,

    // ######################################################
    // ############ TO BE WORKED UPON ############
    // ######################################################
    NETWORKS : { '1': 'Main Net', '2': 'Deprecated Morden test network','3': 'Ropsten test network',
      '4': 'Rinkeby test network','42': 'Kovan test network', '1337': 'Tokamak network', '4447': 'Truffle Develop Network','5777': 'Ganache Blockchain',
      '56':'Binance Smart Chain Main Network','97':'Binance Smart Chain Test Network'},
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
    SIGHStakingContract(state) {         
      return state.SIGHStakingContract;    
    },    
    SIGHTreasuryContract(state) {         
      return state.SIGHTreasuryContract;    
    },    
    SIGHDistributionHandler(state) {         
      return state.SIGHDistributionHandlerAddress;    
    },    
    ITokenContracts(state) {         
      return state.ITokenContracts;    
    },    
    LendingPoolContract(state) {         
      return state.LendingPoolContract;    
    },    
    LendingPoolCoreContract(state) {         
      return state.LendingPoolCoreContract;    
    },    
    LendingPoolDataProviderContract(state) {         
      return state.LendingPoolDataProviderContract;    
    },    
    // ######################################################
    // ############ TO BE WORKED UPON ############
    // ######################################################

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
      console.log("networkId MUTATION CALLED IN STORE - " + state.networkId);
    },   
    updateWallet(state,newWallet,newBalance) {
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
      console.log("In updateSIGHContractAddress - " + state.SIGHContractAddress);
    },    
    updateSIGHSpeedControllerAddress(state,newContractAddress) {         
      state.SIGHSpeedControllerAddress = newContractAddress;
      console.log("In updateSIGHSpeedControllerAddress - " + state.SIGHSpeedControllerAddress);
    },    
    updateSIGHStakingContract(state,newContractAddress) {         
      state.SIGHStakingContract = newContractAddress;
      console.log("In updateSIGHStakingContract - " + state.SIGHStakingContract);
    },    
    updateSIGHTreasuryContract(state,newContractAddress) {         
      state.SIGHTreasuryContract = newContractAddress;
      console.log("In updateSIGHTreasuryContract - " + state.SIGHTreasuryContract);
    },    
    updateSIGHDistributionHandlerAddress(state,newContractAddress) {         
      state.SIGHDistributionHandlerAddress = newContractAddress;
      console.log("In updateSIGHDistributionHandlerAddress - " + state.SIGHDistributionHandlerAddress);
    },    
    // LENDING POOL CONTRACTS
    addToSupportedInstrumentStates(state,newITokenAddress,newInstrumentAddress) {         
      let obj = {};
      obj.iTokenAddress = newITokenAddress;
      obj.instrumentAddress = newInstrumentAddress;
      state.SupportedInstrumentStates.push(obj);
      console.log(obj);
      console.log(state.SupportedInstrumentStates);
      console.log("In addToSupportedInstrumentStates ");
    },    
    addToITokenContracts(state,newContractAddress) {         
      state.ITokenContracts.push(newContractAddress);
      console.log("In addToITokenContracts - " + state.ITokenContracts);
    },    
    addToInstrumentContracts(state,newContractAddress) {         
      state.InstrumentContracts.push(newContractAddress);
      console.log("In addToInstrumentContracts - " + state.InstrumentContracts);
    },    
    updateLendingPoolContract(state,newContractAddress) {         
      state.LendingPoolContract = newContractAddress;
      console.log("In updateLendingPoolContract - " + state.LendingPoolContract);
    },    
    updateLendingPoolCoreContract(state,newContractAddress) {         
      state.LendingPoolCoreContract = newContractAddress;
      console.log("In updateLendingPoolCoreContract - " + state.LendingPoolCoreContract);
    },    
    updateLendingPoolDataProviderContract(state,newContractAddress) {         
      state.LendingPoolDataProviderContract = newContractAddress;
      console.log("In updateLendingPoolDataProviderContract - " + state.LendingPoolDataProviderContract);
    },    
    // ######################################################
    // ############ TO BE WORKED UPON ############
    // ######################################################
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

    // CONNECTS TO WEB3 NETWORK (ETHEREUM/BSC ETC)
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
      const accounts = await state.web3.eth.getAccounts();
      console.log(accounts);
      if (accounts) {
        commit('connectedWallet',accounts[0]);
        commit('isWalletConnected',true);  
        let lowercase = accounts[0].toLowerCase();
        console.log( 'LOWER CASE - ' + lowercase );
        store.dispatch('polling'); 
        return accounts[0];
      }
   },

  // UPDATES ACCOUNT AND WALLET WHENEVER THEY CHANGE
   polling: async ({commit,store,state}) => {
    console.log("polling ACTION FUNCTION CALLED IN STORE");
      setInterval(async () => {
        const accounts = await state.web3.eth.getAccounts();
        const account = accounts[0];
        // console.log(account);
        const newBalance_ = await state.web3.eth.getBalance(account);
        // console.log(newBalance_);
        if (account !== state.connectedWallet) {  // ACCOUNT CONNECTED CHANGED. BOTH ACCOUNT AND BALANCE UPDATED 
          commit('updateWallet',account, newBalance_);
          // EventBus.$emit(EventNames.userWalletConnected, { username: walletConnected,}); //User has logged in (event)          
        } 
        else if (newBalance_ !== state.ethBalance) {    // ONLY BALANCE UPDATED WHEN IT IS CHANGED
          commit('updateBalance',newBalance_);
        }
      }, 500);
    },


// ######################################################
// ############ getContractAddresses : calls getAddresses() to fetch and store all the contract addresses based on the network we are connected to (ETHEREUM/BSC) ############
// ############ getAddresses : // fetches and updates all the contract addresses ############
// ############ getSupportedInstrumentConfigAddresses : Gets the addresses of the ITokens and the corresponding Insturments ############
// ######################################################

  // calls getAddresses() to fetch and store all the contract addresses based on the network we are connected to
  getContractAddresses: async ({commit, state}) => {
    console.log("getContractAddresses ACTION FUNCTION CALLED IN STORE");
    if ( state.networkId == '42')  {    // KOVAN 
      return store.dispatch('getAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractKovan });
    }  
    else if (state.networkId == '97') {   // BSC TESTNET
      return store.dispatch('getAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractBSCTestnet });
    }
    else if (state.networkId == '1') {    // ETHEREUM MAINNET
      return store.dispatch('getAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractMainNet });
    }
    else if (state.networkId == '56') {   // BSC MAINNET
      return store.dispatch('getAddresses',{ globalAddressesProviderAddress:  state.GlobalAddressesProviderContractBSC });
    }
  },

  // fetches and updates all the contract addresses
  getAddresses: async ({commit,state},{globalAddressesProviderAddress}) => {

    const currentGlobalAddressesProviderContract = new state.web3.eth.Contract(GlobalAddressesProviderInterface.abi, globalAddressesProviderAddress );
    console.log(currentGlobalAddressesProviderContract);

    if (currentGlobalAddressesProviderContract) {
      const sighAddress = await currentGlobalAddressesProviderContract.methods.getSIGHAddress().call();        
      // console.log( 'sigh - ' + sighAddress); 
      commit('updateSIGHContractAddress',sighAddress);

      const sighSpeedControllerAddress = await currentGlobalAddressesProviderContract.methods.getSIGHSpeedController().call();        
      // console.log( 'sighSpeedControllerAddress - ' + sighSpeedControllerAddress); 
      commit('updateSIGHSpeedControllerAddress',sighSpeedControllerAddress);

      const sighStakingContract = await currentGlobalAddressesProviderContract.methods.getSIGHStaking().call();        
      // console.log( 'sighStakingContract - ' + sighStakingContract); 
      commit('updateSIGHStakingContract',sighStakingContract);
      
      const sighTreasuryAddress = await currentGlobalAddressesProviderContract.methods.getSIGHTreasury().call();        
      // console.log( 'sighTreasuryAddress - ' + sighTreasuryAddress); 
      commit('updateSIGHTreasuryContract',sighTreasuryAddress);

      const sighDistributionHandlerAddress = await currentGlobalAddressesProviderContract.methods.getSIGHMechanismHandler().call();        
      // console.log( 'sighDistributionHandlerAddress - ' + sighDistributionHandlerAddress); 
      commit('updateSIGHDistributionHandlerAddress',sighDistributionHandlerAddress);

      const lendingPoolAddress = await currentGlobalAddressesProviderContract.methods.getLendingPool().call();        
      // console.log( 'lendingPoolAddress - ' + lendingPoolAddress); 
      commit('updateLendingPoolContract',lendingPoolAddress);
  
      const lendingPoolCoreAddress = await currentGlobalAddressesProviderContract.methods.getLendingPoolCore().call();        
      // console.log( 'lendingPoolCoreAddress - ' + lendingPoolCoreAddress); 
      commit('updateLendingPoolCoreContract',lendingPoolCoreAddress);

      const lendingPoolDataProviderAddress = await currentGlobalAddressesProviderContract.methods.getLendingPoolDataProvider().call();        
      // console.log( 'lendingPoolDataProviderAddress - ' + lendingPoolDataProviderAddress); 
      commit('updateLendingPoolDataProviderContract',lendingPoolDataProviderAddress);

      store.dispatch('getSupportedInstrumentConfigAddresses');

      return true;
    }
    else {
      return false;
    }
  },

  // Gets the addresses of the ITokens and the corresponding Insturments
  getSupportedInstrumentConfigAddresses: async ({commit,state}) => { 
    if (state.web3 && state.LendingPoolCoreContract && state.LendingPoolCoreContract != "0x0000000000000000000000000000000000000000") {
      const lendingPoolCoreContract = new state.web3.eth.Contract(LendingPoolCore.abi, state.LendingPoolCoreContract );
      console.log(lendingPoolCoreContract);

      const instruments = await lendingPoolCoreContract.methods.getInstruments().call();        
      console.log("getITokenAddresses ACTION");
      console.log(instruments);

      if (instruments) {
        for (let i=0; i<instruments.length; i++) {
          let iTokenAddress = await lendingPoolCoreContract.methods.getInstrumentITokenAddress(instruments[i]).call();
          commit('addToSupportedInstrumentStates',iTokenAddress,instruments[i]);
          commit('addToITokenContracts',iTokenAddress);
          commit('addToInstrumentContracts',instruments[i]);
        }
      }
      return true;
    }
    else {
      console.log("Contracts have not been currently deployed on this network");
      return false;
    }
  },



// ######################################################
// ############ SIGH ---  SIGH_mintCoins() FUNCTION : mint new Coins when cycle gets completed
// ############ SIGHSPEEDCONTROLLER --- DRIP() FUNCTION 
// ######################################################

    SIGH_mintCoins: async ({commit,state}) => {
      if (state.web3 && SIGHContractAddress && SIGHContractAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighContract = new state.web3.eth.Contract(SIGHInstrument.abi, SIGHContractAddress );
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
        console.log('Contract not deployed');
        return 'Contract not deployed';
      }
    },

    SIGHSpeedController_drip: async ({commit,state}) => {
      if (state.web3 && SIGHSpeedControllerAddress && SIGHSpeedControllerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighSpeedControllerContract = new state.web3.eth.Contract(SighSpeedController.abi, SIGHSpeedControllerAddress );
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
        console.log('Contract not deployed');
        return 'Contract not deployed';
      }
    },

// ######################################################
// ############ SIGHDISTRIBUTIONHANDLER --- REFRESHSIGHSPEEDS() FUNCTION 
// ############ SIGHTREASURY --- BURN() FUNCTION ############
// ######################################################

    SIGHDistributionHandler_refreshSighSpeeds: async ({commit,state}) => {
      if (state.web3 && SIGHDistributionHandlerAddress && SIGHDistributionHandlerAddress!= "0x0000000000000000000000000000000000000000" ) {
        const sighDistributionHandlerContract = new state.web3.eth.Contract(SighDistributionHandlerInterface.abi, SIGHDistributionHandlerAddress );
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
        console.log('Contract not deployed');
        return 'Contract not deployed';
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
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi, '0xbae04cbf96391086dc643e842b517734e214d698' ); //whitePaperModel.address );
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
        const interestRateModel = new web3.eth.Contract(whitePaperInterestRateModel.abi , '0xbae04cbf96391086dc643e842b517734e214d698' ); //whitePaperModel.address );, whitePaperModel.address );
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
        interestRateModel.methods.updateJumpRateModel(baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_).send({from: state.connectedWallet})
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
          sighReservoirContract.methods.beginDripping(dripRate,targetAddress).send({from: state.connectedWallet, gas:3000000})
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
        sighReservoirContract.methods.changeDripRate(dripRate).send({from: state.connectedWallet, gas:3000000})
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
      console.log(state.connectedWallet);
      sighReservoirContract.methods.drip().send({from: state.connectedWallet, gas:3000000})
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
      SIGH_Contract.methods.initMinting().send({from: state.connectedWallet, gas:3000000})
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
      SIGH_Contract.methods.transfer(recepient,amount).send({from: state.connectedWallet})
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
      SIGH_Contract.methods.approve(spender,amount).send({from: state.connectedWallet})
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
      SIGH_Contract.methods.transferFrom(sender,recepient,amount).send({from: state.connectedWallet})
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
      SIGH_Contract.methods.increaseAllowance(spender,addedValue).send({from: state.connectedWallet})
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
      SIGH_Contract.methods.decreaseAllowance(spender,subtractedValue).send({from: state.connectedWallet})
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
      SIGH_Contract.methods.mintCoins().send({from: state.connectedWallet, gas:3000000})
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
      SIGH_Contract.methods.changeReservoir(newReservoir).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.enterMarkets(markets).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.exitMarket(market).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.mintAllowed(market,minter,mintAmount).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.mintVerify(market,minter,actualMintAmount,mintTokens).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.redeemAllowed(market,redeemer,redeemTokens).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.redeemVerify(market,redeemer,actualRedeemAmount,redeemTokens).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.borrowAllowed(market,borrower,borrowAmount).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.borrowVerify(market,borrower,borrowAmount).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.repayBorrowAllowed(market,payer,borrower,repayAmount).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.repayBorrowVerify(market,payer,borrower,actualRepayAmount,borrowerIndex).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.liquidateBorrowAllowed(marketBorrowed,marketCollateral,liquidator,borrower,repayAmount).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.liquidateBorrowVerify(marketBorrowed,marketCollateral,liquidator,borrower,repayAmount,seizeTokens).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.seizeAllowed(marketCollateral,marketBorrowed,liquidator,borrower,seizeTokens ).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.seizeVerify(marketCollateral,marketBorrowed,liquidator,borrower,seizeTokens ).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.transferAllowed(market,src,dst,transferTokens).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.transferVerify(market,src,dst,transferTokens).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setPriceOracle(newPriceOracle).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setCloseFactor(newCloseFactorMantissa).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setCollateralFactor(market,  newCollateralFactorMantissa).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setMaxAssets(newMaxAssets).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setLiquidationIncentive(newLiquidationIncentiveMantissa).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._supportMarket(supportMarket).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setPauseGuardian(newPauseGuardian).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setMintPaused( market, boolstate).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setBorrowPaused(market, boolstate).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setTransferPaused(boolstate).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setSeizePaused(boolstate).send({from: state.connectedWallet})
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
    const Sightroller_ = Sightroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, '0x0950A0d41A9B30f490BC6Cc9F30232202Ff60032');
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._become(unitroller).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.refreshGsighSpeeds().send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.claimGSigh(holder, markets).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods.claimGSigh(holders,markets,borrowers,suppliers).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._setGsighRate(gsighRate_).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._addGsighMarkets(markets).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      SIGHTROLLER_Contract.methods._dropGsighMarket(market).send({from: state.connectedWallet})
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
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    const Unitroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Unitroller_);
    if (Unitroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Unitroller_.address);
      console.log(SIGHTROLLER_Contract);
      const ret =  SIGHTROLLER_Contract.methods.getBlockNumber().call();
      console.log(ret);
    }
  },

  // transferTokens (The number of cTokens to transfer)
  sightroller__getGSighAddress: async ({commit,state} ) => {
    const web3 = state.web3;
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
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
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._setPendingImplementation(newPendingImplementation).send({from: state.connectedWallet})
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
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._acceptImplementation().send({from: state.connectedWallet})
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
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._setPendingAdmin(newPendingAdmin).send({from: state.connectedWallet})
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
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      UNITROLLER_Contract.methods._acceptAdmin().send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
    }
  },

  // Accepts transfer of admin rights. msg.sender must be pendingAdmin
  unitroller_getAdmin: async ({commit,state}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      let ret = UNITROLLER_Contract.methods.admin().call();
      console.log(ret);
    }
  },

  // Accepts transfer of admin rights. msg.sender must be pendingAdmin
  unitroller_getPendingSightrollerImplementation: async ({commit,state}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      let ret = UNITROLLER_Contract.methods.pendingSightrollerImplementation().call();
      console.log(ret);
    }
  },  

  // Accepts transfer of admin rights. msg.sender must be pendingAdmin
  unitroller_getSightrollerImplementation: async ({commit,state}) => {
    const web3 = state.web3;
    const Unitroller_ = Unitroller.networks[state.networkId];
    console.log(Unitroller_);
    if (Unitroller_) {
      let UNITROLLER_Contract = new web3.eth.Contract(Unitroller.abi, Unitroller_.address);
      console.log(UNITROLLER_Contract);
      let ret = UNITROLLER_Contract.methods.sightrollerImplementation().call();
      console.log(ret);      
    }
  },
  
  // transferTokens (The number of cTokens to transfer)
  sightroller_getPriceOracle: async ({commit,state}) => {
    const web3 = state.web3;
    const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Sightroller_);
    if (Sightroller_) {
      let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
      console.log(SIGHTROLLER_Contract);
      let error = SIGHTROLLER_Contract.methods.oracle().call(); 
        console.log(error);
    }
  },

    // getUnderlyingPriceFromoracle 
    sightroller_getUnderlyingPriceFromOracle: async ({commit,state},{cToken}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let error = SIGHTROLLER_Contract.methods.getUnderlyingPriceFromoracle(cToken).call(); 
          console.log(error);
      }
    },
  
    // gsighRate (The number of cTokens to transfer)
    sightroller_getGSighRate: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let error = SIGHTROLLER_Contract.methods.gsighRate().call(); 
          console.log(error);
      }
    }, 
    
    sightroller_getSighAddress: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let error = SIGHTROLLER_Contract.methods.getSighAddress().call(); 
          console.log(error);
      }
    }, 

    sightroller_getAdmin: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let error = SIGHTROLLER_Contract.methods.admin().call(); 
          console.log(error);
      }
    },

    sightroller_getSIGHSpeed: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let SIGHRate_ = SIGHTROLLER_Contract.methods.SIGHRate().call(); 
          console.log(SIGHRate_);
      }
    },

    sightroller_getSIGHSpeedForMarket: async ({commit,state},{market}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let SIGHRate_ = SIGHTROLLER_Contract.methods.SIGH_Speeds(market).call(); 
          console.log(SIGHRate_);
      }
    },    

    sightroller_addSIGHMarket: async ({commit,state},{market}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        SIGHTROLLER_Contract.methods._addSIGHMarket(market).send({from: state.connectedWallet})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
    },

    sightroller_dropSIGHMarket: async ({commit,state},{market}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        SIGHTROLLER_Contract.methods._dropSIGHMarket(market).send({from: state.connectedWallet})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
    },

    sightroller_takeSIGHPriceSnapshot: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        SIGHTROLLER_Contract.methods.takeSIGHPriceSnapshot().send({from: state.connectedWallet})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
    },

    sightroller_refreshSIGHSpeeds: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        SIGHTROLLER_Contract.methods.refreshSIGHSpeeds().send({from: state.connectedWallet})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
    },

    sightroller_claimSIGH: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        SIGHTROLLER_Contract.methods.claimSIGH().send({from: state.connectedWallet})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
    },

    sightroller_setGelatoAddress: async ({commit,state},{gelato}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        SIGHTROLLER_Contract.methods.setGelatoAddress(gelato).send({from: state.connectedWallet})
        .then(receipt => {
          console.log(receipt);
        })
        .catch(error => {
          console.log(error);
        });
      }
    },

    sightroller_getGelatoAddress: async ({commit,state}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let ret = SIGHTROLLER_Contract.methods.getGelatoAddress().call();
        console.log(ret);
      } 
    },

    sightroller_setSIGHRate: async ({commit,state},{sighRate}) => {
      const web3 = state.web3;
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
        let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
        console.log(SIGHTROLLER_Contract);
        let ret = SIGHTROLLER_Contract.methods.setSIGHRate(sighRate).send({from: state.connectedWallet})
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
      GSigh_Contract.methods.approve(gsigh_spender, gsigh_amount).send({from: state.connectedWallet})
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
      GSigh_Contract.methods.transfer(gsigh_destination, gsigh_amount).send({from: state.connectedWallet})
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
      GSigh_Contract.methods.transferFrom(gsigh_source,gsigh_destination, gsigh_amount).send({from: state.connectedWallet})
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
      GSigh_Contract.methods.delegate(delegatee).send({from: state.connectedWallet})
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
  //     GSigh_Contract.methods.delegateBySig(delegatee).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.propose(p_targets,p_values,p_signatures,p_calldatas,p_description).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.queue(proposalId).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.execute(proposalId).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.cancel(proposalId).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.castVote(proposalId,bool_support).send({from: state.connectedWallet})
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
  //     const ret = GovernorAlpha_Contract.methods.castVoteBySig(proposalId,bool_support).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.__acceptAdmin().send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.__abdicate().send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.__queueSetTimelockPendingAdmin({gov_newPendingAdmin,gov_eta}).send({from: state.connectedWallet})
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
      const ret = GovernorAlpha_Contract.methods.__executeSetTimelockPendingAdmin({gov_newPendingAdmin,gov_eta}).send({from: state.connectedWallet})
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
      const ret = Timelock_Contract.methods.setDelay({timelock_delay_}).send({from: state.connectedWallet})
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
        const ret = Timelock_Contract.methods.setPendingAdmin({timelock_pendingAdmin_}).send({from: state.connectedWallet})
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
      const ret = Timelock_Contract.methods.acceptAdmin().send({from: state.connectedWallet})
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
      const ret = Timelock_Contract.methods.queueTransaction({timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta}).send({from: state.connectedWallet})
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
      const ret = Timelock_Contract.methods.cancelTransaction({timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta}).send({from: state.connectedWallet})
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
      const ret = Timelock_Contract.methods.executeTransaction({timelock_target,timelock_value,timelock_signature,timelock_data,timelock_eta}).send({from: state.connectedWallet,value: EthValueInWei})
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
        GSighReservoir_Contract.methods.beginDripping(gsigh_dripRate_, gsigh_target_).send({from: state.connectedWallet, gas:3000000})
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
        GSighReservoir_Contract.methods.changeDripRate(gsigh_dripRate_).send({from: state.connectedWallet})
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
        GSighReservoir_Contract.methods.drip().send({from: state.connectedWallet, gas:3000000})
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
      const ret = SighLens_Contract.methods.cTokenMetadata(cTokenAddress).send({from: state.connectedWallet})
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
      const ret = SighLens_Contract.methods.cTokenMetadataAll(cTokenAddressArray).send({from: state.connectedWallet})
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
      const ret = SighLens_Contract.methods.cTokenBalances(cTokenAddress, sighlens_amount).send({from: state.connectedWallet})
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
      const ret = SighLens_Contract.methods.cTokenBalancesAll(cTokenAddressArray, sighlens_amount).send({from: state.connectedWallet})
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
      const ret = SighLens_Contract.methods.cTokenUnderlyingPrice(cTokenAddress).send({from: state.connectedWallet})
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
      const ret = SighLens_Contract.methods.cTokenUnderlyingPriceAll(cTokenAddressArray).send({from: state.connectedWallet})
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
      const ret = SighLens_Contract.methods.getAccountLimits(sighlens_sightroller,sighlens_account).send({from: state.connectedWallet})
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
      SighLens_Contract.methods.getGovReceipts( sighlens_governor, sighlens_account, sighlens_proposalIds ).call();
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
      SighLens_Contract.methods.getGovProposals(  sighlens_governor, sighlens_proposalIds ).call();
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
      SighLens_Contract.methods.getGSighBalanceMetadata(  sighlens_gsigh_address, sighlens_account ).call();
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
      SighLens_Contract.methods.getGSighVotes( sighlens_gsigh_address, sighlens_account, sighlens_blockNumbers ).call();
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
      const ret = SighLens_Contract.methods.getGSighBalanceMetadataExt( sighlens_gsigh_address, sighlens_sightroller, sighlens_account ).send({from: state.connectedWallet})
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
  cERC20_initialize: async ({commit,state},{ MarketAddress, cer20_underlying, cer20_sightroller , cer20_interestRateModel_, cer20_initialExchangeRateMantissa,cer20_name, cer20_symbol, cer20_decimals  } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.initialize( cer20_underlying, cer20_sightroller, cer20_interestRateModel_, cer20_initialExchangeRateMantissa,cer20_name, cer20_symbol, cer20_decimals ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> Sender supplies assets into the market and receives cTokens in exchange
  cERC20_mint: async ({commit,state},{ MarketAddress, cer20_mintAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.mint(  Web3.utils.toWei(cer20_mintAmount.toString(), 'ether')   ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  }, 

  // --> Sender redeems cTokens in exchange for the underlying asset
  cERC20_redeem: async ({commit,state},{MarketAddress, cer20_redeemTokens } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.redeem( Web3.utils.toWei(cer20_redeemTokens.toString(), 'ether')  ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },   

  // --> Sender redeems cTokens in exchange for a specified amount of underlying asset
  cERC20_redeemUnderlying: async ({commit,state},{ MarketAddress, cer20_redeemAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.redeemUnderlying( cer20_redeemAmount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Sender borrows assets from the protocol to their own address
  cERC20_borrow: async ({commit,state},{ MarketAddress, cer20_borrowAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrow( cer20_borrowAmount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },


  // --> Sender repays their own borrow
  cERC20_repayBorrow: async ({commit,state},{ MarketAddress,  cer20_repayAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.repayBorrow(  Web3.utils.toWei(cer20_repayAmount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Sender repays a borrow belonging to borrower
  cERC20_repayBorrowBehalf: async ({commit,state},{ MarketAddress, cer20_borrower, cer20_repayAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.repayBorrowBehalf(  cer20_borrower, cer20_repayAmount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> The sender liquidates the borrowers collateral.
  cERC20_liquidateBorrow: async ({commit,state},{ MarketAddress, cer20_borrower,  cer20_repayAmount, cer20_cTokenCollateral  } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.liquidateBorrow( cer20_borrower,  cer20_repayAmount, cer20_cTokenCollateral ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> The sender liquidates the borrowers collateral.
  cERC20_addReserves: async ({commit,state},{MarketAddress,  cer20_addAmount} ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._addReserves( cer20_addAmount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Transfer `amount` tokens from `msg.sender` to `dst`
  cERC20_transfer: async ({commit,state},{MarketAddress, cer20_dst, cer20_amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.transfer( cer20_dst, cer20_amount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Transfer `amount` tokens from `src` to `dst`
  cERC20_transferFrom: async ({commit,state},{MarketAddress, cer20_src, cer20_dst, cer20_amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.transferFrom( cer20_src, cer20_dst, cer20_amount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Approve `spender` to transfer up to `amount` from `src`
  cERC20_approve: async ({commit,state},{ MarketAddress, cer20_spender, cer20_amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.approve( cer20_spender, cer20_amount ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Get the underlying balance of the `owner`
  cERC20_balanceOfUnderlying: async ({commit,state},{ MarketAddress, cer20_owner } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.balanceOfUnderlying( cer20_owner ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Returns the current total borrows plus accrued interest for the Market
  cERC20_totalBorrowsCurrent: async ({commit,state},{MarketAddress} ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.totalBorrowsCurrent().send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Accrue interest to updated borrowIndex and then calculate account's borrow balance using the updated borrowIndex
  cERC20_borrowBalanceCurrent: async ({commit,state}, {MarketAddress, cer20_account } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrowBalanceCurrent(cer20_account).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Accrue interest then return the up-to-date exchange rate
  cERC20_exchangeRateCurrent: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.exchangeRateCurrent().send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Applies accrued interest to total borrows and reserves
  cERC20_accrueInterest: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.accrueInterest().send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  Get the current allowance from `owner` for `spender`
  cERC20_allowance: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.allowance().call();
      console.log(ret);
    }
  },

  // -->  Get the token balance of the `owner`
  cERC20_balanceOf: async ({commit,state},{MarketAddress, cer20_owner}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.balanceOf(cer20_owner).call();
      console.log(ret);
    }
  },

  // -->  Get the token balance of the `owner`
  cERC20_getAccountSnapshot: async ({commit,state},{MarketAddress, cer20_account}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.getAccountSnapshot(cer20_account).call();
      console.log(ret);
    }
  },

  // -->  Returns the current per-block borrow interest rate for this cToken
  cERC20_borrowRatePerBlock: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrowRatePerBlock().call();
      console.log(ret);
    }
  },

  // -->  Returns the current per-block supply interest rate for this cToken
  cERC20_supplyRatePerBlock: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.supplyRatePerBlock().call();
      console.log(ret);
    }
  },

  // -->  Returns the current per-block supply interest rate for this cToken
  cERC20_borrowBalanceStored: async ({commit,state},{MarketAddress, cer20_account}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrowBalanceStored(cer20_account).call();
      console.log(ret);
    }
  },

  // -->  Calculates the exchange rate from the underlying to the CToken.
  // This function does not accrue interest before calculating the exchange rate
  cERC20_exchangeRateStored: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.exchangeRateStored().call();
      console.log(ret);
    }
  },

  // Get cash balance of this cToken in the underlying asset
  cERC20_getCash: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.getCash().call();
      console.log(ret);
    }
  },

  // --> Transfers collateral tokens (this market) to the liquidator.
  cERC20_seize: async ({commit,state}, { MarketAddress, cerc20_liquidator, cerc20_borrower, cerc20_seizeTokens  }) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.seize(cerc20_liquidator, cerc20_borrower, cerc20_seizeTokens ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
  cERC20_setPendingAdmin: async ({commit,state}, { MarketAddress, cerc20_newPendingAdmin}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setPendingAdmin( cerc20_newPendingAdmin ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Accepts transfer of admin rights. msg.sender must be pendingAdmin
  cERC20_acceptAdmin: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._acceptAdmin().send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> Sets a new sightroller for the market
  cERC20_setSightroller: async ({commit,state}, {MarketAddress, cerc20_newSightroller}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setSightroller(cerc20_newSightroller).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // --> accrues interest and sets a new reserve factor for the protocol using _setReserveFactorFresh
  cERC20_setReserveFactor: async ({commit,state}, {MarketAddress, cerc20_newReserveFactorMantissa}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setReserveFactor(cerc20_newReserveFactorMantissa).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  Accrues interest and reduces reserves by transferring to admin
  cERC20_reduceReserves: async ({commit,state}, {MarketAddress, cerc20_reduceAmount}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._reduceReserves(cerc20_reduceAmount).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  accrues interest and updates the interest rate model using _setInterestRateModelFresh
  cERC20_setInterestRateModel: async ({commit,state}, {MarketAddress, cerc20_newInterestRateModel}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods._setInterestRateModel(cerc20_newInterestRateModel).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      })
    }
  },

  // -->  accrues interest and updates the interest rate model using _setInterestRateModelFresh
  cERC20_getSightroller: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.sightroller().call();
      console.log(ret);
    }
  },

  cERC20_getName: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.name().call();
      console.log(ret);
    }
  },  

  cERC20_getSymbol: async ({commit,state},{MarketAddress}) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.symbol().call();
      console.log(ret);
    }
  },

    cERC20_getAdmin: async ({commit,state},{MarketAddress}) => {
      const web3 = state.web3;
      const CErc20_ = CErc20.networks[state.networkId];
      console.log(CErc20_);
      if (CErc20_) {
        let CErc20_Contract = new web3.eth.Contract(CErc20.abi, MarketAddress);
        console.log(CErc20_Contract);
        const ret = CErc20_Contract.methods.admin().call();
        console.log(ret);
      }
  },  

// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************
// *********** ADDITIONAL UTILITY FUNCTIONS *******************



SimplePriceOracle_getUnderlyingPrice: async ({commit,state},{Market_Address}) => {
  const web3 = state.web3;
  const PriceOracle_ = SimplePriceOracle.networks[state.networkId];
  console.log(PriceOracle_);
  if (PriceOracle_) {
    let PriceOracle__Contract = new web3.eth.Contract(SimplePriceOracle.abi, PriceOracle_.address);
    console.log(PriceOracle__Contract);
    const ret = PriceOracle__Contract.methods.getUnderlyingPrice(Market_Address).call();
    console.log(ret);
  }
}, 


Approve_the_transfer_by_Sightroller: async ({commit,state}) => {
  const web3 = state.web3;
  // const ERC20Token = SimplePriceOracle.networks[state.networkId];
  // console.log(PriceOracle_);
  // if (PriceOracle_) {
    let erc20TokenAddress = '0x76Ff68033ef96ee0727f85eA1f979B1b0FD4C75b'; //SIGH
    let Erc20__Contract = new web3.eth.Contract(EIP20NonStandardInterface.abi, erc20TokenAddress );
    console.log(Erc20__Contract);
    Erc20__Contract.methods.approve('0x2414607d3ef95f4730758e7316ad100B9A5084A1', Web3.utils.toWei('1000000000', 'ether') ).send({from: state.connectedWallet}) //SIGH-MARKET
      .then(receipt => {
        console.log(receipt);
      })
      .catch(error => {
        console.log(error);
      });
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



    // --> Approve `spender` to transfer up to `amount` from `src`
  Market_approve: async ({commit,state},{ contractAddress, sender, amount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, contractAddress );
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.approve( sender, Web3.utils.toWei(amount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
        return receipt;        
      })
      .catch(error => {
        console.log(error);
        return error;        
      })
    }
  },

  // --> Sender supplies assets into the market and receives cTokens in exchange
  market_mint: async ({commit,state},{ marketId , mintAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract( CErc20.abi, marketId );
      console.log(CErc20_Contract);
      console.log(mintAmount.toString(), 'ether');
      console.log(mintAmount.toString(), 'ether');
      console.log(mintAmount.toString(), 'ether');
      const ret = CErc20_Contract.methods.mint( Web3.utils.toWei(mintAmount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
        return receipt;        
      })
      .catch(error => {
        console.log(error);
        return error;        
      })
    }
  }, 

  market_Borrow: async ({commit,state},{ marketId , BorrowAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract( CErc20.abi, marketId );
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.borrow( Web3.utils.toWei(BorrowAmount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
        return receipt;        
      })
      .catch(error => {
        console.log(error);
        return error;        
      })
    }
  }, 
  
  market_Repay_Borrow: async ({commit,state},{ marketId , RepayBorrowAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract( CErc20.abi, marketId );
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.repayBorrow( Web3.utils.toWei(RepayBorrowAmount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
        return receipt;        
      })
      .catch(error => {
        console.log(error);
        return error;        
      })
    }
  }, 

  market_RedeemUnderlying: async ({commit,state},{ marketId , RedeemAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract( CErc20.abi, marketId );
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.redeemUnderlying( Web3.utils.toWei(RedeemAmount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
        return receipt;        
      })
      .catch(error => {
        console.log(error);
        return error;        
      })
    }
  }, 

  market_Redeem: async ({commit,state},{ marketId , RedeemAmount } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract( CErc20.abi, marketId );
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.redeem( Web3.utils.toWei(RedeemAmount.toString(), 'ether') ).send({from: state.connectedWallet})
      .then(receipt => {
        console.log(receipt);
        return receipt;        
      })
      .catch(error => {
        console.log(error);
        return error;        
      })
    }
  },     

  marketIsSupported: async ( {commit,state},{ marketID } ) => {
    const web3 = state.web3;

    if (state.supportedMarkets == [] ) {
      const Sightroller_ = Unitroller.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
      console.log(Sightroller_);
      if (Sightroller_) {
          let SIGHTROLLER_Contract = new web3.eth.Contract(Sightroller.abi, Sightroller_.address);
          console.log(SIGHTROLLER_Contract);
          let ret = SIGHTROLLER_Contract.methods.allMarkets().call();
          console.log(ret);
          commit('SET_SUPPORTED_MARKETS',ret);        
      }
    }
    console.log(state.supportedMarkets);

    if ( state.supportedMarkets.includes(marketID) ) {     // if the market is supported
      return true;
    }

    return false;
  },     


  marketIsApproved: async ( {commit,state},{ underlyingAddress , sender } ) => {
    const web3 = state.web3;
    const CErc20_ = CErc20.networks[state.networkId];
    console.log(CErc20_);
    if (CErc20_) {
      let CErc20_Contract = new web3.eth.Contract(CErc20.abi, underlyingAddress );
      console.log(CErc20_Contract);
      const ret = CErc20_Contract.methods.allowance( state.connectedWallet, sender).call();
      console.log(ret);
      if ( Number(ret) > 0 ) {     // if the market is supported
        return true;
      }
    }
    return false;
  }, 


  treasuryTokenSwapAPICall: async ( {commit, state}, {sellTokenAddress, buyTokenAddress, sellAmount_, buyAmount_ } ) => {

    let API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
    const createQueryString = input => encodeURI( Object.entries(input).map(([name, value]) => `${name}=${value}`).join('&') );
    let qs_;
    // console.log('the sell amount is - ' + sellAmount_);

    if (buyAmount_ != undefined) {
      console.log('in buy amount');
      qs_ = createQueryString({ sellToken: sellTokenAddress,  buyToken: buyTokenAddress, buyAmount:buyAmount_.toString() });
    }
    if (sellAmount_ != undefined) {
      console.log('in sell amount');
      qs_ = createQueryString({ sellToken: sellTokenAddress,  buyToken: buyTokenAddress, sellAmount: sellAmount_.toString(), });
      }

      console.log(qs_);
      const quoteUrl = API_QUOTE_URL + '?' + qs_; 
      console.log(quoteUrl);
      const response = await fetch(quoteUrl);
      console.log(response);
      const quote = await response.json();
      console.log(quote);
      return quote;
   },


  treasuryTokenSwapTrade: async ( {commit, state}, {allowanceTarget,to,callDataHex,token_bought,token_sold,sellAmount,gasPrice_} ) => {

    const Treasury_ = Treasury.networks[state.networkId];  // Unitroller STORAGE CONTRACT (ADDRESS of Unitroller, ABI of Sightroller)
    console.log(Treasury_);
    if (Treasury_) {
        let Treasury__Contract = new web3.eth.Contract(Treasury.abi, Treasury_.address);
        console.log(Treasury__Contract);
        try {
          let txHash = Treasury__Contract.methods.swapTokensUsingOxAPI(allowanceTarget,to,callDataHex,token_bought,token_sold,sellAmount).sendTransactionAsync({ from:  state.connectedWallet, value: quote.value, gasPrice: gasPrice_});
          console.log(txHash);
        } 
        catch (e) {
          console.log(e)
        }
    }
  },

//   export const baseUnitAmount = (unitAmount: number, decimals = 18): BigNumber => {
//     return Web3Wrapper.toBaseUnitAmount(new BigNumber(unitAmount), decimals);
// };

  
  










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
