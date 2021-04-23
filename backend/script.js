const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config');
var Bullmq =  require('bullmq');
const processDownload = require('./queues/download.js');
const processTrim = require('./queues/trim.js');
const processTweet = require('./queues/tweet.js');
var IORedis = require('ioredis');
const { MongoClient } = require("mongodb");

const Twitter = require('./controllers/twitter.js');
const T = new Twitter(config.twitter.consumer_key,config.twitter.consumer_key_secret)

const uri = `mongodb://${config.mongodb.host}:${config.mongodb.port}/?compressors=zlib&gssapiServiceName=mongodb`;
const DBclient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
  io.emit(job.data.ws + "-download-finish", response);
});
downloadWorker.on("failed", (job, failedReason) => {
  console.log(`Job ${job} failed : ${failedReason}`)
});
const trimWorker = new Bullmq.Worker('trim video', processTrim, { connection });
trimWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-trim-finish", response);
});
trimWorker.on("failed", (job, failedReason) => {
  console.log(`Job ${job} failed : ${failedReason}`)
});
const tweetWorker = new Bullmq.Worker('tweet video', processTweet, { connection });
tweetWorker.on("completed", (job, response) => {
  io.emit(job.data.ws + "-tweet-finish", 'tweet success');
});
tweetWorker.on("failed", (job, failedReason) => {
  console.log(`Job ${job} failed : ${failedReason}`)
});

const cors = require('cors');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

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

app.use(function (req, res, next) {
  req.queues = {
    download: downloadQueue,
    trim: trimQueue,
    tweet: tweetQueue,
  }
  req.DBclient = DBclient
  req.twitter = T
  next();
});

app.use('/health', require('./routes/health.js'));
app.use('/user', require('./routes/user.js'))
app.use('/tweet', require('./routes/tweet.js'))
app.use('/video', require('./routes/video.js'))
app.use('/auth', require('./routes/auth.js'))

server.listen(config.app.port, () => {
  console.log(`server is listening on port ${config.app.port}`);
});

// app.get('/user_video', (req,res) => {
//   const uri = "mongodb://127.0.0.1:27017/?compressors=zlib&gssapiServiceName=mongodb";
//   const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });
//   try {
//     console.log("client connect")
//     client.connect().then(function(){
//       const database = client.db('clipshare');
//       const users = database.collection('user');
//       const query = { _id: req.query.user_id, video_url: req.query.url};
//       //const options = (req.query.trimmed) ?  {projection: { _id: 0, trimmed_video_id: 1}}: {projection: { _id: 0, trimmed_video_id: 1}}
//       users.findOne(query).then(response => {
//         console.log(response)
//         res.json(response)
//         client.close();
//       }).catch(error => {
//         console.log(error)
//         res.json(error)
//         client.close();
//       });
//     });
//   }catch(error){
//     console.log(error)
//     res.json(error)
//     client.close();
//   }
// })

// app.post('/resume_edit', (req,res) => {
//   resumeEditQueue.add('resume_edit_job',{
//     ws: req.body.ws,
//     user_id: req.body.user_id
//   })
//   res.json({
//     message: 'response'
//   });
// })

// app.post('/tweetvideo', (req,res) => {
//   const token = {
//       key: req.body.oauth_token,
//       secret: req.body.oauth_token_secret,
//   }
//   tweetQueue.add('tweet_job',{
//     token: token,
//     video_id: req.body.video_id,
//     ws: req.body.ws,
//     message: req.body.message
//   })
//   res.json({
//     message: 'video was added to the tweet queue'
//   });
// });

// app.get('/video', (req,res) => {
//   //compute video_id by hashing the URL
//   console.log("get video")
//   let video_id = uuidv4()
//   downloadQueue.add('download_job',{
//     uuid: video_id,
//     url: req.query.url,
//     ws: req.query.ws,
//     user_id: req.query.user_id
//   })
//   res.json({
//       message: 'video added to download queue',
//       video_id: video_id
//   });
// });

// app.post('/trim', (req, res) => {
//   console.log("cutting video")
//   let trimmed_video_id = uuidv4()
//   trimQueue.add('trim_job',{
//     trimmed_video_id: trimmed_video_id,
//     video_id: req.body.video_id,
//     startTime: req.body.startTime,
//     startPercent: req.body.startPercent,
//     duration: req.body.duration,
//     endPercent: req.body.endPercent,
//     ws: req.body.ws,
//     user_id: req.body.user_id
//   })
//   res.json({
//       message: 'video added to trim queue',
//       video_id: trimmed_video_id
//   });
// });

// app.get('/authorize_app', (req,res) => {
//   T.request_oauth_token().then( response => {
//     res.json(response)
//   })
// })

// app.get('/authorized', (req,res) => {
//   T.request_oauth_token().then( response => {
//     res.send("access granted")
//   })
// })

// app.post('/access_token', (req, res) => {
//   T.get_access_token(req.body.oauth_token,req.body.oauth_verifier).then( response => {
//     console.log(response)
//     res.json(response)
//   })
// })

// app.post('/profile', (req, res) => {
//   T.profile(req.body.auth).then( response => {
//     res.json(response.data)
//   })
// })
