import { VegaKeys,} from '@/utils/localStorage.js';
import axios from 'axios';

class VegaProtocolService {

  constructor() {
    this.main_api = 'https://lb.n.vega.xyz';
    this.currentActiveKey = VegaKeys.currentActiveKey;
    // const token = VegaKeys.token; 
    this.unspecified = 'unspecified';
  }
    
    
  //    Preparesponsethe submit order. Returns blob which is decoded and used for signing transaction
  // {
  //     "blob": "string",
  //     "submitID": "string"
  //     }

  async submitOrder_market(marketid,size,side,type,timeinforce) {
    const msg_ = side + ' ' + type + ' ' + timeinforce  + ' order of ' + size + ' ' + ' at ';
    try {                 //PREPARING ORDER
      // marketid,size,type,side = this.unspecified,timeinforce = this.unspecified,price=''
      // console.log(side + ' ' + size+ ' ' +marketid+ ' ' +type+ ' ' +timeinforce);
      const preparingOrder = await this.prepare_submit_order_market(marketid,size,type,side,timeinforce); 
      // console.log(preparingOrder);
      if (preparingOrder.status == 200) {
        let msg = msg_ + ' has been successfully prepared.';
        // console.log(msg);
        const blob = preparingOrder.data.blob;

        try {           //SIGNING PREPARED ORDER
          // console.log(blob);
          const transactionSign = await this.signtx(blob,true);  //Propogating the transaction
          // console.log(transactionSign);
          if (transactionSign.status == 200) {
            let msg = msg_ + ' has been successfully signed and propogated into the chain.';
            // console.log(msg);    
            return {status:transactionSign.status, message:msg,};
            // let transSignRes = transactionSign.data.signedTx;
            // let sig = transSignRes.sig;
            // let pub = transSignRes.pubKey;
            // // let pubPrep = base64.b64encode(binascii.unhexlify(pub)).decode("ascii");

            // try {        //SUBMITTING ORDER    
            //   let transSubRes = await this.submit_transaction(blob,sig,pub);
            //   if (transSubRes.status == 200) {
            //     let msg = msg_ + ' has been successfully submitted';
            //     // console.log(msg);
            //     return {status:transSubRes.status, message:msg,};
            //   }
            //   else {    //Else for submitting order
            //     let msg = msg_ + ' - Order submission failed';
            //     // console.log(msg);
            //     return {status:transSubRes.status, message:msg,};
            //   }
            // }
            // catch (err) {//catch for submitting order
            //   let msg = msg_ + ' - Order submission returned error. Please check order details again.';
            //   // console.log(msg);
            //   return {status:404, message:msg,};
            // }
          }

          else {//Else for signing order
            let msg = msg_ + ' - Order signature failed';
            // console.log(msg);
            return {status:transactionSign.status, message:msg,};
          }
        }
        catch (err) {  //catch for signing order
          let msg = msg_ + ' - Order signature returned error. Please check order details again.';
          // console.log(msg);
          return {status:404, message:msg,};
        } 
      }
      else {  //Else for preparing order
        let msg = msg_ + ' - Order preparation failed';
        // console.log(msg);
        return {status:preparingOrder.status, message:msg,};
      } 
    }
    catch (err) {
      let msg = msg_ + ' - Order preparation returned error. Please check order details again.';
      // console.log(msg);
      return {status:404, message:this.msg,};
    } 
  }

