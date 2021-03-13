const axios = require('axios');
import './src/js/components/app.js';

browser.runtime.onMessage.addListener((message,sender) => {
  if('refresh' in message){
    document.querySelector("cs-edit").requestUpdate()
  }
});
