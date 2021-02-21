const readline = require('readline');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');
var CryptoJS = require("crypto-js");
var Bullmq =  require('bullmq');
const { sep } = require('path');
const processDownload = require('./queues/download.js');
const processTrim = require('./queues/trim.js');
const processTweet = require('./queues/tweet.js');

var Twitter = require('./controllers/twitter.js');
var T = new Twitter(config.twitter.consumer_key,config.twitter.consumer_key_secret)

const downloadQueue = new Bullmq.Queue('video download');
const trimQueue = new Bullmq.Queue('trim video');
const tweetQueue = new Bullmq.Queue('tweet video');

const downloadWorker = new Bullmq.Worker('video download', processDownload);
downloadWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-download-finish", 'download success');
});
const trimWorker = new Bullmq.Worker('trim video', processTrim);
trimWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-trim-finish", 'trim success');
});
const tweetWorker = new Bullmq.Worker('tweet video', processTweet);
tweetWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-tweet-finish", 'tweet success');
});
tweetWorker.on("failed", (job, response) => {
  io.emit(job.data.ws + "-tweet-finish", response);
});

const cors = require('cors');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', socket => {
  console.log('connect');
});

app.use(express.json({
  inflate: true,
  limit: '10kb',
  reviver: null,
  strict: true,
  type: 'application/json',
  verify: undefined
}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
app.use(express.static(path.join(__dirname,'media')));
app.use(express.static(path.join(__dirname,'files')));

app.post('/tweet', (req,res) => {
  const params = new URLSearchParams(req.body)
  axios.post('https://api.twitter.com/1.1/statuses/update.json',params.toString())
  res.json({
      message: `Hello`
  });
});

app.post('/tweetvideo', (req,res) => {
  const token = {
      key: req.body.oauth_token,
      secret: req.body.oauth_token_secret,
  }
  tweetQueue.add('tweet_job',{
    token: token,
    video_id: req.body.video_id,
    ws: req.body.ws,
    message: req.body.message
  })
  res.json({
    message: 'video was added to the tweet queue'
  });
});

app.post('/get', (req,res) => {
  //compute video_id by hashing the URL
  console.log("get video")
  downloadQueue.add('download_job',{
    url: req.body.url,
    ws: req.body.ws
  })
  res.json({
      message: 'video added to download queue',
      video_id: CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(req.body.url))
  });
});

app.post('/trim', (req, res) => {
  console.log("cutting video")
  trimQueue.add('trim_job',{
    video_id: req.body.video_id,
    start: req.body.start,
    duration: req.body.duration,
    ws: req.body.ws
  })
  res.json({
      message: 'video added to trim queue',
  });
});

app.get('/authorize_app', (req,res) => {
  T.request_oauth_token().then( response => {
    res.json(response)
  })
})

app.post('/access_token', (req, res) => {
  T.get_access_token(req.body.oauth_token,req.body.oauth_verifier).then( response => {
    console.log(response)
    res.json(response)
  })
})


server.listen(config.app.port, () => {
    console.log(`server is listening on port ${config.app.port}`);
});