  async submitOrder_limit(marketid,size,side,type,timeinforce,price,currency = 'USD') {
    const msg_ = side + ' ' + type + ' ' + timeinforce  + ' order of volume ' + size + ' ' + ' at value ' + price + ' ' + currency;
    try {                 //PREPARING ORDER
      // marketid,size,type,side = this.unspecified,timeinforce = this.unspecified,price=''
      // console.log(side + ' ' + size+ ' ' +marketid+ ' ' +type+ ' ' +timeinforce + price);
      const preparingOrder = await this.prepare_submit_order_limit(marketid,size,type,side,timeinforce,price); 
      // console.log(preparingOrder);
      if (preparingOrder.status == 200) {
        let msg = msg_ + ' has been successfully prepared.';
        // console.log(msg);
        const blob = preparingOrder.data.blob;

        try {           //SIGNING PREPARED ORDER
          const transactionSign = await this.signtx(blob,true);   //Propogating the transaction

          if (transactionSign.status == 200) {
            let msg = msg_ + ' has been successfully signed and propogated into the chain.';
            // console.log(msg);    
            return {status:transactionSign.status, message:msg,};
            // let transSignRes = transactionSign.data.signedTx;
            // let sig = transSignRes.sig;
            // let pub = transSignRes.pubKey;
            // // let pubPrep = base64.b64encode(binascii.unhexlify(pub)).decode("ascii");

            // try {        //SUBMITTING ORDER    
            //   let transSubRes = await this.submit_transaction(blob,sig,pub);
            //   if (transSubRes.status == 200) {
            //     let msg = msg_ + ' has been successfully submitted';
            //     // console.log(msg);
            //     return {status:transSubRes.status, message:msg,};
            //   }
            //   else {    //Else for submitting order
            //     let msg = msg_ + ' - Order submission failed';
            //     // console.log(msg);
            //     return {status:transSubRes.status, message:msg,};
            //   }
            // }
            // catch (err) {//catch for submitting order
            //   let msg = msg_ + ' - Order submission returned error. Please check order details again.';
            //   // console.log(msg);
            //   return {status:404, message:msg,};
            // }
          }

          else {//Else for signing order
            let msg = msg_ + ' - Order signature failed';
            // console.log(msg);
            return {status:transactionSign.status, message:msg,};
          }
        }
        catch (err) {  //catch for signing order
          let msg = msg_ + ' - Order signature returned error. Please check order details again.';
          // console.log(msg);
          return {status:404, message:msg,};
        } 
      }
      else {  //Else for preparing order
        let msg = msg_ + ' - Order preparation failed';
        // console.log(msg);
        return {status:preparingOrder.status, message:msg,};
      } 
    }
    catch (err) {
      let msg = msg_ + ' - Order preparation returned error. Please check order details again.';
      // console.log(msg);
      return {status:404, message:msg,};
    } 
  }  

  async prepare_submit_order_market(marketid,size,type,side,timeinforce) {
    // console.log('PREPARING ORDER');
    // console.log(VegaKeys.currentActiveKey);
    // console.log(this.currentActiveKey);
    const responsebody = {'submission': {'marketID': marketid, 'partyID': VegaKeys.currentActiveKey, 'side': side, 'size': size, 'timeInForce': timeinforce, 'type': type,},};
    // console.log(responsebody);
    try {
      let response = await axios.post(this.main_api + '/orders/prepare',  responsebody);
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('prepare_submit_order_market Failed.');
      return {status: 404,data: 'prepare_submit_order_market Failed.',};
    }
  }
      
  async prepare_submit_order_limit(marketid,size,type,side,timeinforce,price) {
    // console.log('PREPARING ORDER');
    // console.log(VegaKeys.currentActiveKey);
    const responsebody = {'submission': {'marketID': marketid, 'partyID': VegaKeys.currentActiveKey,'price': price, 'side': side, 'size': size, 'timeInForce': timeinforce, 'type': type,},};
    // console.log(responsebody);
    try {
      let response = await axios.post(this.main_api + '/orders/prepare',  responsebody);
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('prepare_submit_order_limit Failed.');
      return {status: 404,data: 'prepare_submit_order_limit Failed.',};
    }
  }

  //    Signs the transaction
  // {
  //     "signedTx": {
  //       "data": "dGVzdGRhdGEK",
  //       "sig": "...",
  //       "pubKey": "1122aabb..."
  //     }
  //   }    
  async signtx(blob, propagate = false) {
    let sign_api = 'https://wallet.n.vega.xyz/api/v1/messages';
    // console.log(VegaKeys.currentActiveKey);
    // console.log(this.currentActiveKey);
    const _header = 'Bearer ' + VegaKeys.token;
    // console.log(blob);
    // console.log('Header ' + _header );
    const data_ = {'tx': blob, 'pubKey': VegaKeys.currentActiveKey, 'propagate': propagate,};
    // console.log(data_);
    try {
      let response = await axios.post(sign_api, data_, { headers: { Authorization: _header,},} );
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Sign_Transaction Failed.');
      return {status: 404,data: 'Sign_Transaction Failed.',};
    }       
  }


