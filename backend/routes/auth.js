const express = require('express');
const router = express.Router();

router.get('/authorize_app', (req, res, _next) => {
  req.twitter.request_oauth_token()
		.then( response => {
    	res.json(response)
  	})
		.catch( error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
		})
});

router.post('/access_token', (req, res, _next) => {
  req.twitter.get_access_token(req.body.oauth_token,req.body.oauth_verifier)
		.then( response => {
    	res.json(response)
  	})
		.catch( error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
		})
});

router.post('/profile', (req, res, _next) => {
  req.twitter.profile(req.body.auth)
		.then( response => {
    	res.json(response.data)
  	})
		.catch( error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
		})
});

module.exports = router;