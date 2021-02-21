import videojs from 'video.js';
const axios = require('axios');
import createPlayer from './src/js/videojs/trimPlayer.js';
import {getAccessToken, login} from './src/js/auth/auth.js';
const OAuth = require('oauth-1.0a');
var CryptoJS = require("crypto-js");
import {io} from "socket.io-client";
var config = require('./src/js/config/config.js');

const socket = io("http://" + config.backend.host + ":" + config.backend.port); // use ws:// ?
socket.on("connect", () => {
  socket.on(socket.id + "-tweet-finish", (arg) => {
    console.log(arg)
  });
});

var initializePlayer = function(video_id){
  document.getElementById("start-editing").remove()
  console.log("hello")
  let videoElem = document.createElement("video")
  videoElem.setAttribute("id","my-player")
  videoElem.setAttribute("class","video-js")
  videoElem.setAttribute("preload","auto")
  videoElem.setAttribute("controls","")
  document.getElementsByTagName("body")[0].appendChild(videoElem)
  let shareButton = document.createElement("button")
  shareButton.setAttribute("id","share_on_twitter")
  shareButton.innerHTML = "share_on_twitter"
  shareButton.addEventListener("click", shareOnTwitter)
  document.getElementsByTagName("body")[0].appendChild(shareButton)
  let player = createPlayer('my-player');
  player.src({
    src: 'http://localhost:2020/'+video_id+'/'+video_id+'.mp4',
    type: 'video/mp4'
  });
  player.play()
}

var trim = function(video_id){
  let player = videojs.getPlayer("my-player")
  //console.log(player.formatTrimStart())
  //console.log(player.formatTrimDuration())
  return axios({
    method: 'post',
    url: 'http://localhost:2020/trim',
    data: {
      video_id: video_id,
      start: player.formatTrimStart(),
      duration: player.formatTrimDuration(),
      ws: socket.id
    }
  })
}

var get = function(){
  browser.tabs.query({active: true, currentWindow: true})
          .then(function(tabs){
            axios({
              method: 'post',
              url: 'http://localhost:2020/get',
              data: {
                url: tabs[0].url,
                ws: socket.id
              }
            }).then(response => {
              browser.storage.local.set({video_id:response.data.video_id});
              socket.on(socket.id + "-download-finish", (arg) => {
               initializePlayer(response.data.video_id)
              });
            })
            .catch(function (error) {
              console.log(error.toJSON());
            });
          })
}

var tweet_video = function(){
  const gettingStoredSettings = browser.storage.local.get();
  gettingStoredSettings.then(
    storedSettings => {
      axios.post('http://localhost:2020/tweetvideo',{
        oauth_token: storedSettings.auth.oauth_token,
        oauth_token_secret: storedSettings.auth.oauth_token_secret,
        video_id: storedSettings.video_id,
        message: document.getElementById("editBox").value,
        ws: socket.id
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

var primary_flow = function(){
  const gettingStoredSettings = browser.storage.local.get();
  gettingStoredSettings.then(storedSettings => {
    if (!storedSettings.video_id) {
      console.log("cannot proceed if no video is present")
      return
    }else{
      trim(storedSettings.video_id).then(response => {
        //set websocket callback (update UI is trim is successful)
        socket.on(socket.id + "-trim-finish", (arg) => {
          console.log(arg)
          make_video_tweetable()
        });
      }).catch(error => {
        console.log(error)
      })
    }
  });
}
//store auth data and proceed with normal flow
var second_flow = function(message,sender){
  getAccessToken(message,sender).then(result => {
    browser.storage.local.set({auth:result.data});
    primary_flow()
  })
}

//update UI to allow user to tweet video
var make_video_tweetable = function(){
  let elem = document.createElement("input")
  elem.setAttribute("id","editBox")
  elem.setAttribute("type","text")
  document.getElementsByTagName("body")[0].appendChild(elem)
  let tweetButton = document.createElement("button")
  tweetButton.setAttribute("id","tweet")
  tweetButton.innerHTML = "tweet"
  tweetButton.addEventListener("click", tweet_video)
  document.getElementsByTagName("body")[0].appendChild(tweetButton)
}

var shareOnTwitter = function(){
  // check if user is logged
  const gettingStoredSettings = browser.storage.local.get();
  gettingStoredSettings.then(storedSettings => {
    if (!storedSettings.auth) {
      console.log("user has not authenticated yet")
      browser.runtime.onMessage.addListener(second_flow);
      login();
      //update UI only once auth cred has been stored
    }else{
      //normal flow (trim + UI)
      primary_flow()
    }
  });
}

browser.tabs.query({active: true, currentWindow: true}).then(function(tabs){
  const regex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/g;
  if(tabs[0].url.match(regex)){
    //if is youtube suggest to start working on the video
    let elem = document.createElement("button")
    elem.setAttribute("id","start-editing")
    elem.addEventListener("click", get)
    elem.innerHTML = "Start editing !"
    document.getElementsByTagName("body")[0].appendChild(elem)
  }else{
    let elem = document.createElement("div")
    elem.innerHTML = "No video found on this page :("
    document.getElementsByTagName("body")[0].appendChild(elem)
  }
})