  // #submits the transaction
  // {
  //     "success": true
  //     }
  async submit_transaction(data,sig) {
    let responsebody = {'tx': {'data': data,'pubKey': this.currentActiveKey,'sig': sig,},};    
    // console.log(responsebody);    
    try {
      let response= await axios.post(this.main_api + '/transaction', responsebody);
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Submit_transaction Failed.');
    }
  }
    
        
  // cancels the order
  // {
  //     "blob": "string"
  //     }
  async cancel_order(markid,orderid) {
    let url = 'https://lb.n.vega.xyz/orders/prepare/' + orderid;
    let responsebody = {'marketID': markid,'partyID': VegaKeys.currentActiveKey,};
    let headers = {'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods':'GET,PUT,POST,DELETE,PATCH,OPTIONS',};
    // console.log(responsebody);
    // console.log(url);
    try {
      let preparingOrder= await axios.delete(url, {params: responsebody,}, { crossdomain: true },); 
      // console.log(response);
      if ( preparingOrder.status == 200 ) {
        let msg_ = ' Deletion request has been successfully prepared.';
        // console.log(msg);
        const blob = preparingOrder.data.blob;

        try{          //SIGNING PREPARED ORDER
          // console.log(blob);
          const transactionSign = await this.signtx(blob,true);  //Propogating the transaction
          // console.log(transactionSign);
          if (transactionSign.status == 200) {    //IF SUCCESSFUL
            let msg = 'Deletion request has been successfully signed and propogated into the chain.';
            // console.log(msg);    
            return {status:transactionSign.status, message:msg,};
        }
        else {      //Else for signing order
          let msg = 'Deletion request\'s signature transaction failed';
          // console.log(msg);
          return {status:transactionSign.status, message:msg,};
        }
      }
      catch (err) {  //catch for signing order
        let msg = ' Order signature for deletion request returned error';
        // console.log(msg);
        return {status:404, message:msg,};
      }
    }
    else {
      let msg = 'Deletion Order preparation failed';
      // console.log(msg);
      return {status:preparingOrder.status, message:msg,};
    } 
    }
    catch {
      // console.log('Cancel Order preparation Failed.');
      return {status: 404,message: 'Cancel Order preparation Failed.'};      
    }
  }    

