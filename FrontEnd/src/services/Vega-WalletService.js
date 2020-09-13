import axios from 'axios';
import LocalStorage, { VegaKeys, } from '../utils/localStorage';

class VegaWalletService {


  async loginToVega(name, key, pass_) {
    let obj = { 'wallet': key, 'passphrase': pass_, };
    // console.log(obj);
    try {
      const res = await axios.post('https://wallet.n.vega.xyz/api/v1/auth/token', obj);
      // console.log(res);

      if (res.status === 200) {
        // console.log('===200');
        // console.log(res.status, res.data.token);
        VegaKeys.name = name;
        VegaKeys.token = res.data.token;
        // console.log('VEGA KEYS  ', VegaKeys.name, VegaKeys.token);

        const pub_res = await this.getPubKeys(obj.pass);
        // console.log('response from pub_res call ' + pub_res);
        if (pub_res.status === 200) {
          return { status: 200, msg: 'Login Successful - Welcome ' + name, };
        }
        else {
          return { status: 200, msg: 'Login Successful, but PubKeys couldn\'t be generated. Please try again.', };
        }
      }
      else {
        return { status: 400, msg: 'Login Failed : Wallet-Passphrase pair Incorrect.', };
      }
    }
    catch (error) {
      // console.log(JSON.stringify(error));
      return { status: 400, msg: 'Login Failed : Wallet-Passphrase pair Incorrect.', };
    }
  }


  async logoutfromVega() {
    if (!VegaKeys.token) {
      // console.log('logged out');
      return 'User already Logged Out.';
    }
    const _header = 'Bearer ' + VegaKeys.token;
    try {
      const res = await axios.delete('https://wallet.n.vega.xyz/api/v1/auth/token', { headers: { Authorization: _header, }, });
      // console.log(res);

      if (res.status == 200) {
        LocalStorage.clearVegaSession();
        // console.log('status: 200, msg: \'User Successfully Logged Out.\',');
        return { status: 200, msg: 'User Successfully Logged Out.', };
      }
      else {
        // console.log('status: 400, msg: \'Something went wrong. Please try again..\',');
        return { status: 400, msg: 'Something went wrong. Please try again.', };
      }
    }
    catch (error) {
      // console.log(JSON.stringify(error));
      // console.log('status: 400, msg: \'Something went wrong. Please try again..\',');
      return { status: 400, msg: 'Something went wrong. Server returned error. Please try again.', };
    }

  }


  async getPubKeys(pass) {
    const _header = 'Bearer ' + VegaKeys.token;
    // console.log(_header);
    try {
      const res = await axios.get('https://wallet.n.vega.xyz/api/v1/keys', { headers: { Authorization: _header, }, });
      // console.log(res);

      if (res.status == 200) {
        let count = Object.keys(res.data.keys).length;     //number of keys
        // console.log('count ' + count);

        if (count <= 1) {                              //if no key available
          const gen = await this.generatenewPubKeys(pass);
          // console.log(gen);
          return gen;
        }
        else {
          for (let i = 0; i < count; i++) {
            let obj = res.data.keys[i];                 //individual key assigned to obj
            // console.log(i + '  -  ' + obj.pub);
            VegaKeys.pubKeys.push(obj.pub);
          }
          VegaKeys.currentActiveKey = VegaKeys.pubKeys[0];
          // console.log('VegaKeys.pubKeys ' + VegaKeys.pubKeys);
        }

        // console.log('PubKeys retrieved Successfully.');
        return { status: 200, msg: 'PubKeys retrieved Successfully.', };
      }
      else {
        // console.log('Something went wrong. Couldn\'t retrieve PubKeys.');
        return { status: 400, msg: 'Something went wrong. Couldn\'t retrieve PubKeys.', };
      }
    }
    catch (error) {
      // console.log(JSON.stringify(error));
      return { status: 400, msg: 'Something went wrong. Server returned error when fetching PubKeys.', };
    }
  }


  async generatenewPubKeys(pass) {

    const _header = 'Bearer ' + VegaKeys.token;
    let data = { 'passphrase': pass, 'meta': [{ 'key': 'somekey', 'value': 'somevalue', },], };
    // console.log(data);
    const res = await axios.post('https://wallet.n.vega.xyz/api/v1/keys', data, { headers: { Authorization: _header, }, });
    // console.log(res);
    try {
      if (res.status == 200) {
        VegaKeys.pubKeys.push(res.data.key.pub);
        VegaKeys.currentActiveKey = res.data.key.pub;
        // console.log('New PubKey generated successfully ' + VegaKeys.pubKeys);
        return { status: 200, msg: 'New PubKey generated successfully', };
      }
      else {
        // console.log('Something went wrong. Couldn\'t generate new PubKey');
        return { status: 400, msg: 'Something went wrong. Couldn\'t generate new PubKey', };
      }
    }
    catch (error) {
      // console.log(JSON.stringify(error));
      return { status: 400, msg: 'Something went wrong. Couldn\'t generate new PubKey', };
    }
  }

}

export default new VegaWalletService();
