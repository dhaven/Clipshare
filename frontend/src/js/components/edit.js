import { LitElement, html } from 'lit-element';
import videojs from 'video.js';

class Edit extends LitElement {

  render() {
    return html`
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
			<div class="cs-footer">
        <div id="errorMessage" class="cs-error-long-video"></div>
        <button class="cs-button" id="share_on_twitter" @click="${this.check_length_trim}" class="cs-app">finish</button>
      </div>
    `;
  }

	updated() {
    this.destroy_player()
    this.create_player(true)
  }

  check_length_trim(){
    let player = videojs.getPlayer("my-player")
    if((player.cache_.endTrimTime - player.cache_.startTrimTime)*player.duration() > 140){
      let errorMessage = document.getElementById("errorMessage")
      errorMessage.innerHTML = "Video cannot be more than 2m20s"
      return
    }else{
      this.trim()
    }
  }
	
  createRenderRoot() {
    /**
     * Render template without shadow DOM. Note that shadow DOM features like
     * encapsulated CSS and slots are unavailable.
     */
      return this;
  }
}
customElements.define('cs-edit', Edit);