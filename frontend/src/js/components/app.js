import { LitElement, html } from 'lit-element';
import {directive} from 'lit-html';
import './edit.js';
import './welcome.js';
import './header.js';
import './error.js';
import {io} from "socket.io-client";
var config = require('../config/config.js');
const axios = require('axios');

class App extends LitElement {
  constructor() {
    super();
    this.global_error = false
    this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    this.socket = io(this.backend_url);
    this.resolvePromise = directive((promise) => (part) => {
      Promise.resolve(promise).then((resolvedValue) => {
        //once all properties have been initalize, update UI and pass properties down to children
        if(resolvedValue && !this.global_error){ //we are currently on a youtube page
          part.setValue(html`
          <cs-header .authenticated="${this.authenticated}"></cs-header>
          <cs-edit id="cs-edit" .user_id="${this.user_id}" .youtube_url="${this.youtube_url}" .authenticated="${this.authenticated}"></cs-edit>`
          );
          part.commit();
        }else if(this.global_error){ //some unexpected error occured
          part.setValue(html`<cs-error></cs-error>`);
          part.commit();
        }else{ //we are not on a youtube page
          part.setValue(html`<cs-welcome></cs-welcome>`);
          part.commit();
        }
      });
    });
  }

	static get properties() {
    return {
      youtube_url: {type: String},
      user_id: {type: String},
      authenticated: {type: Boolean},
      global_error: {type: Boolean} //display error page for any unexpected error
    };
  }

  //initialize this.user_id and this.youtube_url. Then update UI accordingly
  insertUI(){
    let promise = new Promise((resolve,reject) => {
      const gettingStoredSettings = browser.storage.local.get();
      gettingStoredSettings.then(storedSettings => {
        this.user_id = storedSettings.user_id //initialize this user_id
        if(storedSettings.auth){
          this.authenticated = true
        }else{
          this.authenticated =false
        }
        let callback = function(tabs){
          const regex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/g;
          if(tabs[0].url.match(regex)){
            this.youtube_url = tabs[0].url
            browser.storage.local.set({youtube_tab:tabs[0].id});
            resolve(true)
          }else{
            resolve(false)
          }
        }
        let callbackBind = callback.bind(this);
        browser.tabs.query({active: true, currentWindow: true}).then(callbackBind)
      });
    })
    return promise
  }

  //asynchronously fetch all the data before displaying child components
  render() {
    return html`
      ${this.resolvePromise(this.insertUI())}
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