import { LitElement, html } from 'lit-element';
import { parseTweet } from '../twitter/twitter-text-3.1.0.js';

class Submit extends LitElement {

  render() {
    return html`
			<button id="back" class="cs-app cs-button-back" @click="${this.back_to_edit}">< back</button>
			<div class="cs-body">
				<div data-vjs-player>
					<video 
						id="my-player" 
						class="video-js vjs-trim" 
						preload="auto" 
						controls>
						<source src="${this.video_url}" type="video/mp4"></source>
					</video>
				</div>
			</div>
			<div class="cs-footer cs-footer-tweet">
				<textarea id="editBox" 
									class="cs-input" 
									rows="3" 
									placeholder="Say something about the video..."
									@keydown="${this.count_chars}"
									@keyup="${this.count_chars}"></textarea>
				<div class="cs-submit-row">
					<div id="wordCount" class="word-count"></div>
					<button class="cs-button cs-tweet-button" id="tweet" class="cs-app" @click="${this.check_length_tweet}">tweet</button>
				</div>
			</div>
    `;
	}

	static get properties() {
    return {
      charCount: {type: Number},
    };
  }

	count_chars(){
		let cntfield = document.getElementById("editBox")
		let wordCount = document.getElementById("wordCount")
		let maxLength = 280
		let parsedTweet = parseTweet(cntfield.value);
		if (parsedTweet.weightedLength > maxLength){
			wordCount.style.color = 'red'
			wordCount.innerHTML = parsedTweet.weightedLength
			return false
		}
		else if(parsedTweet.weightedLength > maxLength / 2){
			wordCount.innerHTML = parsedTweet.weightedLength + " / " + maxLength
			wordCount.style.color = 'black'
		}
		else{
			wordCount.innerHTML = ""
			wordCount.style.color = 'black'
		}
		return true;
	}

	check_length_tweet(){
		if(this.count_chars()){
			this.tweet()
		}else{
			return
		}
	}

	updated() {
		this.destroy_player()
    this.create_player(false)
  }

  createRenderRoot() {
    /**
     * Render template without shadow DOM. Note that shadow DOM features like
     * encapsulated CSS and slots are unavailable.
     */
      return this;
  }
}
customElements.define('cs-submit', Submit);