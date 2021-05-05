import { LitElement, html } from 'lit-element';

class Loading extends LitElement {
  render() {
    return html`
			<div class="cs-dual-ring"></div>
			<div class="cs-loading-message">${this.message}</div>
    `;
  }

	static get properties() {
    return {
      message: {type: String},
    };
  }

  createRenderRoot() {
    /**
     * Render template without shadow DOM. Note that shadow DOM features like
     * encapsulated CSS and slots are unavailable.
     */
      return this;
  }
}
customElements.define('cs-loading', Loading);