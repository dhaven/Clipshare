import { LitElement, html } from 'lit-element';
import {login} from '../auth/auth.js';

class Login extends LitElement {
  render() {
    return html`
			<div class="cs-edit-trim-container">
				<div class="cs-edit-trim-item">
					You need to login to Twitter before tweeting the clip.
				</div>
				<div class="cs-edit-trim-item">
					<button class="cs-button" id="login" @click="${login}" class="cs-app">login</button>
				</div>
			</div>
    `;
  }

  createRenderRoot() {
    /**
     * Render template without shadow DOM. Note that shadow DOM features like
     * encapsulated CSS and slots are unavailable.
     */
      return this;
  }
}
customElements.define('cs-login', Login);