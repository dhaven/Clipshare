import { LitElement, html } from 'lit-element';

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
        <div class="cs-error-long-video"></div>
        <button class="cs-button" id="share_on_twitter" @click="${this.trim}" class="cs-app">finish</button>
      </div>
    `;
  }

	updated() {
    this.destroy_player()
    this.create_player(true)
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