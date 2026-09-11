async function runErrorRedirect() {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/error/notLogin')) {
    const settings = await api.storage.local.get({
      loginPageUrl: DEFAULT_LOGIN_PAGE_URL
    });
    
    const targetUrl = settings.loginPageUrl || DEFAULT_LOGIN_PAGE_URL;
    
    if (!window.location.href.includes(targetUrl)) {
      window.location.href = targetUrl;
    }
  }
}
