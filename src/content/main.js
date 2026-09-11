function installUrlChangeHooks() {
  const notifyUrlChange = () => {
    window.dispatchEvent(new Event(URL_CHANGE_EVENT));
  };

  const originalPushState = history.pushState;
  history.pushState = function pushStateWrapper(...args) {
    const result = originalPushState.apply(this, args);
    notifyUrlChange();
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function replaceStateWrapper(...args) {
    const result = originalReplaceState.apply(this, args);
    notifyUrlChange();
    return result;
  };

  window.addEventListener("popstate", notifyUrlChange);
  window.addEventListener("hashchange", notifyUrlChange);
  window.addEventListener(URL_CHANGE_EVENT, () => {
    runAutoLogin();
    setupCorsCollBulkDownloadPanel();
    if (typeof runSessionTimer === "function") runSessionTimer();
    if (typeof runAutoAccordion === "function") runAutoAccordion();
    if (typeof runErrorRedirect === "function") runErrorRedirect();
  });
}

installUrlChangeHooks();
runAutoLogin();
setupCorsCollBulkDownloadPanel();
if (typeof runSessionTimer === "function") runSessionTimer();
if (typeof runAutoAccordion === "function") runAutoAccordion();
if (typeof runErrorRedirect === "function") runErrorRedirect();
