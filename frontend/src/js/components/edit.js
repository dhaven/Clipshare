import { LitElement, html } from 'lit-element';
import {directive, NodePart} from 'lit-html';
import createPlayer from '../videojs/trimPlayer.js';
import './header.js';
var config = require('../config/config.js');
const axios = require('axios');
import videojs from 'video.js';
import {login} from '../auth/auth.js';

class Edit extends LitElement {
  constructor() {
    super();
    //this.user_id = ''
    //this.youtube_url = ''
    this.video_id = ''
    this.editing = false
    //this.authenticated = false
    this.error = ''
    this.backend_url = config.backend.protocol + "://" + config.backend.host + ":" + config.backend.port
    // set the socket listener so that UI is updated once video finishes downloading
    this.socket = document.querySelector('#my-app').socket

    this.nestedPartMap = new WeakMap();

    // Creates a new nested part and adds it to the DOM
    // managed by containerPart
    this.createAndAppendPart = (containerPart) => {
      const newPart = new NodePart(containerPart.options);
      newPart.appendIntoPart(containerPart);

      return newPart;
    }
    //callback function to display UI to user based on the stage he is at in the editing process
    this.resolvePromise = directive((promise) => (part) => {
      if (!(part instanceof NodePart)) {
        throw new Error('duplicate directive can only be used in content bindings');
      }
      const nestedParts = this.nestedPartMap.get(part);
      let aboveVideo, video, belowVideo
      if (nestedParts === undefined) { //on first render we need to create the parts
        aboveVideo = this.createAndAppendPart(part);
        video = this.createAndAppendPart(part);
        belowVideo = this.createAndAppendPart(part);
        this.nestedPartMap.set(part, [aboveVideo, video, belowVideo]);
      }else {
        [aboveVideo, video, belowVideo] = nestedParts;
      }
      Promise.resolve(promise).then((resolvedValue) => {
        if(resolvedValue.state == 'INIT'){ //no video found so let the user decide if he want's to start editing this one
          aboveVideo.setValue(html`
            <button id="start-editing" @click="${this.fetch_video}">Start editing !</button>
          `)
          aboveVideo.commit();
        }else if(resolvedValue.state == 'EDIT'){ // let the user continue to work on his video
          if( !this.player ){ //if player is initialized don't add it again
            video.setValue(html`
            <div class="cs-body">
              <div data-vjs-player>
                <video 
                  id="my-player" 
                  class="video-js vjs-trim" 
                  preload="auto" 
                  controls>
                  <source src="${resolvedValue.video_url}" type="video/mp4"></source>
                </video>
              </div>
            </div>
            `);
            video.commit();
            console.log("initializing player for edit")
            this.player = createPlayer("my-player", {width:"320px",height:"180px"})
          }else {
            //set the correct source
            this.player.reset()
            this.player.src({
              src: resolvedValue.video_url,
              type: 'video/mp4'
            })
          }
          console.log(`${resolvedValue.startTrim}-${resolvedValue.endTrim}`)
          this.player.ready(function(){
            let myplayer = videojs.getPlayer('my-player')
            myplayer.updateProgressControl(true)
          })
          aboveVideo.setValue()
          aboveVideo.commit()
          belowVideo.setValue(html`
            <div class="cs-footer">
              <div>${this.error}</div>
              <button id="share_on_twitter" @click="${this.trim}" class="cs-app">finish</button>
            </div>
          `)
          belowVideo.commit();
        }else if(resolvedValue.state == 'FORCE LOGIN'){
          aboveVideo.setValue(html`
          <div>
            <button id="login" @click="${login}" class="cs-app">>> LOGIN <<</button>
          </div>
          `)
          aboveVideo.commit();
          this.player.dispose()
          this.player = null
          video.setValue()
          video.commit()
          belowVideo.setValue();
          belowVideo.commit();
        }else{ //SUBMIT
          //flow should be different based on if you a coming from edit (replace customprogress by normal progress)
          // or if you are opening up the popup (don't remove anything)
          if( !this.player ){
            video.setValue(html`
            <div class="cs-body">
              <div data-vjs-player>
                <video 
                  id="my-player" 
                  class="video-js vjs-trim" 
                  preload="auto" 
                  controls>
                  <source src="${resolvedValue.video_url}" type="video/mp4"></source>
                </video>
              </div>
            </div>
            `);
            video.commit();
            console.log("initializing player for submit")
            this.player = createPlayer("my-player", {width:"320px",height:"180px"})
          }else{
            //set the correct source
            this.player.src({
               src: resolvedValue.video_url,
               type: 'video/mp4'
            })
          }
          this.player.updateProgressControl(false)
          aboveVideo.setValue(html`
            <button id="back" class="cs-app" @click="${this.back_to_edit}"><- Back to edit</button>
          `);
          aboveVideo.commit()
          belowVideo.setValue(html`
          <div class="cs-footer">
            <input id="editBox" type="text"></input>
            <button id="tweet" class="cs-app">tweet</button>
          </div>
          `)
          belowVideo.commit()
        }
      });
    });
  }

