const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res, _next) => {
	 let video_id = uuidv4()
	 req.queues.download.add('download_job',{
		 uuid: video_id,
		 url: req.query.url,
		 ws: req.query.ws,
		 user_id: req.query.user_id
	 })
	 res.json({
			 message: 'video added to download queue'
	 });
});

router.post('/trim', (req, res, _next) => {
  req.DBclient.connect()
		.then(() => {
			const users = req.DBclient.db('clipshare').collection('user');
      const query = { _id: req.body.user_id};
      const projection = {video_id: true}
			users.findOne(query,projection)
				.then(response => {
          console.log(response)
          let trimmed_video_id = uuidv4()
          req.queues.trim.add('trim_job',{
            video_id: response.video_id,
            trimmed_video_id: trimmed_video_id,
            startTime: req.body.startTime,
            startPercent: req.body.startPercent,
            duration: req.body.duration,
            endPercent: req.body.endPercent,
            ws: req.body.ws,
            user_id: req.body.user_id
          })
          res.json({
              message: 'video added to trim queue'
          });
				}).catch(error => {
					console.error(`Fatal error occurred: ${error}`)
					res.status(500).send(error);
				});
		})
		.catch(error => {
			console.error(`Fatal error occurred: ${error}`)
			res.status(500).send(error);
		});
});
module.exports = router;