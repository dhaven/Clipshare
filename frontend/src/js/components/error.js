import { LitElement, html } from 'lit-element';

class Error extends LitElement {
  render() {
    return html`
    <div class="cs-error-container">
      <div class="cs-error-item">
        Oops !
      </div>
      <div class="cs-error-item">
        There was an unexpected error.
      </div>
      <div class="cs-error-item">
        Sorry about that :(
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
customElements.define('cs-error', Error);