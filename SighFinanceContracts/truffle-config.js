/**
 * More information about configuration can be found at:  * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

// const HDWalletProvider = require('@truffle/hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();
// require("ts-node/register"); // eslint-disable-line
// require("dotenv-flow").config(); // eslint-disable-line
// ==============================================================================================================
// const HDWalletProvider = require('truffle-hdwallet-provider')

// require('dotenv').config()
// const wallet = process.env.RopstenWallet;
// const privateKey = process.env.RopstenPrivateKey; 
// const projectId = process.env.ProjectId;

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  // Directory to which the compiled contracts are  exported after compilation
  contracts_build_directory: '../FrontEnd/src/contracts',

    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: 5777,
      gas: 0xfffffffffff,
      gasPrice: 1,
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,   
      network_id: '*',
      gas: 0xfffffffffff,
      gasPrice: 1,
    },
    // ropsten: {
    //   provider: function() {
    //     return new HDWalletProvider(privateKey,"https://ropsten.infura.io/v3/" + projectId)
    //   },
    //   network_id: 3,
    //   gas: 4000000,      //make sure this gas allocation isn't over 4M, which is the max
    //   from: wallet,
    // },
    // live: {
    //   provider: () => {
    //     // This part will be parameters like MNEMONIC - is private key to deploy
    //     // RPC_URL - is the Ethereum node I will deploy
    //     return new HDWalletProvider(process.env.MNEMONIC, process.env.RPC_URL)
    //   },
    //   network_id: '*',
    //   skipDryRun: true,
    // },    
    coverage: {
      host: "127.0.0.1",
      port: 6545,
      network_id: 1002,
      gas: 0xfffffffffff,
      gasPrice: 1,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: false,
  },

  plugins: ["solidity-coverage"],

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.16", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};