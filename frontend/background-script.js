const axios = require('axios');
var config = require('./src/js/config/config.js');
const backend_URL = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
browser.runtime.onMessage.addListener((message,sender) => {
  if('query_string' in message){
    browser.tabs.remove(sender.tab.id)
    const gettingStoredSettings = browser.storage.local.get();
    gettingStoredSettings.then(storedSettings => {
      //redirect user to youtube tab
      browser.tabs.update(
        storedSettings.youtube_tab,{active: true}
      )
      //finish login flow by retrieving access tokens
      let data = message.query_string.split('&');
      var result = {};
      data.forEach(element => {
        var item = element.split("=");
        result[item[0]] = item[1];
      });
      const request_data = {
        url: backend_URL + '/access_token',
        method: 'POST',
        data: { oauth_token: result['oauth_token'],
                oauth_verifier: result['oauth_verifier']
              },
      }
      axios(request_data).then(result => {
        browser.storage.local.set({auth:result.data});
        //force render of popup if it is open
        browser.runtime.sendMessage({"refresh": true});
      })
    })
  }
});
