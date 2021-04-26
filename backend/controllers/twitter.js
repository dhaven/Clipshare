const OAuth = require('oauth-1.0a');
var CryptoJS = require("crypto-js");
const FormData = require('form-data');
const axios = require('axios');
fs = require('fs');
var mime = require('mime');
const path = require('path');

/*
* Class representing the twitter API.
* Wraps common API endpoint with their authentication requirements
*/
class Twitter {
  constructor(consumer_key, consumer_key_secret){
    this.oauth = OAuth({
        consumer: { key: consumer_key, secret: consumer_key_secret },
        signature_method: 'HMAC-SHA1',
        hash_function: this.hash_function_sha1,
    })
  }

  hash_function_sha1(base_string, key) {
    return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
  }

  get_oauth_authorization_header(url,method,data,token){
    let request_data = {
      url: url,
      method: method,
      data: data
    }
    return this.oauth.toHeader(this.oauth.authorize(request_data, token))['Authorization']
  }

  api_request(url,method,headers,data){
    let params = new URLSearchParams(data);
    let config = {
      method: method,
      url: url,
      headers: headers,
      data: params.toString()
    };
    return axios(config)
  }

  request_oauth_token(){
    const request_data = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: { oauth_callback: 'http://localhost:2020/authorized' }, // ?????
    }
    let formData = this.oauth.authorize(request_data)
    const params = new URLSearchParams({
      oauth_consumer_key: formData["oauth_consumer_key"],
      oauth_signature_method: formData["oauth_signature_method"],
      oauth_timestamp: formData["oauth_timestamp"],
      oauth_nonce: formData["oauth_nonce"],
      oauth_version: formData["oauth_version"],
      oauth_callback: formData["oauth_callback"],
      oauth_signature: formData["oauth_signature"]
    });
    return axios.post('https://api.twitter.com/oauth/request_token',params.toString())
         .then(response => {
           let data = response.data.split('&')
           var result = {};
           data.forEach(element => {
             var item = element.split("=");
             result[item[0]] = item[1];
           });
           return result;
         })
  }

  get_access_token(oauth_token,oauth_verifier){
    const request_data = {
      url: 'https://api.twitter.com/oauth/access_token',
      method: 'POST',
      data: { oauth_token: oauth_token,
              oauth_verifier: oauth_verifier
            },
    }
    let formData = this.oauth.authorize(request_data)
    const params = new URLSearchParams({
      oauth_consumer_key: formData["oauth_consumer_key"],
      oauth_signature_method: formData["oauth_signature_method"],
      oauth_timestamp: formData["oauth_timestamp"],
      oauth_nonce: formData["oauth_nonce"],
      oauth_version: formData["oauth_version"],
      oauth_token: formData["oauth_token"],
      oauth_verifier: formData["oauth_verifier"],
      oauth_signature: formData["oauth_signature"]
    });
    return axios.post('https://api.twitter.com/oauth/access_token',params.toString())
          .then(response => {
            let data = response.data.split('&')
            var result = {};
            data.forEach(element => {
              var item = element.split("=");
              result[item[0]] = item[1];
            });
            return result;
          })
  }

  profile(authData){
    let url = 'https://api.twitter.com/1.1/users/show.json'
    let method = 'GET'
    let params = {
      screen_name: authData.screen_name,
      user_id: authData.user_id
    }
    let token = {
      key: authData.oauth_token,
      secret: authData.oauth_token_secret,
    }
    let headers = {
      'Authorization': this.get_oauth_authorization_header(url,method,params,token),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let config = {
      method: method,
      url: url,
      headers: headers,
      params: params
    };
    console.log(config)
    return axios(config);
  }

  tweet_video(token,video_id,message){
    //start with upload media file
    console.log("working on tweet")
    console.log(token,video_id)
    let promise = new Promise((resolve,reject) => {
      this.init_upload(token,video_id)
      .then(response => {
        console.log(response)
        //if init was successful we should have access to a media_string
        //upload the media chunk by chunk
         return this.upload_media(token,response.data['media_id_string'],video_id)
      })
      .then(media_id => {
        //finalize the media upload
        console.log("got a response from upload media")
        return this.finalize(token,media_id)
      })
      .then(response => {
         //wait for video to finish processing
         console.log("finalize command was succesfully send")
         return this.watch_upload_progress(token,response.data['media_id_string'])
      })
      .then(response => {
        console.log("video was successfully processed")
        return this.tweet_with_video(token,response.data['media_id_string'],message)
      })
      .then(response => {
        resolve('tweet was successfully sent')
      })
      .catch(error => {
        reject(error)
      })
    });
    return promise
  }

  // Initialize twitter media upload and returns the media_id associated with the video
  init_upload(token,video_id){
    let url = 'https://upload.twitter.com/1.1/media/upload.json'
    let method = 'POST'
    var mediaFilePath = path.join(__dirname,'../media',video_id+'.mp4');
    var mediaType = mime.lookup(mediaFilePath);
    var mediaFileSizeBytes = fs.statSync(mediaFilePath).size;
    let data = {
      command: 'INIT',
      media_type: mediaType,
      total_bytes: mediaFileSizeBytes,
      media_category: 'tweet_video'
    }
    let headers = {
      'Authorization': this.get_oauth_authorization_header(url,method,data,token),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    return this.api_request(url,method,headers,data)
    // try {
    //   const response = await this.api_request(url,method,headers,data);
    //   //return response to calling function
    //   this.upload_media(token,response.data['media_id_string'])
    // } catch (error) {
    //   console.error(error);
    // }
  }

  upload_media(token,media_id,video_id){
    let promise = new Promise((resolve,reject) => {
      console.log("starting upload of media")
      let segment_id = 0
      let isStreamingCompleted = false
      let isUploading = false
      let media_path = path.join(__dirname,'../media')
      var mediaFilePath = path.join(media_path,video_id+'.mp4');
      var mediaType = mime.lookup(mediaFilePath);
      var mediaFileSizeBytes = fs.statSync(mediaFilePath).size;
      const readStream = fs.createReadStream(mediaFilePath, {highWaterMark: 1024*1024});
      readStream.on('data', async chunk => {
        //should also catch errors on reading the stream
        readStream.pause();
        isUploading = true
        this.upload_media_chunk(token,media_id,chunk.toString('base64'),segment_id).then(response => {
          if(isStreamingCompleted){
            console.log("end off stream event happened already but finalize was not called because isUploading still to true")
            console.log("call the finalize function now in that case")
            resolve(media_id)
          }
          isUploading = false
          if(response.status >= 200 && response.status < 300){
            segment_id += 1;
            readStream.resume();
          }else {
            console.log("the upload request was unsuccessful")
          }
        }).catch(error => {
          reject(error)
        });
      })
      .on('end', function() {
        isStreamingCompleted = true;
        if(!isUploading){ //
          console.log("call the finalize function now")
          resolve(media_id)
        }
      });
    })
    return promise;
  }

  upload_media_chunk(token,media_id,chunk,segment_id){
    let url = 'https://upload.twitter.com/1.1/media/upload.json'
    let method = 'POST'
    let data = {
      command: 'APPEND',
      media_id: media_id,
      segment_index: segment_id,
      media: chunk
    }
    let headers = {
      'Authorization': this.get_oauth_authorization_header(url,method,data,token),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    return this.api_request(url,method,headers,data)
  }

  //send finalize command to API and wait for
  finalize(token,media_id){
    let url = 'https://upload.twitter.com/1.1/media/upload.json'
    let method = 'POST'
    let data = {
      command: 'FINALIZE',
      media_id: media_id
    }
    let headers = {
      'Authorization': this.get_oauth_authorization_header(url,method,data,token),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    return this.api_request(url,method,headers,data);
  }

  watch_upload_progress(token,media_id){
    let promise = new Promise((resolve,reject) => {
      let url = 'https://upload.twitter.com/1.1/media/upload.json'
      let method = 'GET'
      let state_final = false
      let state_status = ''
      let params = {
        command: 'STATUS',
        media_id: media_id
      }
      let headers = {
        'Authorization': this.get_oauth_authorization_header(url,method,params,token),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      let wait_processing_complete = function(){
        let config = {
          method: method,
          url: url,
          headers: headers,
          params: params
        };
        axios(config).then(response => {
          if(response.data["processing_info"]["state"] == 'succeeded'){
            resolve(response)
          }else if(response.data["processing_info"]["state"] == 'failed'){
            console.log(response.data.processing_info.error)
            reject(response)
          }else{
            setTimeout(wait_processing_complete, 1000);
          }
        }).catch(error => {
          console.log(error)
          reject(error)
        })
      }
      wait_processing_complete();
    });
    return promise
  }

  tweet_with_video(token,media_id,message){
    let url = 'https://api.twitter.com/1.1/statuses/update.json'
    let method = 'POST'
    let data = {
      status: message,
      media_ids: media_id
    }
    let headers = {
      'Authorization': this.get_oauth_authorization_header(url,method,data,token),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    return this.api_request(url,method,headers,data);
  }
}

module.exports = Twitter;
