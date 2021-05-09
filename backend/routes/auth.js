const express = require('express');
const router = express.Router();

/*
	Get a request token to initial login flow.

	returns : {
    "oauth_token": String,
    "oauth_token_secret": String,
    "oauth_callback_confirmed": String
	}
*/
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

/*
	Convert the request token into a usable access token.

	Request body : {
		oauth_token: String,
		oauth_verifier: String
	}
	returns : {
		oauth_token: String, !!SENSITIVE
		oauth_token_secret: String, !!SENSITIVE
		user_id: String,
		screen_name: String
	}

*/
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

/*
	Get the URL where the user's profile picture is stored
	
	Request body: {
		auth: {
			oauth_token: String,
			oauth_token_secret: String,
			user_id: String,
			screen_name: String
		}
	}
	returns: {
		profile_image_url_https: String
	}
*/
router.post('/profile', (req, res, _next) => {
  req.twitter.profile(req.body.auth)
		.then( response => {
    	res.json({
				profile_image_url_https: response.data.profile_image_url_https
			})
  	})
		.catch( error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
		})
});

//callback from twitter
router.get('/authorized', (req, res, _next) => {
  res.status(200).send("authorized")
});

module.exports = router;