  // cancels the order
  // {
  //     "blob": "string"
  //     }
  async amend_order(markid,orderid) {
    let responsebody = {'marketID': markid,'orderID': orderid,'partyID': this.currentActiveKey,};
    try {
      let response= await axios.delete( this.main_api+'/orders/prepare' + orderid,  responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Amend Order Failed.');
    }
  }    

  // GETS THE DATA OF ALL THE MARKETS
  //     {
  //   'markets': [
  //     {           # Example of 1 market, a list of these objects is returned
  //       'id': 'LBXRA65PN4FN5HBWRI2YBCOYDG2PBGYU',
  //       'name': 'GBPVUSD/OCT20',
  //       'tradableInstrument': {
  //         'instrument': {
  //           'id': 'Crypto/GBPVUSD/Futures/Oct20',
  //           'code': 'CRYPTO:GBPVUSD/OCT20',
  //           'name': 'October 2020 GBP vs VUSD future',
  //           'baseName': 'GBP',
  //           'quoteName': 'VUSD',
  //           'responsebody': {
  //             'tags': [
  //               'asset_class:fx/crypto',
  //               'product:futures'
  //             ]
  //           },
  //           'initialMarkPrice': '130000',
  //           'future': {
  //             'maturity': '2020-10-30T22:59:59Z',
  //             'asset': 'VUSD',
  //             'ethereumEvent': {
  //               'contractID': '0x0B484706fdAF3A4F24b2266446B1cb6d648E3cC1',
  //               'event': 'price_changed',
  //               'value': '126000'
  //             }
  //           }
  //         },                  #instrument bracket close
  //         'marginCalculator': {
  //           'scalingFactors': {
  //             'searchLevel': 1.1,
  //             'initialMargin': 1.2,
  //             'collateralRelease': 1.4
  //           }
  //         },
  //         'logNormalRiskModel': {
  //           'riskAversionParameter': 0.01,
  //           'tau': 0.00011407711613050422,
  //           'params': {
  //             'mu': 0,
  //             'r': 0.016,
  //             'sigma': 0.09
  //             }
  //         }
  //       },                #tradable instrument bracket close
  //       'decimalPlaces': '5',
  //       'continuous': {
  //         'tickSize': '0'
  //       }
  //     },
  //     }
  async get_markets() {
    try {
      let response = await axios.get(this.main_api + '/markets');
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get Markets Failed.');
      return {status: 404,data: 'Get Markets Failed',};
    }
  }    


  // Gets List of markets Data
  //     {'marketsData': [{'markPrice': '23135052', 'bestBidPrice': '23101998', 'bestBidVolume': '183', 'bestOfferPrice': '23135052', 'bestOfferVolume': '125', 'midPrice': '23118525', 'market': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67', 'timestamp': '1593645095537541796'},
  //                     {'markPrice': '123826', 'bestBidPrice': '123825', 'bestBidVolume': '18716', 'bestOfferPrice': '123826', 'bestOfferVolume': '6901', 'midPrice': '123825', 'market': 'LBXRA65PN4FN5HBWRI2YBCOYDG2PBGYU', 'timestamp': '1593645095537541796'},
  //                     {'markPrice': '2500', 'bestBidPrice': '2500', 'bestBidVolume': '515', 'bestOfferPrice': '2501', 'bestOfferVolume': '28', 'midPrice': '2500', 'market': 'RTJVFCMFZZQQLLYVSXTWEN62P6AH6OCN', 'timestamp': '1593645095537541796'}]}
  async get_list_of_markets() {
    try {
      let response = await axios.get(this.main_api + '/markets-data');
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get list of Markets Failed.');
    }
  }    
    
  //     {'marketData': {'markPrice': '23138017', 'bestBidPrice': '23101998', 'bestBidVolume': '183', 'bestOfferPrice': '23138017', 'bestOfferVolume': '488', 'midPrice': '23120007', 'market': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67', 'timestamp': '1593645237475712568'}}
  async get_market_data_by_id(id) {
    try {
      let response = await axios.get(this.main_api + '/markets-data/' + id);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get Market Data by ID Failed.');
    }
  }    
    
  //     {'market':
  //         {'id': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67',
  //         'name': 'ETHVUSD/DEC20',
  //         'tradableInstrument': {
  //             'instrument': {
  //                     'id': 'Crypto/ETHVUSD/Futures/Dec20',
  //                     'code': 'CRYPTO:ETHVUSD/DEC20',
  //                     'name': 'December 2020 ETH vs VUSD future',
  //                     'baseName': 'ETH',
  //                     'quoteName': 'VUSD',
  //                     'responsebody': {'tags': ['asset_class:fx/crypto', 'product:futures']},
  //                     'initialMarkPrice': '1410000',
  //                     'future': {
  //                         'maturity': '2020-12-31T23:59:59Z',
  //                         'asset': 'VUSD',
  //                         'ethereumEvent': {'contractID': '0x0B484706fdAF3A4F24b2266446B1cb6d648E3cC1', 'event': 'price_changed', 'value': '1500000'}
  //                     }
  //             },
  //             'marginCalculator': {'scalingFactors': {'searchLevel': 1.1, 'initialMargin': 1.2, 'collateralRelease': 1.4}},
  //             'logNormalRiskModel': {'riskAversionParameter': 0.001, 'tau': 0.00011407711613050422, 'params': {'mu': 0, 'r': 0.016, 'sigma': 1.5}}
  //         },
  //         'decimalPlaces': '5',
  //         'continuous': {'tickSize': '0'}
  //         }
  //     }    WORKS
  async get_market_by_id(id) {
    let url = this.main_api + '/markets/' + id;
    try {
      let response = await axios.get(url);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get market by id Failed.');
    }
  }    

    
  async get_accounts_by_market(id,asset) {
    let responsebody = {'asset':asset,};
    try {
      let response = await axios.get(this.main_api + '/markets/' + id + '/accounts',responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get accounts by market Failed.');
    }
  }    

  // #NOT WORKING
    async get_candles_by_market_id(id,timestamp,intervals) {
      let async_url = '/markets/' + id + '/candles';
      let responsebody = {'sinceTimestamp':timestamp,'interval':intervals,};
      // console.log(async_url + '   ' + responsebody);
      try {
        let response= await axios.get(this.main_api + async_url,  { params: responsebody, } );
        // console.log(response);
        return {status: response.status,data:  response.data,};
      }
      catch {
        // console.log('Get candles by market Failed.');
        return {status: 404, data: 'API call failed' };
      }
    }    

  async get_market_depth(id,depth) {
    let responsebody = {'maxDepth':depth,};
    try {
      let response= await axios.get(this.main_api + '/markets/'+id+'/depth',responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get market depth Failed.');
    }
  }    
    
  async get_orders_by_market(id,skip,limit,desc,open) {
    let responsebody = {'pagination.skip': skip , 'pagination.limit': limit,'pagination.descending':desc,'open':open,};
    try {
      let response = await axios.get(this.main_api + '/markets/'+id+'/orders', responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get orders by market Failed.');
    }
  }    

    
  async get_order_by_market_orderid(markid,orderid) {
    let path = '/markets/' + markid + '/orders/' + orderid;
    try {
      let response= await axios.get(this.main_api + path);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get orders by markt orderID Failed.');
    }
  }    

  async get_trades_by_market(markid,skip,limit,desc = true) {
    let path = '/markets/' + markid + '/trades';
    let responsebody = {'pagination.skip': skip , 'pagination.limit': limit,'pagination.descending':desc,};
    try {
      let response= await axios.get(this.main_api + path, responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get trades by market Failed.');
    }
  }    

  // #TESTED.WORKED.
  //     '''{
  //           'trade': {
  //             'id': 'V0001020492-0047497446-0000000001',
  //             'marketID': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67',
  //             'price': '23163983',
  //             'size': '9',
  //             'buyer': '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633',
  //             'seller': '65a3231465ffaf4f4182c57d7f7f2f7b1394934be462ed2c8b6cdedad67fbb08',
  //             'aggressor': 'Sell',
  //             'buyOrder': 'V0001020304-0047488412',
  //             'sellOrder': 'V0001020492-0047497446',
  //             'timestamp': '1593646061008593739',
  //             'type': 'DEFAULT'
  //           }
  //         }
  async get_latest_trade(markid) {
    let path = '/markets/' + markid + '/trades/latest';
    try {
      let response= await axios.get(this.main_api + path);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get latest trade Failed.');
    }
  }    
    
  // #TESTED.WORKED
  //     {
  //       'trades': [
  //         {
  //           'id': 'V0001020492-0047497446-0000000001',
  //           'marketID': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67',
  //           'price': '23163983',
  //           'size': '9',
  //           'buyer': '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633',
  //           'seller': '65a3231465ffaf4f4182c57d7f7f2f7b1394934be462ed2c8b6cdedad67fbb08',
  //           'aggressor': 'Sell',
  //           'buyOrder': 'V0001020304-0047488412',
  //           'sellOrder': 'V0001020492-0047497446',
  //           'timestamp': '1593646061008593739',
  //           'type': 'asyncAULT'
  //         },
  //         {
  //           'id': 'V0001020493-0047497456-0000000000',
  //           'marketID': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67',
  //           'price': '23163983',
  //           'size': '11',
  //           'buyer': '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633',
  //           'seller': '131170bfd28a095ebbd43173e8c8aafcb657a3406352f4be663efc26df335702',
  //           'aggressor': 'Sell',
  //           'buyOrder': 'V0001020304-0047488412',
  //           'sellOrder': 'V0001020493-0047497456',
  //           'timestamp': '1593646061782132046',
  //           'type': 'asyncAULT'
  //         },
  //         {
  //           'id': 'V0001020493-0047497457-0000000000',
  //           'marketID': 'VHSRA2G5MDFKREFJ5TOAGHZBBDGCYS67',
  //           'price': '23163983',
  //           'size': '43',
  //           'buyer': '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633',
  //           'seller': '352e0c5bd28845ab8934d8ed0263a9d8a2fd08690c09a301668a6ae2263f4160',
  //           'aggressor': 'Sell',
  //           'buyOrder': 'V0001020304-0047488412',
  //           'sellOrder': 'V0001020493-0047497457',
  //           'timestamp': '1593646061782132046',
  //           'type': 'asyncAULT'
  //         }
  //       ]
  //     }
  async get_trades_by_orderid(orderid) {
    let path = '/orders/' + orderid + '/trades';
    try {
      let response= await axios.get(this.main_api + path);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get trades by orderID Failed.');
    }
  }    
    
  async get_allorders_by_orderid(orderid,skip,limit,desc = true) {
    let path = '/orders/' + orderid + '/versions';
    let responsebody = {'pagination.skip': skip , 'pagination.limit': limit,'pagination.descending':desc,};
    try {
      let response= await axios.get(this.main_api + path, responsebody );
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get all orders by orderID Failed.');
    }
  }    

  async get_order_by_pendingorderref(order_ref) {
    let path = '/orders/' + order_ref;
    try {
      let response= await axios.get(this.main_api + path);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get orders by pending orders REF. Failed.');
    }
  }    
    
  // #TESTED.WORKED
  // {
  //   'parties': [
  //     {'id': 'b030b62f6d8bab518a44400faa2877e9e78af48c08144e40b64f5781c1c3f817'},
  //     {'id': 'eb0f9067909eb39474a79b8605ff904a52272a0a9b4019219f02709f6a76f62b'},
  //     {'id': '807938340e39af0bc1b3a1c668ad0a85c498864d8ec4e8bb3ca2cf04026eea0e'},.....(a long list)
  //    ]
  // }
  async get_parties() {
    try {
      let response= await axios.get(this.main_api + '/parties');
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get parties Failed.');
    }
  }    
    
  // #TESTED.WORKED.
  //     {'party': {'id': 'b030b62f6d8bab518a44400faa2877e9e78af48c08144e40b64f5781c1c3f817'}}

  async get_party_by_id(p_id) {
    try {
      let response= await axios.get(this.main_api + '/parties/' + p_id);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get parties by ID Failed.');
    }
  }    
    
    
  async get_accounts_by_party(partyid,markid,type,asset) {
    let path = '/parties/' + partyid + '/accounts';
    let responsebody = {'marketID':markid,'type':type,'asset':asset,};
    try {
      let response= await axios.get(this.main_api + path,responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get accounts by party Failed.');
    }
  }    
    
    
  async get_margin_levels_by_party(partyid,marketid) {
    let path = '/parties/' + partyid + '/markets/' + marketid + '/margin';
    try {
      let response= await axios.get(this.main_api + path);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get margin levels by party Failed.');
    }
  }    
  //WORKING
  async get_orders_by_party(partyid,skip=0,limit=20,desc = true,open_=true) {
    let path = '/parties/' + partyid + '/orders';
    let responsebody = {'pagination.skip': skip,'pagination.limit': limit,'pagination.descending':desc,'open':open_,};
    try {
      let response= await axios.get(this.main_api + path, { params: responsebody, });
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get orders by party Failed.');
      return {status: 404,data: 'Get orders by party Failed.',};
    }
  }    
  //WORKS
  async get_all_positions() {
    let partyid = VegaKeys.pubKeys[0];
    let path = '/parties/' + partyid + '/positions';
    try {
      let response= await axios.get(this.main_api + path);
      // console.log(response);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get positions by party Failed.');
      return {status: 404,data: 'Get positions by party Failed',};
    }
  }    

  
  async get_positions_by_party_and_market(partyid,markid) {
    let path = '/parties/' + partyid + '/positions';
    let responsebody = {'marketID':markid,};
    try {
      let response= await axios.get(this.main_api + path, responsebody);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get positions by party Failed.');
    }
  }    
    
  async get_trades_by_party(partyid,markid = '',skip=0,limit=20,desc = true) {
    let path = '/parties/' + partyid + '/trades';
    let responsebody = {'marketID':markid,'pagination.skip': skip,'pagination.limit': limit,'pagination.descending':desc,};
    try {
      let response= await axios.get(this.main_api + path,  { params: responsebody, } );
      // console.log(response);
      // console.log(response.data);
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get trades by party Failed.');
      return {status: 404,data: 'Get trades by party Failed',};
    }
  }    
    
    
  // #TESTED.WORKED
  //     {'blockHeight': '1022093', 'backlogLength': '117', 'totalPeers': '5', 'genesisTime': '2020-06-22T11:00:22Z',
  //       'currentTime': '2020-07-01T23:49:07.031235683Z', 'vegaTime': '2020-07-01T23:49:05.267949357Z', 'status': 'CONNECTED',
  //       'txPerBlock': '48', 'averageTxBytes': '298', 'averageOrdersPerBlock': '46', 'tradesPerSecond': '41', 'ordersPerSecond': '53',
  //       'totalMarkets': '3', 'totalAmendOrder': '0', 'totalCancelOrder': '20', 'totalCreateOrder': '47574360', 'totalOrders': '47574360',
  //       'totalTrades': '32277295', 'orderSubscriptions': 0, 'tradeSubscriptions': 0, 'candleSubscriptions': 0,
  //       'marketDepthSubscriptions': 0, 'positionsSubscriptions': 0, 'accountSubscriptions': 0, 'marketDataSubscriptions': 0,
  //       'appVersionHash': 'cc332c27', 'appVersion': 'v0.19.0', 'chainVersion': '0.32.9', 'blockDuration': '905499456',
  //       'uptime': '2020-06-22T11:17:11.200760432Z'}
  async get_Statistics() {
    try {
      let response= await axios.get(this.main_api + '/statistics');
      return {status: response.status,data: response.data,};
    }
    catch {
      // console.log('Get Statistics Failed.');
    }
  }    
}

export default new VegaProtocolService();