  static get properties() {
    return {
      user_id: {type: String},
      youtube_url: {type: String},
      video_id: {type: String},
      editing: {type: Boolean},
      authenticated: {type: Boolean},
      error: {type: String},
      global_error: {type: Boolean}
    };
  }

  /*
  Fetches a video from youtube
  */
  fetch_video(){
    this.socket.on(this.socket.id + "-download-finish", (arg) => {
      this.video_id = arg;
      console.log(arg)
    });
    axios({
      method: 'get',
      url: this.backend_url + '/video',
      params: {
        url: this.youtube_url,
        user_id: this.user_id,
        ws: this.socket.id
      },
    }).then(response => {
      console.log(response)
    })
    .catch( error => {
      console.log(`Fatal error occurred: ${error}`);
      this.parentNode.global_error = true
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
    }).then(response => {
      console.log(response)
      this.editing = true
    }).catch(error => {
      console.log(`Fatal error occurred: ${error}`);
      this.parentNode.global_error = true
    });
  }

  /*
  trim a video based on user defined start and end time
  block trim if video is more than 2 minutes
  */
  trim(){
    let player = videojs.getPlayer("my-player")
    if((player.cache_.endTrimTime - player.cache_.startTrimTime)*player.duration() > 120){
      console.log("video is too long !")
      this.error = "Video is too long !"
      return
    }
    this.socket.on(this.socket.id + "-trim-finish", (arg) => {
      this.video_id = arg
      this.editing = false
      this.error = ''
    });
    axios({
      method: 'post',
      url: this.backend_url + '/video/trim',
      data: {
        startTime: player.formatTrimStart(),
        duration: player.formatTrimDuration(),
        user_id: this.user_id,
        ws: this.socket.id
      }
    }).then(response => {
      console.log(response)
    }).catch(error => {
      console.log(`Fatal error occurred: ${error}`);
      this.parentNode.global_error = true
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
          video_id: storedSettings.video_id, //remove and get the video_id for this user in the backend
          message: document.getElementById("editBox").value,
          ws: this.socket.id
        }).then(response => {
          console.log(response)
        }).catch(error => {
          console.log(`Fatal error occurred: ${error}`);
          this.parentNode.global_error = true
        });

      },
      error => {
        console.log(`Fatal error occurred: ${error}`);
        this.parentNode.global_error = true
      }
    );
  };

  /*
    Async function that will resolve to true if user is authenticated and false otherwise
  */
  isAuthenticated(){
    let promise = new Promise((resolve,reject) => { 
      if(!this.authenticated){
        const gettingStoredSettings = browser.storage.local.get();
        gettingStoredSettings.then(
          storedSettings => {
            if(!storedSettings.auth){
              resolve(false)
            }else{
              this.auth = storedSettings.auth
              resolve(true)
            }
        });
      }else{
        resolve(true)
      }
    })
    return promise
  }

  updateComponent(){
    let promise = new Promise((resolve,reject) => {
      axios({
        method: 'get',
        url: this.backend_url + '/user',
        params: {
          user_id: this.user_id,
          url: this.youtube_url
        },
      }).then(response => {
        console.log(response)
        if(!response.data.video_id){
          resolve({state:"INIT"})
        }else{
          if(response.data.edit.M.active.BOOL){
            let video_url = this.backend_url +'/'+response.data.video_id.S+'.mp4'
            resolve({state:"EDIT", video_url: video_url})
          }else{
            this.isAuthenticated()
              .then(isAuth =>{
                if(isAuth){
                  let video_url = this.backend_url +'/'+response.data.trimmed_video_id.S+'.mp4'
                  resolve({state:"SUBMIT", video_url: video_url})
                }else{
                  resolve({state:"FORCE LOGIN"})
                }
              })
          }
        }
      }).catch(error => {
        console.error(`Fatal error occurred: ${error}`)
        this.parentNode.global_error = true
        reject(error)
      });
    });
    return promise
  }

  render() {
    return html`
      ${this.resolvePromise(this.updateComponent())}
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