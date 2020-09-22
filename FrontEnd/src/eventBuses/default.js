import Vue from 'vue';
export default new Vue();
export const EventNames = {
  userLogout: 'user-logout',
  userSessionExpired: 'user-session-expired',
  // ledgerUpdated: 'ledger-updated',
  // orderPlaced: 'orderPlaced',
  // orderFilled: 'orderFilled',
  // orderCanceled: 'orderCanceled',
  // orderPartiallyFilled: 'orderPartiallyFilled',
  // orderUpdated: 'orderUpdated',
  notification: 'notification',
  modalMsg: 'modalMsg',   //Updating msg when logged-in / logged-out
  userLogoutMAIN: 'user-logout-website-loaded',
  pubKeyChanged: 'pubKeyChanged', //handles change in selected pubKey
  userWalletConnected: 'user-wallet-connected',
  userWalletDisconnected: 'user-wallet-Disconnected',

  
};
