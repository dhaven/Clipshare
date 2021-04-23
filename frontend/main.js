const axios = require('axios');
//import './src/js/components/app.js';
import './src/js/components/dummy_app.js';

browser.runtime.onMessage.addListener((message,sender) => {
  if('refresh' in message){
    document.querySelector("dummy-app").authenticated = true
  }
});
