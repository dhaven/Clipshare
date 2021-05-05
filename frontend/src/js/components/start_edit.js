import { LitElement, html } from 'lit-element';

class StartEdit extends LitElement {
  render() {
    return html`
    	<div class="cs-edit-start-container">
        <button class="cs-button cs-edit-start-item" id="start-editing" @click="${this.fetch_video}">Start editing !</button>
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
customElements.define('cs-start-edit', StartEdit);