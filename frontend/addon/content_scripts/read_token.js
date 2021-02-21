(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;
  console.log("hello from content script")
  /**
   * Send oauth_verifier to extension
   *
  */
	browser.runtime.sendMessage({"query_string": window.location.search.substr(1)});
})();
