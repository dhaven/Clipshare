const express = require('express');
const router = express.Router();

/*
	Adds a new item to the tweet queue
	
	Request post body: 
		oauth_token : String
    oauth_token_secret: String
    message: String //The tweet to send
    user_id: String //The user that is sending the tweet
	returns: 
		message: 'video was added to the tweet queue'
*/
router.post('/', (req, res, _next) => {
	req.logger.log('info', `POST /tweet sending tweet for user ${req.body.user_id}`);
	req.aws.dynamoDB_get_user(req.body.user_id)
		.then(data => {
			const token = {
        key: req.body.oauth_token,
        secret: req.body.oauth_token_secret,
      }
			req.queues.tweet.add('tweet_job',{
				user_id: req.body.user_id,
        token: token,
        video_id: data.Item.trimmed_video_id.S,
        ws: req.body.ws,
        message: req.body.message
      })
      res.json({
        message: 'video was added to the tweet queue'
      });
		})
		.catch(error => {
			req.logger.error(`An error occured while fetching user : ${req.body.user_id} in dynamoDB`)
			req.logger.error(error);
			res.status(500).send(error);
		})
});

module.exports = router;