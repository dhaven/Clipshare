import { LitElement, html } from 'lit-element';

class Welcome extends LitElement {
  render() {
    return html`<div>No video found on this page :(</div>`;
  }
}
customElements.define('cs-welcome', Welcome);
