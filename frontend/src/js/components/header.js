import { LitElement, html } from 'lit-element';
import {directive} from 'lit-html';
import {login} from '../auth/auth.js';
var config = require('../config/config.js');
const axios = require('axios');

class DummyHeader extends LitElement {
  constructor() {
    super();
    this.authenticated = false
		this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    this.resolvePromise = directive((promise) => (part) => {
      Promise.resolve(promise).then((resolvedValue) => {
        if(resolvedValue.state == 'AUTHENTICATED'){ //user is logged in so display his profile pic
          part.setValue(html`
          <div id='user-icon' class="cs-banner">
          <svg width="100px" height="36px" version="1.1" viewBox="0 0 116.745 50.5338" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
              <metadata>
              <rdf:RDF>
                <cc:Work rdf:about="">
                <dc:format>image/svg+xml</dc:format>
                <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
                <dc:title/>
                </cc:Work>
              </rdf:RDF>
              </metadata>
              <g transform="translate(1724.84 47.3074)">
              <path d="m-1723.62-46.0845v48.088h17.5271a38.68 37.2164 0 0 1-9.154-24.0456 38.68 37.2164 0 0 1 9.1571-24.0424z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2.44578"/>
              <g transform="matrix(6.11446 0 0 6.11446 9125.67 427.551)" stroke-width=".264583" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal" aria-label="CS">
                <path d="m-1771.64-73.5477c0 2.06374 1.7252 3.72027 3.8523 3.7359 1.597 0.01174 2.3535-0.889501 2.7704-1.5981 0.043-0.143918 0.2309-0.266631 0.1251-0.36188-0.092-0.102484-0.2291-0.18134-0.3929 0.05247-0.4058 0.771843-1.2325 1.41504-2.5026 1.38893-1.8517-0.03807-3.3337-1.44991-3.3337-3.21732 0-1.80974 1.4816-3.25966 3.3337-3.25966 0.7832 0 1.5028 0.275166 2.0743 0.719664 0.1059 0.08467 0.2752 0.07408 0.3599-0.05292 0.095-0.09525 0.074-0.275166-0.042-0.370416-0.6456-0.497415-1.4816-0.814914-2.3918-0.814914-2.1272 0.01058-3.8523 1.67216-3.8523 3.77824z" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal"/>
                <path d="m-1764.88-71.207c0.488 0.592738 1.6951 1.39521 2.8275 1.40579 0.7408 0 1.4075-0.222249 1.905-0.582081 0.4974-0.359833 0.836-0.888998 0.836-1.48166 0-0.592665-0.328-1.0795-0.8149-1.397-0.4868-0.328082-1.143-0.539748-1.8838-0.677331h-0.021c-0.6667-0.127-1.217-0.306916-1.5875-0.560915-0.3704-0.253999-0.5397-0.529165-0.5503-0.89958 0-0.380999 0.2117-0.740831 0.5821-1.016 0.3704-0.264583 0.9102-0.444499 1.5134-0.444499 0.8149 0 1.4499 0.402166 2.032 0.783164 0.1058 0.07408 0.254 0.04233 0.3175-0.0635 0.074-0.116417 0.042-0.254-0.063-0.328083-0.5821-0.380998-1.3123-0.857247-2.286-0.857247-0.6985 0-1.3229 0.201083-1.7886 0.539748-0.4656 0.338666-0.7726 0.825498-0.7726 1.38641 0 0.550331 0.307 0.99483 0.762 1.29116 0.4551 0.306916 1.0584 0.497415 1.7463 0.624415h0.021c0.7196 0.137583 1.3123 0.338665 1.7144 0.603248 0.4022 0.275166 0.6033 0.592665 0.6033 1.016 0 0.412748-0.2223 0.80433-0.635 1.10066-0.4022 0.296332-0.9843 0.486832-1.6298 0.486832-0.9631 0.01058-2.0288-0.684152-2.824-1.48608-0.1502-0.145961-0.2147-0.120108-0.2994-0.01428-0.074 0.09525 0.07 0.297375 0.1444 0.392257z" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal"/>
              </g>
              <path d="m-1609.32-46.0845v48.088h-17.5271a38.68 37.2164 0 0 0 9.1534-24.0456 38.68 37.2164 0 0 0-9.1564-24.0424z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2.44578"/>
              </g>
            </svg>
            <img src="${resolvedValue.value}" @click="${this.userLogin}">
          </div>
          `);
          part.commit();
        }else{ // user is not logged in so display default profile pic
          part.setValue(html`
            <div id='user-icon' class="cs-banner">
            <svg width="100px" height="36px" version="1.1" viewBox="0 0 116.745 50.5338" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
              <metadata>
              <rdf:RDF>
                <cc:Work rdf:about="">
                <dc:format>image/svg+xml</dc:format>
                <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
                <dc:title/>
                </cc:Work>
              </rdf:RDF>
              </metadata>
              <g transform="translate(1724.84 47.3074)">
              <path d="m-1723.62-46.0845v48.088h17.5271a38.68 37.2164 0 0 1-9.154-24.0456 38.68 37.2164 0 0 1 9.1571-24.0424z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2.44578"/>
              <g transform="matrix(6.11446 0 0 6.11446 9125.67 427.551)" stroke-width=".264583" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal" aria-label="CS">
                <path d="m-1771.64-73.5477c0 2.06374 1.7252 3.72027 3.8523 3.7359 1.597 0.01174 2.3535-0.889501 2.7704-1.5981 0.043-0.143918 0.2309-0.266631 0.1251-0.36188-0.092-0.102484-0.2291-0.18134-0.3929 0.05247-0.4058 0.771843-1.2325 1.41504-2.5026 1.38893-1.8517-0.03807-3.3337-1.44991-3.3337-3.21732 0-1.80974 1.4816-3.25966 3.3337-3.25966 0.7832 0 1.5028 0.275166 2.0743 0.719664 0.1059 0.08467 0.2752 0.07408 0.3599-0.05292 0.095-0.09525 0.074-0.275166-0.042-0.370416-0.6456-0.497415-1.4816-0.814914-2.3918-0.814914-2.1272 0.01058-3.8523 1.67216-3.8523 3.77824z" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal"/>
                <path d="m-1764.88-71.207c0.488 0.592738 1.6951 1.39521 2.8275 1.40579 0.7408 0 1.4075-0.222249 1.905-0.582081 0.4974-0.359833 0.836-0.888998 0.836-1.48166 0-0.592665-0.328-1.0795-0.8149-1.397-0.4868-0.328082-1.143-0.539748-1.8838-0.677331h-0.021c-0.6667-0.127-1.217-0.306916-1.5875-0.560915-0.3704-0.253999-0.5397-0.529165-0.5503-0.89958 0-0.380999 0.2117-0.740831 0.5821-1.016 0.3704-0.264583 0.9102-0.444499 1.5134-0.444499 0.8149 0 1.4499 0.402166 2.032 0.783164 0.1058 0.07408 0.254 0.04233 0.3175-0.0635 0.074-0.116417 0.042-0.254-0.063-0.328083-0.5821-0.380998-1.3123-0.857247-2.286-0.857247-0.6985 0-1.3229 0.201083-1.7886 0.539748-0.4656 0.338666-0.7726 0.825498-0.7726 1.38641 0 0.550331 0.307 0.99483 0.762 1.29116 0.4551 0.306916 1.0584 0.497415 1.7463 0.624415h0.021c0.7196 0.137583 1.3123 0.338665 1.7144 0.603248 0.4022 0.275166 0.6033 0.592665 0.6033 1.016 0 0.412748-0.2223 0.80433-0.635 1.10066-0.4022 0.296332-0.9843 0.486832-1.6298 0.486832-0.9631 0.01058-2.0288-0.684152-2.824-1.48608-0.1502-0.145961-0.2147-0.120108-0.2994-0.01428-0.074 0.09525 0.07 0.297375 0.1444 0.392257z" style="font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal"/>
              </g>
              <path d="m-1609.32-46.0845v48.088h-17.5271a38.68 37.2164 0 0 0 9.1534-24.0456 38.68 37.2164 0 0 0-9.1564-24.0424z" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2.44578"/>
              </g>
            </svg>
              <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 0 24 24" width="40px" fill="#000000" @click="${this.userLogin}">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/>
              </svg>
            </div>`
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
          });
        });
      }else{
        resolve({state:"UNAUTHENTICATED"})
      }
    });
    return promise
  }

  render() {
    console.log("dummy-header is rendering")
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
customElements.define('dummy-header', DummyHeader);