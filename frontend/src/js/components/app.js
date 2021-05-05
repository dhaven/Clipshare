import { LitElement, html } from 'lit-element';
import {directive} from 'lit-html';
import './edit.js';
import './welcome.js';
import './header.js';
import './error.js';
import './loading.js';
import './start_edit.js';
import './edit.js';
import './login.js';
import './submit.js';
import './tweet_result.js';
import {io} from "socket.io-client";
import videojs from 'video.js';
import createPlayer from '../videojs/trimPlayer.js';
var config = require('../config/config.js');
const axios = require('axios');


class App extends LitElement {
  constructor() {
    super();
    this.authenticated = false;
    this.global_error = false
    this.loading = ''
    this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    this.socket = io(this.backend_url);
    this.InitComponents = directive((promise) => (part) => {
      Promise.resolve(promise).then((resolvedValue) => {
        if(this.global_error){
          part.setValue(html`<cs-error></cs-error>`);
          part.commit();
        }
        else if(this.loading != ''){
          part.setValue(html`
          <cs-header .authenticated="${this.authenticated}"></cs-header>
          <cs-loading .message="${this.loading}"></cs-loading>
          `)
          part.commit();
        }
        else if(resolvedValue.stage == -2){ //Display force login
          this.stage = -2
          part.setValue(html`
            <cs-header .authenticated="${this.authenticated}"></cs-header>
            <cs-login></cs-login>
          `);
          part.commit();
        }
        else if(resolvedValue.stage == -1){ //Display no video found
          this.stage = -1
          part.setValue(html`
            <cs-welcome></cs-welcome>
          `);
          part.commit();
        }else if(resolvedValue.stage == 0){ //Display "start edit"
          this.stage = 0
          part.setValue(html`
            <cs-header .authenticated="${this.authenticated}"></cs-header>
            <cs-start-edit .fetch_video="${this.fetch_video.bind(this)}"></cs-start-edit>
          `);
          part.commit();
        }else if(resolvedValue.stage == 1){ //Display "edit"
          this.stage = 1
          part.setValue(html`
            <cs-header .authenticated="${this.authenticated}"></cs-header>
            <cs-edit 
              .trim="${this.trim.bind(this)}" 
              .video_url="${resolvedValue.video_url}" 
              .create_player="${this.create_player.bind(this)}" 
              .destroy_player="${this.destroy_player.bind(this)}">
            </cs-edit>
          `);
          part.commit();
        }else if(resolvedValue.stage == 2){ //Display "submit"
          this.stage = 2
          part.setValue(html`
            <cs-header .authenticated="${this.authenticated}"></cs-header>
            <cs-submit 
              .video_url="${resolvedValue.video_url}"
              .back_to_edit="${this.back_to_edit.bind(this)}"
              .tweet="${this.tweet.bind(this)}"
              .create_player="${this.create_player.bind(this)}" 
              .destroy_player="${this.destroy_player.bind(this)}">
            </cs-submit>
          `);
          part.commit();
        }else if(resolvedValue.stage == 3){ //Display ""tweet sent
          this.stage = 4
          part.setValue(html`
            <cs-header .authenticated="${this.authenticated}"></cs-header>
            <cs-tweet-result
              .tweet_url="${resolvedValue.tweet_url}"
            </cs-tweet-result>
          `);
          part.commit();
        }
      }).catch(error => {
        console.log(error)
        this.global_error = true
        if(this.global_error){
          part.setValue(html`<cs-error></cs-error>`);
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
      global_error: {type: Boolean}, //display error page for any unexpected error
      loading: {type: String}, //the loading screen message that is displayed
      stage: {type: Number}, // [-2;4]
      error: {type: String}
    };
  }

  create_player(trimBarPresent){
    this.player = createPlayer("my-player", {width:"320px",height:"180px"})
		this.player.updateProgressControl(trimBarPresent)
  }

  destroy_player(){
    if (this.player) {
      this.player.dispose()
    }
    this.player = null;
  }

  /*
  Fetches a video from youtube
  */
  fetch_video(){
    this.socket.on(this.socket.id + "-download-finish", (arg) => {
      if(arg.status == "success"){
        console.log("download finished")
        this.stage = 1; //moving to edit stage
        this.loading = ''; //stop loading animation
      }else{
        this.global_error = true;
      }
    });
    axios({
      method: 'get',
      url: this.backend_url + '/video',
      params: {
        url: this.video_url,
        user_id: this.user_id,
        ws: this.socket.id
      },
    }).then(() => {
      this.loading = 'Fetching video, hold tight...'
    })
    .catch( error => {
      console.log(`Fatal error occurred: ${error}`);
      this.global_error = true
    });
  }

    /*
  trim a video based on user defined start and end time
  block trim if video is more than 2 minutes
  */
  trim(){
    this.socket.on(this.socket.id + "-trim-finish", (arg) => {
      if(arg.status == "success"){
        this.stage = 2; //moving to tweet stage
        this.loading = ''; //stop loading animation
      }else{
        this.global_error = true;
      }
    });
    let player = videojs.getPlayer("my-player")
    if((player.cache_.endTrimTime - player.cache_.startTrimTime)*player.duration() > 120){
      this.error = "Video cannot be more than 2m20s"
      return
    }
    axios({
      method: 'post',
      url: this.backend_url + '/video/trim',
      data: {
        startTime: player.formatTrimStart(),
        duration: player.formatTrimDuration(),
        user_id: this.user_id,
        ws: this.socket.id
      }
    }).then(() => {
      this.loading = 'Editing video in progress...'
    }).catch(error => {
      console.log(`Fatal error occurred: ${error}`);
      this.global_error = true
    });
  }

  /*
    onclick for when the user wishes to resume editing the video
    updates DB with edit.active = true and returns the correct video_id
  */
    back_to_edit() {
      axios({
        method: 'post',
        url: this.backend_url + '/user/edit_active',
        data: {
          user_id: this.user_id,
          ws: this.socket.id,
          active: true
        }
      }).then(() => {
        this.stage = 1
      }).catch(error => {
        console.log(`Fatal error occurred: ${error}`);
        this.global_error = true
      });
    }

      /*
  Tweet a video and text
  */
  tweet(){
    this.socket.on(this.socket.id + "-tweet-finish", (arg) => {
      if(arg.status == "success"){
        this.stage = 3;
        this.loading = ''; //stop loading animation
      }else{
        this.global_error = true;
      }
    });
    const gettingStoredSettings = browser.storage.local.get();
    gettingStoredSettings.then(
      storedSettings => {
        axios.post(this.backend_url + '/tweet',{
          oauth_token: storedSettings.auth.oauth_token,
          oauth_token_secret: storedSettings.auth.oauth_token_secret,
          message: document.getElementById("editBox").value,
          ws: this.socket.id,
          user_id: this.user_id
        }).then(() => {
          this.loading = 'Sending tweet...'
        }).catch(error => {
          console.log(`Fatal error occurred: ${error}`);
          this.global_error = true
        });

      },
      error => {
        console.log(`Fatal error occurred: ${error}`);
        this.global_error = true
      }
    );
  };

  setupUI(){
    let promise = new Promise((resolve,reject) => {
      const gettingStoredSettings = browser.storage.local.get();
      gettingStoredSettings.then(storedSettings => {
        this.user_id = storedSettings.user_id //initialize this user_id
        if(storedSettings.auth){
          this.authenticated = true
          this.auth = storedSettings.auth
        }else{
          this.authenticated =false
        }
        this.setYoutubeTab().then(response => {
          if(response){
            this.getUserData().then(response => {
                let userData = response.data
                if(userData.video_url){
                  if(userData.video_url.S == this.video_url){
                    if(userData.edit.M.active.BOOL){
                      let video_url = config.cloudfront + '/raw/' + userData.video_id.S + '.mp4'
                      resolve({stage: 1, video_url: video_url})
                    }else{
                      if(userData.tweet_url){
                        resolve({stage: 3, tweet_url: userData.tweet_url.S})
                      }else{
                        if(this.authenticated){
                          let video_url = config.cloudfront + '/edit/' + userData.trimmed_video_id.S + '.mp4'
                          resolve({stage: 2, video_url: video_url})
                        }else{
                          resolve({stage: -2})
                        }
                      }
                    }
                  }else{
                    resolve({stage: 0})
                  }
                }else{
                  resolve({stage: 0})
                }
              })
              .catch(error => {reject(error)})
          }else{
            this.getUserData().then(response => {
              let userData = response.data
              if(userData.video_url){
                if(userData.edit.M.active.BOOL){
                  let video_url = config.cloudfront + '/raw/' + userData.video_id.S + '.mp4'
                  resolve({stage: 1, video_url: video_url})
                }else{
                  if(userData.tweet_url){
                    resolve({stage: 3, tweet_url: userData.tweet_url.S})
                  }else{
                    if(this.authenticated){
                      let video_url = config.cloudfront + '/edit/' + userData.trimmed_video_id.S + '.mp4'
                      resolve({stage: 2, video_url: video_url})
                    }else{
                      resolve({stage: -2})
                    }
                  }
                }
              }else{
                resolve({stage: -1})
              }
            })
            .catch(error => {reject(error)})
          }
        })
      });
    })
    return promise
  }

  setYoutubeTab(){
    let promise = new Promise((resolve,reject) => {
      let callback = function(tabs){
        const regex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/g;
        if(tabs[0].url.match(regex)){
          this.video_url = tabs[0].url
          browser.storage.local.set({youtube_tab:tabs[0].id});
          resolve(true)
        }else{
          resolve(false)
        }
      }
      let callbackBind = callback.bind(this);
      browser.tabs.query({active: true, currentWindow: true}).then(callbackBind)
    })
    return promise;
  }

  getUserData(){
    return axios({
      method: 'get',
      url: this.backend_url + '/user/data',
      params: {
        user_id: this.user_id
      },
    })
  }

  //asynchronously fetch all the data before displaying child components
  render() {
    return html`
      ${this.InitComponents(this.setupUI())}
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