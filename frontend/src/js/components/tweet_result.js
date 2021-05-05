import { LitElement, html } from 'lit-element';

class TweetResult extends LitElement {
  render() {
    return html`
			<div class="cs-edit-trim-container">
				<div class="cs-edit-trim-item">
					The tweet was successfully sent !
				</div>
				<div class="cs-edit-trim-item">
          <button class="cs-button cs-app" @click="${this.view_tweet}">view</button>
				</div>
			</div>
    `;
  }

  view_tweet(){
    browser.tabs.create({
      url: this.tweet_url,
    });
  }

  createRenderRoot() {
    /**
     * Render template without shadow DOM. Note that shadow DOM features like
     * encapsulated CSS and slots are unavailable.
     */
      return this;
  }
}
customElements.define('cs-tweet-result', TweetResult);