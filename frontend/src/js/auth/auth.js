const OAuth = require('oauth-1.0a');
const axios = require('axios');
var config = require('../config/config.js');

const backend_URL = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port

export function login(){
  axios.get(backend_URL + '/auth/authorize_app')
       .then(response => {
         browser.tabs.create({
           url: "https://api.twitter.com/oauth/authenticate?oauth_token=" + response.data["oauth_token"],
         });
       })
}
