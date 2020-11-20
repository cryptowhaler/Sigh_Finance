import Vue from 'vue';
export default new Vue();
export const EventNames = {
  // WHEN SIGH FINANCE LOADS
  connectedToSupportedNetwork: 'connected-To-Supported-Network',
  // WHEN WALLET IS CONNECTED (getConnectedWalletState() successful call)
  ConnectedWalletSesssionRefreshed: 'Connected-Wallet-Sesssion-Refreshed',
  ConnectedWalletTotalLendingBalancesRefreshed: 'Connected-Wallet-Total-Lending-Balances-Refreshed',  
  ConnectedWallet_SIGH_Balances_Refreshed: 'Connected-Wallet-SIGH-Balances-Refreshed',
  // INSTRUMENT : STATES RELATED
  instrumentStateUpdated: 'instrument-State-Updated',
  instrumentConfigUpdated: 'instrument-Config-Updated',
  instrumentGlobalBalancesUpdated: 'instrument-Global-Balances-Updated',
  instrument_SIGH_STATES_Updated: 'instrument-SIGH-STATES-Updated',
  userWalletConnected: 'user-wallet-connected',
  userWalletDisconnected: 'user-wallet-Disconnected',

  
};
