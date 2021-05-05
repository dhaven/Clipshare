import { LitElement, html } from 'lit-element';

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
					<button class="cs-button cs-tweet-button" id="tweet" class="cs-app" @click="${this.tweet}">tweet</button>
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
		if (cntfield.value.length > 20){
			wordCount.innerHTML = cntfield.value.length
			wordCount.style.color = 'red'
		}
		else{
			wordCount.innerHTML = cntfield.value.length
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