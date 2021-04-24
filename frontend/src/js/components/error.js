import { LitElement, html } from 'lit-element';

class Error extends LitElement {
  render() {
    return html`<div>An unexpected error occured. Sorry about that :(</div>`;
  }
}
customElements.define('cs-error', Error);