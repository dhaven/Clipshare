import { LitElement, html} from 'lit-element';
import {directive} from 'lit-html';
import videojs from 'video.js';
const axios = require('axios');
var config = require('../config/config.js');
import {login} from '../auth/auth.js';
import createPlayer from '../videojs/trimPlayer.js';

class Edit extends LitElement {
  constructor() {
    super();
    // the backend we talk to
    this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    //the current youtube url
    this.youtube_url = document.querySelector('#my-app').youtube_url
    // the video_id from the current youtube url
    //this.video_id = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(this.youtube_url))
    // set the socket listener so that UI is updated once video finishes downloading
    this.socket = document.querySelector('#my-app').socket

    //callback function to display UI to user based on the stage he is at in the editing process
    this.resolvePromise = directive((promise) => (part) => {
      console.log("init refresh UI")
      Promise.resolve(promise).then((resolvedValue) => {
        if(resolvedValue.state == 'INIT'){ //no video found so let the user decide if he want's to start editing this one
          part.setValue(html`<button id="start-editing" @click="${this.fetch_video}">Start editing !</button>`);
          part.commit();
        }else if(resolvedValue.state == 'EDIT'){ // let the user continue to work on his video
          part.setValue(html`
            <video id="my-player" class="video-js" preload="auto" controls>
            </video>
            <button id="share_on_twitter" @click="${this.trim}">finish</button>
          `
          );
          part.commit();
          this.player = createPlayer('my-player');
          this.player.src({
            src: resolvedValue.value,
            type: 'video/mp4'
          });
        }else if(resolvedValue.state == 'SUBMIT'){
          part.setValue(html`
            <button id="back" @click="${this.back_to_edit}"><- Back to edit</button>
            <video id="my-player" class="video-js" preload="auto" controls>
            </video>
            <input id="editBox" type="text"></input>
            <button id="tweet" @click="${this.tweet}">tweet</button>
          `
          );
          part.commit();
          this.player = videojs('my-player');
          this.player.src({
            src: resolvedValue.value,
            type: 'video/mp4'
          });
        }
        else if(resolvedValue.state == 'NOT LOGGED IN'){
          part.setValue(html`
            Please log in to Twitter first.
          `
          );
          part.commit();
        }
      });
    });
  }

  /*
  Fetches a video from youtube
  */
  fetch_video(){
    this.socket.on(this.socket.id + "-download-finish", (arg) => {
      console.log("update UI because received confirmation that video finished downloading")
      browser.storage.local.set({editing:true});
      this.requestUpdate();
    });
    axios({
      method: 'post',
      url: this.backend_url + '/get',
      data: {
        url: this.youtube_url,
        ws: this.socket.id
      }
    }).then(response => {
      console.log("setting local videoId value to :" + response.data.video_id)
      browser.storage.local.set({video_id:response.data.video_id});
    })
    .catch(function (error) {
      console.log(error.toJSON());
    });
  }

  /*
  Tweet a video and text
  */
  tweet(){
    this.socket.on(this.socket.id + "-tweet-finish", (arg) => {
      console.log("update UI because received confirmation that video was tweeted")
    });
    const gettingStoredSettings = browser.storage.local.get();
    gettingStoredSettings.then(
      storedSettings => {
        axios.post(this.backend_url + '/tweetvideo',{
          oauth_token: storedSettings.auth.oauth_token,
          oauth_token_secret: storedSettings.auth.oauth_token_secret,
          video_id: storedSettings.video_id,
          message: document.getElementById("editBox").value,
          ws: this.socket.id
        }).then(response => {
          console.log(response)
        }).catch(error => {
          console.log(error);
        });

      },
      error => {
      console.log(`Error: ${error}`);
      }
    );
  };

  /*
  trim a video based on user defined start and end time
  */
  trim(){
    this.socket.on(this.socket.id + "-trim-finish", (arg) => {
      console.log("update UI because received confirmation that video finished trimming")
      browser.storage.local.set({editing:false});
      this.requestUpdate();
    });
    const gettingStoredSettings = browser.storage.local.get();
    gettingStoredSettings.then(storedSettings => {
      let player = videojs.getPlayer("my-player")
      axios({
        method: 'post',
        url: this.backend_url + '/trim',
        data: {
          video_id: storedSettings.video_id,
          start: player.formatTrimStart(),
          duration: player.formatTrimDuration(),
          ws: this.socket.id
        }
      }).then(response => {
        browser.storage.local.set({video_id:response.data.video_id});
      }).catch(error => {
        console.log(error);
      });
    },
    error => {
    console.log(`Error: ${error}`);
    });
  }

  /*
    onclick for when the user wishes to resume editing the video
  */
  back_to_edit(){
    browser.storage.local.set({editing:true});
    this.fetch_video() //this will trigger a render
  }

  /*
  Decide if the user should be shown the WELCOME UI, the EDIT VIDEO UI or the SUBMIT VIDEO UI
  */
  initOrResume(){
    const gettingStoredSettings = browser.storage.local.get();
    let promise = gettingStoredSettings.then(storedSettings => {
      if (!storedSettings.video_id) {
        console.log("video not present. Display \"Start working on video\"")
        return {state:"INIT"}
      }else if(storedSettings.editing){
        console.log("user is working on video but hasn't logged in yet")
        let video_url = this.backend_url +'/'+storedSettings.video_id+'.mp4'
        return {state:"EDIT", value:video_url}
      }else if(!storedSettings.editing && !storedSettings.auth) {
        console.log("User needs to login before he can submit the video")
        login()
        return {state:"NOT LOGGED IN"}
      }else if(!storedSettings.editing && storedSettings.auth){
        console.log("Let the user submit the video")
        let video_url = this.backend_url +'/'+storedSettings.video_id+'.mp4'
        return {state:"SUBMIT", value:video_url}
      }
    });
    return promise
  }

  render() {
    if(document.querySelector('#my-player')){
      //if there is already a player in the UI. Dispose of it before it gets recreated
      console.log("trying to dispose video")
      this.player.dispose();
    }
    return html`
        ${this.resolvePromise(this.initOrResume())}
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
customElements.define('cs-edit', Edit);
