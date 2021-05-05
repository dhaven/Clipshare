import { LitElement, html } from 'lit-element';

class Welcome extends LitElement {
  render() {
    return html`
    <div class="cs-welcome-container">
      <div class="cs-welcome-item">
        No video found.
      </div>
      <div class="cs-welcome-item">
        Try opening 
        <a href="https://www.youtube.com/" target="_blank">youtube.com</a>
        and selecting a video first.
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
customElements.define('cs-welcome', Welcome);
