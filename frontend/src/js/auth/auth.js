const OAuth = require('oauth-1.0a');
var CryptoJS = require("crypto-js");
const axios = require('axios');
var config = require('../config/config.js');

const backend_URL = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port

export function getAccessToken(message){
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
  return axios(request_data)
}

export function login(){
  axios.get(backend_URL + '/authorize_app')
       .then(response => {
         browser.tabs.create({
           url: "https://api.twitter.com/oauth/authenticate?oauth_token=" + response.data["oauth_token"],
         });
       })
}
