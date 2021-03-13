import { LitElement, html } from 'lit-element';
import {until} from 'lit-html/directives/until.js';
import './welcome.js';
import './edit.js';
import {io} from "socket.io-client";
var config = require('../config/config.js');

class App extends LitElement {
  constructor() {
    super();
    this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    this.socket = io(this.backend_url);
  }

  insertUI(){
    let callback = function(tabs){
      const regex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/g;
      if(tabs[0].url.match(regex)){
        this.youtube_url = tabs[0].url
        browser.storage.local.set({youtube_tab:tabs[0].id});
        return html`
          <cs-edit id="cs-edit"></cs-edit>
        `;
      }else{
        return html`
          <cs-welcome></cs-welcome>
        `;
      }
    }
    let callbackBind = callback.bind(this);
    return browser.tabs.query({active: true, currentWindow: true}).then(callbackBind)
  }

  render() {
    return html`
      ${until(this.insertUI())}
    `;
  }

  createRenderRoot() {
  /**
   * Render template without shadow DOM. Note that shadow DOM features like
   * encapsulated CSS and slots are unavailable.
   */
    return this;
  }
}
customElements.define('cs-app', App);
