import Vue from 'vue';
export default new Vue();
export const EventNames = {
  // WHEN SIGH FINANCE LOADS
  connectedToSupportedNetwork: 'connected-To-Supported-Network',

  // INSTRUMENT : STATES RELATED
  instrumentStateUpdated: 'instrument-State-Updated',
  instrumentConfigUpdated: 'instrument-Config-Updated',
  instrumentGlobalBalancesUpdated: 'instrument-Global-Balances-Updated',
  instrument_SIGH_STATES_Updated: 'instrument-SIGH-STATES-Updated',
  userWalletConnected: 'user-wallet-connected',
  userWalletDisconnected: 'user-wallet-Disconnected',

  
};
