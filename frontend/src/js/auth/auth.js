const OAuth = require('oauth-1.0a');
var CryptoJS = require("crypto-js");
const axios = require('axios');

export function getAccessToken(message,sender){
  let data = message.query_string.split('&');
  var result = {};
  data.forEach(element => {
    var item = element.split("=");
    result[item[0]] = item[1];
  });
  const request_data = {
    url: 'http://localhost:2020/access_token',
    method: 'POST',
    data: { oauth_token: result['oauth_token'],
            oauth_verifier: result['oauth_verifier']
          },
  }
  return axios(request_data)
}

export function login(){
  axios.get('http://localhost:2020/authorize_app')
       .then(response => {
         browser.tabs.create({
           url: "https://api.twitter.com/oauth/authenticate?oauth_token=" + response.data["oauth_token"],
         });
       })
}
