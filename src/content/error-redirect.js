async function runErrorRedirect() {
  const currentPath = window.location.pathname;
  if (currentPath.includes('error/notLogin')) {
    const settings = await api.storage.local.get({
      loginPageUrl: DEFAULT_LOGIN_PAGE_URL
    });
    
    let targetUrl = settings.loginPageUrl || DEFAULT_LOGIN_PAGE_URL;
    
    if (targetUrl.startsWith('/')) {
      const prefix = currentPath.substring(0, currentPath.indexOf('error/notLogin'));
      const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
      targetUrl = cleanPrefix + targetUrl;
    }
    
    if (!window.location.href.includes(targetUrl)) {
      window.location.href = targetUrl;
    }
  }
}
