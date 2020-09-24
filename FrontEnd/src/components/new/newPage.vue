<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'FOK-Limit-Order',
  data() {
    return {
      // ETH Transfer
      ethRecepientAddress : undefined,
      ethAmount: undefined,

      // InterestRateVariables
        baseRatePerYear: undefined,
        multiplierPerYear: undefined,
        jumpMultiplierPerYear: undefined,
        kink_: undefined,
        cash: undefined,
        borrows: undefined,
        reserves: undefined,
        reserveMantissa: undefined,

        // SIGH Reservoir Variables
        dripRate: undefined,
        targetAddress: undefined,

        // SIGH Token Variables
        recepient: undefined,
        amount: undefined,
        spender: undefined,
        sender: undefined,
        addedValue: undefined,
        subtractedValue: undefined,
        newReservoir: undefined,

        // SIGHTROLLER Variables
        account: undefined,
        token: undefined,
        markets: [],
        market: undefined,
        minter: undefined,
        mintAmount: undefined,
        amount: undefined,
        actualMintAmount: undefined,
        mintTokens: undefined,
        redeemer: undefined,
        redeemTokens: undefined,
        actualRedeemAmount: undefined,
        borrower: undefined,
        borrowAmount: undefined,
        payer: undefined,
        repayAmount: undefined,
        actualRepayAmount: undefined,
        borrowerIndex: undefined,
        marketBorrowed: undefined,
        marketCollateral: undefined,
        liquidator: undefined,
        seizeTokens: undefined,
        src: undefined,
        dst: undefined,
        transferTokens: undefined,
        newPriceOracle: undefined,
        newCloseFactorMantissa: undefined,
        newCollateralFactorMantissa: undefined,
        newMaxAssets: undefined,
        newLiquidationIncentiveMantissa: undefined,
        supportMarket: undefined,
        newPauseGuardian: undefined,
        boolstate: undefined,
        unitroller: undefined,
        holder: undefined,
        borrowers: undefined,                        
        gsighRate_: undefined,   

        // UNITROLLER Variables
        newPendingImplementation : undefined,
        newPendingAdmin : undefined,

        // GSIGH TOKEN Variables
        gsigh_holder : undefined,
        gsigh_spender : undefined,
        gsigh_amount : undefined,
        gsigh_destination : undefined,
        gsigh_source : undefined,
        delegatee : undefined,
        gsigh_blockNumber : undefined,

        // GOVERNOR ALPHA Variables
        p_targets : undefined,
        p_values : undefined,
        p_signatures : undefined,
        p_calldatas : undefined,
        p_description : undefined,
        proposalId : undefined,
        bool_support : undefined,
        gov_newPendingAdmin : undefined,
        gov_eta : undefined,

        // TIMELOCK Variables
        timelock_delay_ : undefined,
        timelock_pendingAdmin_ : undefined,
        timelock_target : undefined,
        timelock_value : undefined,
        timelock_signature : undefined,
        timelock_data : undefined,
        timelock_eta : undefined,
        timeLock_EthValueInWei : undefined,

        // GSIGH RESERVOIR Variables
        gsigh_dripRate_ : undefined,
        gsigh_target_ : undefined,

        // SIGHLENS Variables
        cTokenAddress : undefined,
        cTokenAddressArray : undefined,
        sighlens_amount : undefined,
        sighlens_sightroller : undefined,
        sighlens_account : undefined,
        sighlens_governor : undefined,
        sighlens_proposalIds : undefined,
        sighlens_gsigh_address : undefined,
        sighlens_blockNumbers : undefined,

        // cERC20 Variables
        cer20_underlying : undefined,
        cer20_sightroller : undefined,
        cer20_interestRateModel_ : undefined,
        cer20_initialExchangeRateMantissa : undefined,
        cer20_name : undefined,
        cer20_symbol : undefined,
        cer20_decimals : undefined,
        cer20_mintAmount : undefined,
        cer20_redeemTokens : undefined,
        cer20_redeemAmount : undefined,
        cer20_borrowAmount : undefined,
        cer20_borrower : undefined,
        cer20_repayAmount : undefined,
        cer20_cTokenCollateral : undefined,
        cer20_addAmount : undefined,
        cer20_src : undefined,
        cer20_dst : undefined,
        cer20_amount : undefined,
        cer20_spender : undefined,
        cer20_owner : undefined,
        cer20_account : undefined,
        cerc20_liquidator : undefined,
        cerc20_seizeTokens: undefined,
        cerc20_newPendingAdmin: undefined,
        cerc20_newSightroller: undefined,
        cerc20_newReserveFactorMantissa: undefined,
        cerc20_reduceAmount: undefined,
        cerc20_newInterestRateModel: undefined,

        // For Revert Reason Function
        blockNumber_ : undefined,
        txhash : undefined,

        Market_Address : undefined,




      showLoader: false,
      statusCode: 'operational',
      watcher: '',
    };
  },

  // watch: {
  //   formData: {
  //     handler: function() {
  //       this.getStatus();   //getting status for exchange ()
  //     },
  //     deep: true,
  //   },
  // },



  methods: {

    ...mapActions(['getETHBalance','sendEthereumFunction',

      'whitePaperModelChangeBaseParamters','whitePaperModelUtilRate','whitePaperModelBorrowRate','whitePaperModelSupplyRate',
    'whitePaperModelgetBaseRatePerBlock','whitePaperModelgetMultiplierPerBlock','jumpV2ModelChangeBaseParamters', 'jumpV2ModelUtilRate', 
    'jumpV2ModelBorrowRate', 'jumpV2ModelSupplyRate', 'jumpV2ModelgetBaseRatePerBlock', 'jumpV2ModelgetMultiplierPerBlock',
    'jumpV2ModelgetJumpMultiplierPerBlock','jumpV2ModelgetKink'         
    ,        'sighReservoirBeginDripping','sighReservoirChangeDripRate', 
     'sighReservoirDrip','sighReservoirGetSighTokenAddress','sighReservoirgetTargetAddress','sighReservoirgetDripStart','sighReservoirgetdripRate'
     , 'sighReservoirgetlastDripBlockNumber','sighReservoirgetRecentlyDrippedAmount','sighReservoirgetadmin','sighReservoirgetTotalDrippedAmount',
     
     'sighInitMinting','sightransfer','sighapprove','sightransferFrom','sighincreaseAllowance','sighdecreaseAllowance','sighMintCoins',
     'sighchangeReservoir','sighgetRecentyMintedAmount','sighgetRecentMinter','sighgetCurrentCycle','sighgetCurrentEra','sighgetallowance',
     'sighgetbalanceOf','sigh_getTotalSupply','sighIsMintingActivated','sighgetStart_Time','sighgetdecimals','sighgetsymbol','sighgetname',
     
     'sightroller_getAssetsIn','sightroller_checkMembership','sightroller_enterMarkets','sightroller_exitMarket','sightroller_mintAllowed',
     'sightroller_mintVerify','sightroller_redeemAllowed','sightroller_redeemVerify','sightroller_borrowAllowed','sightroller_borrowVerify',
     'sightroller_repayBorrowAllowed','sightroller_repayBorrowVerify','sightroller_liquidateBorrowAllowed','sightroller_liquidateBorrowVerify',
     'sightroller_seizeAllowed','sightroller_seizeVerify','sightroller_transferAllowed','sightroller_transferVerify','sightroller_getAccountLiquidity',
     'sightroller_getHypotheticalAccountLiquidity','sightroller_liquidateCalculateSeizeTokens','sightroller_setPriceOracle','sightroller_setCloseFactor',
     'sightroller_setCollateralFactor','sightroller_setMaxAssets','sightroller_setLiquidationIncentive','sightroller_supportMarket','sightroller_setPauseGuardian',
     'sightroller_setMintPaused','sightroller_setBorrowPaused','sightroller_setTransferPaused','sightroller_setSeizePaused','sightroller__become','sightroller_refreshGsighSpeeds',
     'sightroller_claimGSigh','sightroller_claimGSigh_bs','sightroller_setGsighRate','sightroller__addGsighMarkets','sightroller__dropGsighMarket','sightroller__getAllMarkets',
     'sightroller__getBlockNumber','sightroller__getGSighAddress','sightroller_getUnderlyingPriceFromOracle','sightroller_getGSighRate','sightroller_getSighAddress',

      'unitroller___setPendingImplementation','unitroller_acceptImplementation','unitroller_setPendingAdmin','unitroller_acceptAdmin','unitroller_getAdmin','unitroller_getPendingSightrollerImplementation',
      'unitroller_getSightrollerImplementation',

     'gsigh_allowance','gsigh_balanceOf','gsigh_approve','gsigh_transfer','gsigh_transferFrom','gsigh_delegate','gsigh_getCurrentVotes','gsigh_getPriorVotes',

      'governorAlpha_quorumVotes','governorAlpha_proposalThreshold','governorAlpha_proposalMaxOperations','governorAlpha_votingDelay','governorAlpha_votingPeriod',
      'governorAlpha_proposalCount','governorAlpha_propose','governorAlpha_queue','governorAlpha_execute','governorAlpha_cancel','governorAlpha_castVote','governorAlpha_getActions',
      'governorAlpha_getReceipt','governorAlpha_state','governorAlpha__acceptAdmin','governorAlpha__abdicate','governorAlpha__queueSetTimelockPendingAdmin','governorAlpha__executeSetTimelockPendingAdmin',

      'Timelock__setDelay','Timelock__setPendingAdmin','Timelock__acceptAdmin','Timelock__queueTransaction','Timelock__cancelTransaction','Timelock__executeTransaction',

      'GSighReservoir_beginDripping','GSighReservoir_changeDripRate','GSighReservoir_drip','GSighReservoir_getGSighAddress','GSighReservoir_getTargetAddress','GSighReservoir_lastDripBlockNumber',
      'GSighReservoir_totalDrippedAmount','GSighReservoir_recentlyDrippedAmount','GSighReservoir_dripRate','GSighReservoir_dripStart','GSighReservoir_admin',

      'SighLens_cTokenMetadata','SighLens_cTokenMetadataAll','SighLens_cTokenBalances','SighLens_cTokenBalancesAll','SighLens_cTokenUnderlyingPrice','SighLens_cTokenUnderlyingPriceAll',
      'SighLens_getAccountLimits','SighLens_getGovReceipts','SighLens_getGovProposals','SighLens_getGSighBalanceMetadata','SighLens_getGSighVotes','SighLens_getGSighBalanceMetadataExt',

      'cERC20_initialize','cERC20_mint','cERC20_redeem','cERC20_redeemUnderlying','cERC20_borrow','cERC20_repayBorrow','cERC20_repayBorrowBehalf','cERC20_liquidateBorrow','cERC20_addReserves','cERC20_transfer',
      'cERC20_transferFrom','cERC20_approve','cERC20_balanceOfUnderlying','cERC20_totalBorrowsCurrent','cERC20_borrowBalanceCurrent','cERC20_exchangeRateCurrent','cERC20_accrueInterest','cERC20_allowance',
      'cERC20_balanceOf','cERC20_getAccountSnapshot','cERC20_borrowRatePerBlock','cERC20_supplyRatePerBlock','cERC20_borrowBalanceStored','cERC20_exchangeRateStored','cERC20_getCash','cERC20_seize','cERC20_setPendingAdmin',
      'cERC20_acceptAdmin','cERC20_setSightroller','cERC20_setReserveFactor','cERC20_reduceReserves','cERC20_setInterestRateModel','cERC20_getSightroller','cERC20_getName','cERC20_getSymbol',


      'getRevertReason', 'SimplePriceOracle_getUnderlyingPrice'
     ]),

    // **********************
    // EHTEREUM RELATED FUNCTIONS
    // **********************    
    async ethRelated(type) {
      console.log(type);
      console.log('Eth Address' + this.ethRecepientAddress);
      console.log('Eth amount' + this.ethAmount);

      if (type == 'getETHBalance') {
        this.getETHBalance({account: this.ethRecepientAddress});
      }
      if (type == 'sendEthereumFunction') {
        this.sendEthereumFunction({recepient: this.ethRecepientAddress, amount: this.ethAmount});
      }
    },


    // **********************
    // whitepaperInterestRate
    // **********************    
    async whitepaperInterestRate(type) {
      console.log(type);
      console.log('cash = ' + this.cash);
      console.log('borrows = ' + this.borrows);
      console.log('reserves' + this.reserves);
      console.log('reservesMantissa' + this.reserveMantissa);
      console.log('baseRatePerYear' + this.baseRatePerYear);
      console.log('multiplierPerYear' + this.multiplierPerYear);

      if (type == 'changeParameters') {
        this.whitePaperModelChangeBaseParamters({baseRatePerYear: this.baseRatePerYear, multiplierPerYear: this.multiplierPerYear });
      }

      if (type == 'utilization') {
        this.whitePaperModelUtilRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});
      }

      if (type == 'borrow') {
        this.whitePaperModelBorrowRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});        
      }

      if (type == 'supply') {
        this.whitePaperModelSupplyRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves, reserveMantissa: this.reserveMantissa});                
      }
      if (type == 'baseRatePerBlock') {
        this.whitePaperModelgetBaseRatePerBlock();                
      }
      if (type == 'multiplierPerBlock') {
        this.whitePaperModelgetMultiplierPerBlock();                
      }

    },

    // **********************
    // jumpInterestRate_V2
    // **********************
    async jumpInterestRate_V2(type) {
      console.log(type);
      console.log('cash = ' + this.cash);
      console.log('borrows = ' + this.borrows);
      console.log('reserves' + this.reserves);
      console.log('reservesMantissa' + this.reserveMantissa);

      if (type == 'changeParameters') {
        this.jumpV2ModelChangeBaseParamters({baseRatePerYear: this.baseRatePerYear, multiplierPerYear: this.multiplierPerYear,jumpMultiplierPerYear: this.jumpMultiplierPerYear,kink_ : this.kink_});
      }
      if (type == 'utilization') {
        this.jumpV2ModelUtilRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});
      }
      if (type == 'borrow') {
        this.jumpV2ModelBorrowRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});        
      }
      if (type == 'supply') {
        this.jumpV2ModelSupplyRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves, reserveMantissa: this.reserveMantissa});                
      }
      if (type == 'baseRatePerBlock') {
        this.jumpV2ModelgetBaseRatePerBlock();                
      }
      if (type == 'multiplierPerBlock') {
        this.jumpV2ModelgetMultiplierPerBlock();                
      }
      if (type == 'jumpMultiplierPerBlock') {
        this.jumpV2ModelgetJumpMultiplierPerBlock();                
      }
      if (type == 'kink') {
        this.jumpV2ModelgetKink();                
      }
    },

    // **********************
    // sighReservoir
    // **********************
    async sighReservoir(type) {
      console.log(type);
      console.log('dripRate = ' + this.dripRate);
      console.log('targetAddress = ' + this.targetAddress);

      // if (type == 'RecentlyDrippedAmount') {
      //   this.sighReservoirDrip();        
      // }
      if (type == 'BeginDripping') {
        this.sighReservoirBeginDripping({dripRate: this.dripRate, targetAddress: this.targetAddress});
      }
      if (type == 'ChangeDripRate') {
        this.sighReservoirChangeDripRate({dripRate: this.dripRate});
      }
      if (type == 'Drip') {
        this.sighReservoirDrip();        
      }
      if (type == 'GetSighTokenAddress') {
        this.sighReservoirGetSighTokenAddress();                
      }
      if (type == 'getTargetAddress') {
        this.sighReservoirgetTargetAddress();                
      }
      if (type == 'GetDripStart') {
        this.sighReservoirgetDripStart();                
      }
      if (type == 'getdripRate') {
        this.sighReservoirgetdripRate();                
      }
      if (type == 'getlastDripBlockNumber') {
        this.sighReservoirgetlastDripBlockNumber();                
      }      
      if (type == 'getTotalDrippedAmount') {
        this.sighReservoirgetTotalDrippedAmount();                
      }
      if (type == 'getRecentlyDrippedAmount') {
        this.sighReservoirgetRecentlyDrippedAmount();                
      }
      if (type == 'getadmin') {
        this.sighReservoirgetadmin();                
      }
    },

    // **********************
    // sighTokens
    // **********************
    async sighTokens(type) {
      console.log(type);
      console.log('recepient = ' + this.recepient);
      console.log('amount = ' + this.amount);
      console.log('spender = ' + this.spender);
      console.log('sender = ' + this.sender);
      console.log('addedValue = ' + this.addedValue);
      console.log('subtractedValue = ' + this.subtractedValue);
      console.log('newReservoir = ' + this.newReservoir);      

      if (type == 'initMinting') {
        this.sighInitMinting();
      }
      if (type == 'sightransfer') {
        this.sightransfer({recepient: this.recepient, amount: this.amount});
      }
      if (type == 'sighapprove') {
        this.sighapprove({spender: this.spender, amount: this.amount});        
      }
      if (type == 'sightransferFrom') {
        this.sightransferFrom({sender: this.sender, recepient: this.recepient, amount: this.amount});        
      }
      if (type == 'sighincreaseAllowance') {
        this.sighincreaseAllowance({spender: this.spender, addedValue: this.addedValue});                
      }
      if (type == 'sighdecreaseAllowance') {
        this.sighdecreaseAllowance({spender: this.spender, subtractedValue: this.subtractedValue});                
      }
      if (type == 'sighMintCoins') {
        this.sighMintCoins();                
      }
      if (type == 'sighchangeReservoir') {
        this.sighchangeReservoir({newReservoir: this.newReservoir});                
      }
      if (type == 'sighgetRecentyMintedAmount') {
        this.sighgetRecentyMintedAmount();                
      }
      if (type == 'sighgetRecentMinter') {
        this.sighgetRecentMinter();                
      }
      if (type == 'sighgetCurrentCycle') {
        this.sighgetCurrentCycle();                
      }
      if (type == 'sighgetCurrentEra') {
        this.sighgetCurrentEra();                
      }
      if (type == 'sighgetallowance') {
        this.sighgetallowance({owner: this.recepient, spender: this.spender });                
      }
      if (type == 'sighgetbalanceOf') {
        this.sighgetbalanceOf({account: this.recepient });                
      }
      if (type == 'sigh_getTotalSupply') {
        this.sigh_getTotalSupply();                
      }
      if (type == 'sighIsMintingActivated') {
        this.sighIsMintingActivated();                
      }
      if (type == 'sighgetStart_Time') {
        this.sighgetStart_Time();                
      }
      if (type == 'sighgetdecimals') {
        this.sighgetdecimals();                
      }
      if (type == 'sighgetsymbol') {
        this.sighgetsymbol();                
      }
      if (type == 'sighgetname') {
        this.sighgetname();                
      }
    },

    // **********************
    // sightroller
    // **********************
    async sightroller(type) {
      console.log(type);
      console.log('account = ' + this.account);
      console.log('token = ' + this.token);
      console.log('market = ' + this.market);
      console.log('markets = ' + this.markets);
      console.log('minter = ' + this.minter);
      console.log('mintAmount = ' + this.mintAmount);
      console.log('actualMintAmount = ' + this.actualMintAmount);      
      console.log('mintTokens = ' + this.mintTokens);      
      console.log('redeemer = ' + this.redeemer);      
      console.log('redeemTokens = ' + this.redeemTokens);      
      console.log('actualRedeemAmount = ' + this.actualRedeemAmount);      
      console.log('borrower = ' + this.borrower);      
      console.log('borrowAmount = ' + this.borrowAmount);      
      console.log('payer = ' + this.payer);      
      console.log('repayAmount = ' + this.repayAmount);      
      console.log('actualRepayAmount = ' + this.actualRepayAmount);      
      console.log('borrowerIndex = ' + this.borrowerIndex);      
      console.log('marketBorrowed = ' + this.marketBorrowed);      
      console.log('marketCollateral = ' + this.marketCollateral);      
      console.log('liquidator = ' + this.liquidator);      
      console.log('seizeTokens = ' + this.seizeTokens);      
      console.log('src = ' + this.src);      
      console.log('dst = ' + this.dst);      
      console.log('transferTokens = ' + this.transferTokens);      
      console.log('newPriceOracle = ' + this.newPriceOracle);      
      console.log('newCloseFactorMantissa = ' + this.newCloseFactorMantissa);      
      console.log('newCollateralFactorMantissa = ' + this.newCollateralFactorMantissa);      
      console.log('newMaxAssets = ' + this.newMaxAssets);      
      console.log('newLiquidationIncentiveMantissa = ' + this.newLiquidationIncentiveMantissa);      
      console.log('supportMarket = ' + this.supportMarket);      
      console.log('newPauseGuardian = ' + this.newPauseGuardian);      
      console.log('boolstate = ' + this.boolstate);      
      console.log('unitroller = ' + this.unitroller);      
      console.log('holder = ' + this.holder);      
      console.log('borrowers = ' + this.borrowers);      
      console.log('gsighRate_ = ' + this.gsighRate_);      


      if (type == 'getAssetsIn') {
        this.sightroller_getAssetsIn({account: this.account});
      }
      if (type == 'checkMembership') {
        this.sightroller_checkMembership({account: this.account, market: this.market});
      }
      if (type == 'enterMarkets') {
        this.sightroller_enterMarkets({markets: this.markets});        
      }
      if (type == 'exitMarket') {
        this.sightroller_exitMarket({market: this.market});        
      }
      if (type == 'mintAllowed') {
        this.sightroller_mintAllowed({market: this.market,minter: this.minter,mintAmount: this.mintAmount});        
      }
      if (type == 'mintVerify') {
        this.sightroller_mintVerify({market: this.market, minter: this.minter, actualMintAmount: this.actualMintAmount, mintTokens: this.mintTokens});        
      }
      if (type == 'redeemAllowed') {
        this.sightroller_redeemAllowed({market: this.market,redeemer: this.redeemer,redeemTokens: this.redeemTokens});        
      }
      if (type == 'redeemVerify') {
        this.sightroller_redeemVerify({market: this.market, redeemer: this.redeemer, actualRedeemAmount: this.actualRedeemAmount, redeemTokens: this.redeemTokens});        
      }
      if (type == 'borrowAllowed') {
        this.sightroller_borrowAllowed({market: this.market,borrower: this.borrower,borrowAmount: this.borrowAmount});        
      }
      if (type == 'borrowVerify') {
        this.sightroller_borrowVerify({market: this.market, borrower: this.borrower, borrowAmount: this.borrowAmount});        
      }
      if (type == 'repayBorrowAllowed') {
        this.sightroller_repayBorrowAllowed({market: this.market,payer: this.payer, borrower: this.borrower, repayAmount: this.repayAmount});        
      }
      if (type == 'repayBorrowVerify') {
        this.sightroller_repayBorrowVerify({market: this.market, payer: this.payer, borrower: this.borrower, actualRepayAmount: this.actualRepayAmount, borrowerIndex: this.borrowerIndex});        
      }
      if (type == 'liquidateBorrowAllowed') {
        this.sightroller_liquidateBorrowAllowed({marketBorrowed: this.marketBorrowed,marketCollateral: this.marketCollateral, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount});        
      }
      if (type == 'liquidateBorrowVerify') {
        this.sightroller_liquidateBorrowVerify({marketBorrowed: this.marketBorrowed, marketCollateral: this.marketCollateral, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount, seizeTokens: this.seizeTokens});        
      }
      if (type == 'seizeAllowed') {
        this.sightroller_seizeAllowed({marketCollateral: this.marketCollateral, marketBorrowed: this.marketBorrowed, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount, seizeTokens: this.seizeTokens});        
      }
      if (type == 'seizeVerify') {
        this.sightroller_seizeVerify({marketCollateral: this.marketCollateral, marketBorrowed: this.marketBorrowed, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount, seizeTokens: this.seizeTokens});        
      }
      if (type == 'transferAllowed') {
        this.sightroller_transferAllowed({market: this.market,src: this.src, dst: this.dst, transferTokens: this.transferTokens});        
      }
      if (type == 'transferVerify') {
        this.sightroller_transferVerify({market: this.market, src: this.src, dst: this.dst, transferTokens: this.transferTokens});        
      }
      if (type == 'getAccountLiquidity') {
        this.sightroller_getAccountLiquidity({account: this.account});        
      }
      if (type == 'getHypotheticalAccountLiquidity') {
        this.sightroller_getHypotheticalAccountLiquidity({account: this.account, market: this.market, redeemTokens: this.redeemTokens, borrowAmount: this.borrowAmount});        
      }
      if (type == 'liquidateCalculateSeizeTokens') {
        this.sightroller_liquidateCalculateSeizeTokens({marketBorrowed: this.marketBorrowed, marketCollateral: this.marketCollateral, actualRepayAmount: this.actualRepayAmount });        
      }
      if (type == 'setPriceOracle') {
        this.sightroller_setPriceOracle({newPriceOracle: this.newPriceOracle});        
      }
      if (type == 'setCloseFactor') {
        this.sightroller_setCloseFactor({ newCloseFactorMantissa: this.newCloseFactorMantissa });        
      }
      if (type == 'setCollateralFactor') {
        this.sightroller_setCollateralFactor({market: this.market, newCollateralFactorMantissa: this.newCollateralFactorMantissa });        
      }
      if (type == 'setMaxAssets') {
        this.sightroller_setMaxAssets({ newMaxAssets: this.newMaxAssets });        
      }
      if (type == 'setLiquidationIncentive') {
        this.sightroller_setLiquidationIncentive({newLiquidationIncentiveMantissa: this.newLiquidationIncentiveMantissa });        
      }
      if (type == 'supportMarket') {
        this.sightroller_supportMarket({supportMarket: this.supportMarket });        
      }
      if (type == 'setPauseGuardian') {
        this.sightroller_setPauseGuardian({newPauseGuardian: this.newPauseGuardian });        
      }
      if (type == 'setMintPaused') {
        this.sightroller_setMintPaused({market: this.market, boolstate: this.boolstate });        
      }
      if (type == 'setBorrowPaused') {
        this.sightroller_setBorrowPaused({market: this.market, boolstate: this.boolstate  });        
      }
      if (type == 'setTransferPaused') {
        this.sightroller_setTransferPaused({boolstate: this.boolstate });        
      }
      if (type == 'setSeizePaused') {
        this.sightroller_setSeizePaused({boolstate: this.boolstate });        
      }
      if (type == '__become') {
        this.sightroller__become({unitroller: this.unitroller});        
      }
      if (type == 'refreshGsighSpeeds') {
        this.sightroller_refreshGsighSpeeds();        
      }
      if (type == 'claimGSigh') {
        this.sightroller_claimGSigh({holder: this.holder, markets: this.markets });        
      }
      if (type == 'claimGSigh_bs') {
        this.sightroller_claimGSigh_bs({holders: this.holders, markets: this.markets, borrowers: this.borrowers, suppliers: this.suppliers });        
      }
      if (type == 'setGsighRate') {
        this.sightroller_setGsighRate({gsighRate_: this.gsighRate_});        
      }
      if (type == 'addGsighMarkets') {
        this.sightroller__addGsighMarkets({markets: this.markets});        
      }
      if (type == 'dropGsighMarket') {
        this.sightroller__dropGsighMarket({market: this.market});        
      }
      if (type == 'getAllMarkets') {
        this.sightroller__getAllMarkets();        
      }
      if (type == 'getBlockNumber') {
        this.sightroller__getBlockNumber();        
      }
      if (type == 'getGSighAddress') {
        this.sightroller__getGSighAddress();        
      }
      if (type == 'getUnderlyingPriceFromOracle') {
        this.sightroller_getUnderlyingPriceFromOracle({cToken : this.market});        
      }
      if (type == 'getgsighRate') {
        this.sightroller_getGSighRate();        
      }
      if (type == 'getSighAddress') {
        this.sightroller_getSighAddress();        
      }
    },

    // **********************
    // unitroller
    // **********************
    async unitrollerfunctions(type) {
      console.log(type);
      console.log('newPendingImplementation' + this.newPendingImplementation);
      console.log('newPendingAdmin' + this.newPendingAdmin);

      if (type == 'setPendingImplementation') {
        this.unitroller___setPendingImplementation({newPendingImplementation: this.newPendingImplementation});        
      }
      if (type == 'acceptImplementation') {
        this.unitroller_acceptImplementation();        
      }      
      if (type == 'setPendingAdmin') {
        this.unitroller_setPendingAdmin({newPendingAdmin: this.newPendingAdmin});        
      }
      if (type == 'acceptAdmin') {
        this.unitroller_acceptAdmin();        
      }
      if (type == 'getAdmin') {
        this.unitroller_getAdmin();        
      }
      if (type == 'PendingSightrollerImplementation') {
        this.unitroller_getPendingSightrollerImplementation();        
      }
      if (type == 'SightrollerImplementation') {
        this.unitroller_getSightrollerImplementation();        
      }

    },

    // **********************
    // GSIGH TOKEN
    // **********************

    async gsigh_token(type) {
      console.log(type);
      console.log('gsigh_holder' + this.gsigh_holder);
      console.log('gsigh_spender' + this.gsigh_spender);
      console.log('gsigh_amount' + this.gsigh_amount);
      console.log('gsigh_destination' + this.gsigh_destination);
      console.log('gsigh_source' + this.gsigh_source);
      console.log('delegatee' + this.delegatee);
      console.log('gsigh_blockNumber' + this.gsigh_blockNumber);

      if (type == 'gsigh_allowance') {
        this.gsigh_allowance({gsigh_holder: this.gsigh_holder, gsigh_spender: this.gsigh_spender});        
      }
      if (type == 'gsigh_balanceOf') {
        this.gsigh_balanceOf({gsigh_holder: this.gsigh_holder});        
      }      
      if (type == 'gsigh_approve') {
        this.gsigh_approve({gsigh_spender: this.gsigh_spender, gsigh_amount: this.gsigh_amount});        
      }
      if (type == 'gsigh_transfer') {
        this.gsigh_transfer({gsigh_destination: this.gsigh_destination, gsigh_amount: this.gsigh_amount});        
      }
      if (type == 'gsigh_transferFrom') {
        this.gsigh_transferFrom({gsigh_source: this.gsigh_source, gsigh_destination: this.gsigh_destination, gsigh_amount: this.gsigh_amount});        
      }        
      if (type == 'gsigh_delegate') {
        this.gsigh_delegate({delegatee: this.delegatee});        
      }   
      if (type == 'gsigh_getCurrentVotes') {
        this.gsigh_getCurrentVotes({gsigh_holder: this.gsigh_holder});        
      }   
      if (type == 'gsigh_getPriorVotes') {
        this.gsigh_getPriorVotes({gsigh_holder: this.gsigh_holder, gsigh_blockNumber: this.gsigh_blockNumber});        
      }   
    },

    // **********************
    // GOVERNOR ALPHA
    // **********************

    async governor_alpha(type) {
      console.log(type);
      console.log('p_targets' + this.p_targets);
      console.log('p_values' + this.p_values);
      console.log('p_signatures' + this.p_signatures);
      console.log('p_calldatas' + this.p_calldatas);
      console.log('p_description' + this.p_description);
      console.log('proposalId' + this.proposalId);
      console.log('bool_support' + this.bool_support);
      console.log('gov_newPendingAdmin' + this.gov_newPendingAdmin);
      console.log('gov_eta' + this.gov_eta);

      if (type == 'quorumVotes') {
        this.governorAlpha_quorumVotes();        
      }
      if (type == 'proposalThreshold') {
        this.governorAlpha_proposalThreshold();        
      }      
      if (type == 'proposalMaxOperations') {
        this.governorAlpha_proposalMaxOperations();        
      }      
      if (type == 'votingDelay') {
        this.governorAlpha_votingDelay();        
      }      
      if (type == 'votingPeriod') {
        this.governorAlpha_votingPeriod();        
      }      
      if (type == 'proposalCount') {
        this.governorAlpha_proposalCount();        
      }            
      if (type == '__acceptAdmin') {
        this.governorAlpha__acceptAdmin();        
      }      
      if (type == '__abdicate') {
        this.governorAlpha__abdicate();        
      }   
      if (type == '__queueSetTimelockPendingAdmin') {
        this.governorAlpha__queueSetTimelockPendingAdmin({gov_newPendingAdmin: this.gov_newPendingAdmin,gov_eta: this.gov_eta});        
      }   
      if (type == '__executeSetTimelockPendingAdmin') {
        this.governorAlpha__executeSetTimelockPendingAdmin({gov_newPendingAdmin: this.gov_newPendingAdmin,gov_eta: this.gov_eta});        
      } 
      if (type == 'state') {
        this.governorAlpha_state({proposalId: this.proposalId});        
      }          
      if (type == 'getReceipt') {
        this.governorAlpha_getReceipt({proposalId: this.proposalId});        
      }          
      if (type == 'getActions') {
        this.governorAlpha_getActions({proposalId: this.proposalId});        
      }          
      if (type == 'castVote') {
        this.governorAlpha_castVote({proposalId: this.proposalId, bool_support: this.bool_support});        
      }          
      if (type == 'cancel') {
        this.governorAlpha_cancel({proposalId: this.proposalId});        
      }          
      if (type == 'execute') {
        this.governorAlpha_execute({proposalId: this.proposalId});        
      }          
      if (type == 'queue') {
        this.governorAlpha_queue({proposalId: this.proposalId});        
      }          
      if (type == 'propose') {
        this.governorAlpha_propose({p_targets : this.p_targets, p_values : this.p_values ,p_signatures : this.p_signatures ,p_calldatas : this.p_calldatas , p_description : this.p_description });        
      }          
    },

    // **********************
    // TIMELOCK
    // **********************

    async timelock_governance(type) {
      console.log(type);
      console.log('timelock_delay_' + this.timelock_delay_);
      console.log('timelock_pendingAdmin_' + this.timelock_pendingAdmin_);
      console.log('timelock_target' + this.timelock_target);
      console.log('timelock_value' + this.timelock_value);
      console.log('timelock_signature' + this.timelock_signature);
      console.log('timelock_data' + this.timelock_data);
      console.log('timelock_eta' + this.timelock_eta);
      console.log('timeLock_EthValueInWei' + this.timeLock_EthValueInWei);

      if (type == 'setDelay') {
        this.Timelock__setDelay({timelock_delay_: this.timelock_delay_});        
      }
      if (type == 'setPendingAdmin') {
        this.Timelock__setPendingAdmin({timelock_pendingAdmin_: this.timelock_pendingAdmin_});        
      }
      if (type == 'acceptAdmin') {
        this.Timelock__acceptAdmin();        
      }
      if (type == 'queueTransaction') {
        this.Timelock__queueTransaction({ timelock_target: this.timelock_target, 
                                          timelock_value: this.timelock_value, 
                                          timelock_signature: this.timelock_signature, 
                                          timelock_data: this.timelock_data ,
                                          timelock_eta: this.timelock_eta   
                                          });        
      }
      if (type == 'cancelTransaction') {
        this.Timelock__cancelTransaction({  timelock_target: this.timelock_target, 
                                            timelock_value: this.timelock_value, 
                                            timelock_signature: this.timelock_signature, 
                                            timelock_data: this.timelock_data ,
                                            timelock_eta: this.timelock_eta  
                                          });        
      }
      if (type == 'executeTransaction') {
        this.Timelock__executeTransaction({ timelock_target: this.timelock_target, 
                                            timelock_value: this.timelock_value, 
                                            timelock_signature: this.timelock_signature, 
                                            timelock_data: this.timelock_data ,
                                            timelock_eta: this.timelock_eta, 
                                            timeLock_EthValueInWei : this.timeLock_EthValueInWei 
                                            });        
      }
  },

    // **********************
    // GSIGH RESERVOIR
    // **********************

    async gsighReservoir(type) {
      console.log(type);
      console.log('gsigh_dripRate_' + this.gsigh_dripRate_);
      console.log('gsigh_target_' + this.gsigh_target_);

      if (type == 'beginDripping') {
        this.GSighReservoir_beginDripping( {gsigh_dripRate_ : this.gsigh_dripRate_ , gsigh_target_ : this.gsigh_target_ });        
      }
      if (type == 'changeDripRate') {
        this.GSighReservoir_changeDripRate({gsigh_dripRate_ : this.gsigh_dripRate_});        
      }
      if (type == 'drip') {
        this.GSighReservoir_drip();        
      }
      if (type == 'getGSighAddress') {
        this.GSighReservoir_getGSighAddress();        
      }
      if (type == 'getTargetAddress') {
        this.GSighReservoir_getTargetAddress();        
      }
      if (type == 'lastDripBlockNumber') {
        this.GSighReservoir_lastDripBlockNumber();        
      }
      if (type == 'totalDrippedAmount') {
        this.GSighReservoir_totalDrippedAmount();        
      }
      if (type == 'recentlyDrippedAmount') {
        this.GSighReservoir_recentlyDrippedAmount();        
      }
      if (type == 'dripRate') {
        this.GSighReservoir_dripRate();        
      }
      if (type == 'dripStart') {
        this.GSighReservoir_dripStart();        
      }
      if (type == 'admin') {
        this.GSighReservoir_admin();        
      }
  },

    // **********************
    // SIGHLENS
    // **********************

    async sighlens(type) {
      console.log(type);
      console.log('cTokenAddress' + this.cTokenAddress);
      console.log('cTokenAddressArray' + this.cTokenAddressArray);
      console.log('sighlens_amount' + this.sighlens_amount);
      console.log('sighlens_sightroller' + this.sighlens_sightroller);
      console.log('sighlens_account' + this.sighlens_account);
      console.log('sighlens_governor' + this.sighlens_governor);
      console.log('sighlens_proposalIds' + this.sighlens_proposalIds);
      console.log('sighlens_gsigh_address' + this.sighlens_gsigh_address);
      console.log('sighlens_blockNumbers' + this.sighlens_blockNumbers);

      if (type == 'cTokenMetadata') {
        this.SighLens_cTokenMetadata({cTokenAddress: this.cTokenAddress });        
      }
      if (type == 'cTokenMetadataAll') {
        this.SighLens_cTokenMetadataAll({cTokenAddressArray: this.cTokenAddressArray });        
      }
      if (type == 'cTokenBalances') {
        this.SighLens_cTokenBalances({ cTokenAddress: this.cTokenAddress, sighlens_amount: this.sighlens_amount });        
      }
      if (type == 'cTokenBalancesAll') {
        this.SighLens_cTokenBalancesAll({ cTokenAddressArray: this.cTokenAddressArray, sighlens_amount: this.sighlens_amount  });        
      }
      if (type == 'cTokenUnderlyingPrice') {
        this.SighLens_cTokenUnderlyingPrice({cTokenAddress: this.cTokenAddress });        
      }
      if (type == 'cTokenUnderlyingPriceAll') {
        this.SighLens_cTokenUnderlyingPriceAll({cTokenAddressArray: this.cTokenAddressArray });        
      }
      if (type == 'getAccountLimits') {
        this.SighLens_getAccountLimits({sighlens_sightroller: this.sighlens_sightroller, sighlens_account: this.sighlens_account });        
      }
      if (type == 'getGovProposals') {
        this.SighLens_getGovReceipts({sighlens_governor: this.sighlens_governor, sighlens_account: this.sighlens_account, sighlens_proposalIds: this.sighlens_proposalIds });        
      }
      if (type == 'getGSighBalanceMetadata') {
        this.SighLens_getGSighBalanceMetadata({sighlens_gsigh_address: this.sighlens_gsigh_address, sighlens_account: this.sighlens_account });        
      }
      if (type == 'getGSighVotes') {
        this.SighLens_getGSighVotes({sighlens_gsigh_address: this.sighlens_gsigh_address, sighlens_account: this.sighlens_account, sighlens_blockNumbers: this.sighlens_blockNumbers });        
      }
      if (type == 'getGSighBalanceMetadataExt') {
        this.SighLens_getGSighBalanceMetadataExt({sighlens_gsigh_address: this.sighlens_gsigh_address, sighlens_sightroller: this.sighlens_sightroller, sighlens_account: this.sighlens_account });        
      }
    },

    // **********************
    // CERC20 MARKET
    // **********************

    async cERC20Market(type) {
      console.log(type);
      console.log('cer20_underlying' + this.cer20_underlying);
      console.log('cer20_sightroller' + this.cer20_sightroller);
      console.log('cer20_interestRateModel_' + this.cer20_interestRateModel_);
      console.log('cer20_initialExchangeRateMantissa' + this.cer20_initialExchangeRateMantissa);
      console.log('cer20_name' + this.cer20_name);
      console.log('cer20_symbol' + this.cer20_symbol);
      console.log('cer20_decimals' + this.cer20_decimals);
      console.log('cer20_mintAmount' + this.cer20_mintAmount);
      console.log('cer20_redeemTokens' + this.cer20_redeemTokens);

      console.log('cer20_redeemAmount' + this.cer20_redeemAmount);
      console.log('cer20_borrowAmount' + this.cer20_borrowAmount);
      console.log('cer20_borrower' + this.cer20_borrower);
      console.log('cer20_repayAmount' + this.cer20_repayAmount);
      console.log('cer20_cTokenCollateral' + this.cer20_cTokenCollateral);
      console.log('cer20_addAmount' + this.cer20_addAmount);
      console.log('cer20_src' + this.cer20_src);
      console.log('cer20_dst' + this.cer20_dst);
      console.log('cer20_amount' + this.cer20_amount);
      console.log('cer20_spender' + this.cer20_spender);
      console.log('cer20_owner' + this.cer20_owner);
      console.log('cer20_account' + this.cer20_account);
      console.log('cerc20_liquidator' + this.cerc20_liquidator);
      console.log('cerc20_seizeTokens' + this.cerc20_seizeTokens);
      console.log('cerc20_newPendingAdmin' + this.cerc20_newPendingAdmin);

      console.log('cerc20_newSightroller' + this.cerc20_newSightroller);
      console.log('cerc20_newReserveFactorMantissa' + this.cerc20_newReserveFactorMantissa);
      console.log('cerc20_reduceAmount' + this.cerc20_reduceAmount);
      console.log('cerc20_newInterestRateModel' + this.cerc20_newInterestRateModel);



      if (type == 'cERC20_initialize') {
        this.cERC20_initialize({cer20_underlying: this.cer20_underlying , 
        cer20_sightroller: this.cer20_sightroller , 
        cer20_interestRateModel_: this.cer20_interestRateModel_ , 
        cer20_initialExchangeRateMantissa: this.cer20_initialExchangeRateMantissa , 
        cer20_name: this.cer20_name ,
        cer20_symbol: this.cer20_symbol ,
        cer20_decimals: this.cer20_decimals
         });        
      }

      if (type == 'cERC20_mint') {
        this.cERC20_mint({cer20_mintAmount: this.cer20_mintAmount});        
      }
      if (type == 'cERC20_redeem') {
        this.cERC20_redeem({cer20_redeemTokens: this.cer20_redeemTokens });        
      }
      if (type == 'cERC20_redeemUnderlying') {
        this.cERC20_redeemUnderlying({ cer20_redeemAmount: this.cer20_redeemAmount });        
      }
      if (type == 'cERC20_borrow') {
        this.cERC20_borrow({ cer20_borrowAmount: this.cer20_borrowAmount });        
      }
      if (type == 'cERC20_repayBorrow') {
        this.cERC20_repayBorrow({cer20_repayAmount: this.cer20_repayAmount });        
      }
      if (type == 'cERC20_repayBorrowBehalf') {
        this.cERC20_repayBorrowBehalf({cer20_borrower: this.cer20_borrower, cer20_repayAmount: this.cer20_repayAmount  });        
      }
      if (type == 'cERC20_liquidateBorrow') {
        this.cERC20_liquidateBorrow({cer20_borrower: this.cer20_borrower, cer20_repayAmount: this.cer20_repayAmount, cer20_cTokenCollateral: this.cer20_cTokenCollateral });        
      }
      if (type == 'cERC20_addReserves') {
        this.cERC20_addReserves({cer20_addAmount: this.cer20_addAmount });        
      }
      if (type == 'cERC20_transfer') {
        this.cERC20_transfer({cer20_dst: this.cer20_dst , cer20_amount: this.cer20_amount  });        
      }
      if (type == 'cERC20_transferFrom') {
        this.cERC20_transferFrom({cer20_src: this.cer20_src , cer20_dst: this.cer20_dst , cer20_amount: this.cer20_amount  });        
      }
      if (type == 'cERC20_approve') {
        this.cERC20_approve({cer20_spender: this.cer20_spender , cer20_amount: this.cer20_amount  });        
      }
      if (type == 'cERC20_balanceOfUnderlying') {
        this.cERC20_balanceOfUnderlying({cer20_owner: this.cer20_owner  });        
      }
      if (type == 'cERC20_borrowBalanceCurrent') {
        this.cERC20_borrowBalanceCurrent({cer20_account: this.cer20_account});        
      }
      if (type == 'cERC20_balanceOf') {
        this.cERC20_balanceOf( {cer20_owner: this.cer20_owner });        
      }
      if (type == 'cERC20_getAccountSnapshot') {
        this.cERC20_getAccountSnapshot( {cer20_account: this.cer20_account } );        
      }
      if (type == 'cERC20_borrowBalanceStored') {
        this.cERC20_borrowBalanceStored( {cer20_account: this.cer20_account } );        
      }
      if (type == 'cERC20_seize') {
        this.cERC20_seize( {cerc20_liquidator: this.cerc20_liquidator, cerc20_borrower: this.cerc20_borrower, cerc20_seizeTokens: this.cerc20_seizeTokens } );        
      }
      if (type == 'cERC20_setPendingAdmin') {
        this.cERC20_setPendingAdmin( {cerc20_newPendingAdmin: this.cerc20_newPendingAdmin } );        
      }
      if (type == 'cERC20_setSightroller') {
        this.cERC20_setSightroller( {cerc20_newSightroller : this.cerc20_newSightroller} );        
      }
      if (type == 'cERC20_setReserveFactor') {
        this.cERC20_setReserveFactor( {cerc20_newReserveFactorMantissa: this.cerc20_newReserveFactorMantissa} );        
      }
      if (type == 'cERC20_reduceReserves') {
        this.cERC20_reduceReserves( {cerc20_reduceAmount: this.cerc20_reduceAmount} );        
      }
      if (type == 'cERC20_setInterestRateModel') {
        this.cERC20_setInterestRateModel( {cerc20_newInterestRateModel: this.cerc20_newInterestRateModel} );        
      } 
      if (type == 'cERC20_acceptAdmin') {
        this.cERC20_acceptAdmin( );        
      }
      if (type == 'cERC20_exchangeRateStored') {
        this.cERC20_exchangeRateStored( );        
      }
      if (type == 'cERC20_getCash') {
        this.cERC20_getCash( );        
      }
      if (type == 'cERC20_borrowRatePerBlock') {
        this.cERC20_borrowRatePerBlock( );        
      }
      if (type == 'cERC20_supplyRatePerBlock') {
        this.cERC20_supplyRatePerBlock( );        
      }
      if (type == 'cERC20_exchangeRateCurrent') {
        this.cERC20_exchangeRateCurrent( );        
      }
      if (type == 'cERC20_accrueInterest') {
        this.cERC20_accrueInterest( );        
      }
      if (type == 'cERC20_allowance') {
        this.cERC20_allowance( );        
      }
      if (type == 'cERC20_totalBorrowsCurrent') {
        this.cERC20_totalBorrowsCurrent( );        
      }
      if (type == 'cERC20_sightroller') {
        this.cERC20_getSightroller( );        
      }
      if (type == 'cERC20_getName') {
        this.cERC20_getName();        
      }
      if (type == 'cERC20_getSymbol') {
        this.cERC20_getSymbol( );        
      }

    },

    async revertReason() {
      console.log('TxHash ' + this.txhash);
      console.log('blockNumber_ ' + this.blockNumber_);
      this.getRevertReason({txhash: this.txhash, blockNumber: this.blockNumber_});
    },

    async getPriceFromOracle() {
      console.log(this.Market_Address)
      this.SimplePriceOracle_getUnderlyingPrice({Market_Address : this.Market_Address})
    }
  },

  created() {
    this.changeVegaMarket = (newMarket) => {       //Changing Selected Vega Market
      this.formData.vegaMarketName = newMarket.Name;
      this.formData.vegaMarketId = newMarket.Id;
      // console.log(this.formData.vegaMarketId + ' ' + this.formData.vegaMarketName);
    };
    ExchangeDataEventBus.$on('change-vega-market', this.changeVegaMarket);        
  },

  // mounted() {
  //   this.watcher = setInterval(() => {this.getStatus();}, 5000);  //getting status for exchange () every 5 sec
  //   // ExchangeDataEventBus.$on('change-symbol', this.changeSymbol);
  //   // this.getStatus('auto');
  // },


  destroyed() {
    clearInterval(this.watcher);
    ExchangeDataEventBus.$off('change-vega-market', this.changeVegaMarket);    
  },

};
</script>

<style lang="scss" src="./style.scss" scoped></style>
