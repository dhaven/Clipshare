const readline = require('readline');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');
var Bullmq =  require('bullmq');
const { sep } = require('path');
const processDownload = require('./queues/download.js');
const processTrim = require('./queues/trim.js');
const processTweet = require('./queues/tweet.js');
var IORedis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

var Twitter = require('./controllers/twitter.js');
var T = new Twitter(config.twitter.consumer_key,config.twitter.consumer_key_secret)

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port
});
const downloadQueue = new Bullmq.Queue('video download',{ connection });
const trimQueue = new Bullmq.Queue('trim video',{ connection });
const tweetQueue = new Bullmq.Queue('tweet video',{ connection });

const downloadWorker = new Bullmq.Worker('video download', processDownload, { connection });
downloadWorker.on("completed", (job, response) => {
  console.log("emitting video success to frontend socket with id : " + job.data.ws)
  io.emit(job.data.ws + "-download-finish", 'download success');
});
const trimWorker = new Bullmq.Worker('trim video', processTrim, { connection });
trimWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-trim-finish", 'trim success');
});
const tweetWorker = new Bullmq.Worker('tweet video', processTweet, { connection });
tweetWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-tweet-finish", 'tweet success');
});
tweetWorker.on("failed", (job, response) => {
  io.emit(job.data.ws + "-tweet-finish", { response });
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

app.use('/health', require('./routes/health.js'));

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
  let video_id = uuidv4()
  downloadQueue.add('download_job',{
    uuid: video_id,
    url: req.body.url,
    ws: req.body.ws
  })
  res.json({
      message: 'video added to download queue',
      video_id: video_id
  });
});

app.post('/trim', (req, res) => {
  console.log("cutting video")
  let trimmed_video_id = uuidv4()
  trimQueue.add('trim_job',{
    trimmed_video_id: trimmed_video_id,
    video_id: req.body.video_id,
    start: req.body.start,
    duration: req.body.duration,
    ws: req.body.ws
  })
  res.json({
      message: 'video added to trim queue',
      video_id: trimmed_video_id
  });
});

app.get('/authorize_app', (req,res) => {
  T.request_oauth_token().then( response => {
    res.json(response)
  })
})

app.get('/authorized', (req,res) => {
  T.request_oauth_token().then( response => {
    res.send("access granted")
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
