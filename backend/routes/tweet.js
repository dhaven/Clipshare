const express = require('express');
const router = express.Router();

router.post('/', (req, res, _next) => {
  const token = {
    key: req.body.oauth_token,
    secret: req.body.oauth_token_secret,
  }
  req.queues.tweet.add('tweet_job',{
    token: token,
    video_id: req.body.video_id,
    ws: req.body.ws,
    message: req.body.message
  })
  res.json({
    message: 'video was added to the tweet queue'
  });
});

module.exports = router;