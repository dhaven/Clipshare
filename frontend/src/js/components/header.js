import { LitElement, html } from 'lit-element';
import {directive} from 'lit-html';
import {login} from '../auth/auth.js';
var config = require('../config/config.js');
const axios = require('axios');

class Header extends LitElement {
  constructor() {
    super();
    this.authenticated = false
		this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    this.resolvePromise = directive((promise) => (part) => {
      Promise.resolve(promise).then((resolvedValue) => {
        if(resolvedValue.state == 'AUTHENTICATED'){ //user is logged in so display his profile pic
          part.setValue(html`
          <div id='user-icon' class="cs-banner">
            <img src="${resolvedValue.value}" @click="${this.userLogin}">
          </div>
          <hr/>
          `);
          part.commit();
        }else{ // user is not logged in so display default profile pic
          part.setValue(html`
            <div id='user-icon' class="cs-banner">
              <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 0 24 24" width="40px" fill="#000000" @click="${this.userLogin}">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/>
              </svg>
            </div>
            <hr/>`
          );
          part.commit();
        }
      });
    });
  }

	static get properties() {
    return {
      authenticated: {type: Boolean},
    };
  }

  userLogin(){
    if(this.authenticated){ //if user is logged in, log him out
      browser.storage.local.remove('auth')
      this.parentNode.authenticated = false
    }else{ //log in user
      login()
    }
  }

  //Decide what profile picture to display based on the user logged in state
  selectProfilePic(){
    let promise = new Promise((resolve,reject) => {
      if(this.authenticated){
        const gettingStoredSettings = browser.storage.local.get();
        gettingStoredSettings.then(storedSettings => {
          axios({
            method: 'post',
            url: this.backend_url + '/auth/profile',
            data: {
              auth: storedSettings.auth
            }
          }).then(response => {
            resolve({state:"AUTHENTICATED", value:response.data.profile_image_url_https})
          })
          .catch(function (error) {
            reject(error.toJSON())
            console.log(`Fatal error occurred: ${error}`);
            this.parentNode.global_error = true
          });
        });
      }else{
        resolve({state:"UNAUTHENTICATED"})
      }
    });
    return promise
  }

  render() {
    console.log("cs-header is rendering")
    return html`
      ${this.resolvePromise(this.selectProfilePic())}
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
customElements.define('cs-header', Header);