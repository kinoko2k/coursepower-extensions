async function runErrorRedirect() {
  const currentUrl = window.location.href;
  if (currentUrl.includes('/error/notLogin')) {
    try {
      const settings = await api.storage.local.get({ loginPageUrl: DEFAULT_LOGIN_PAGE_URL });
      let targetUrl = settings.loginPageUrl || DEFAULT_LOGIN_PAGE_URL;
      
      if (targetUrl.startsWith('/')) {
        const prefixStr = currentUrl.split('/error/notLogin')[0];
        const urlObj = new URL(prefixStr);
        let basePath = urlObj.pathname;
        if (basePath.endsWith('/')) {
          basePath = basePath.slice(0, -1);
        }
        targetUrl = basePath + targetUrl;
      }
      
      if (!currentUrl.includes(targetUrl)) {
        window.location.replace(targetUrl);
      }
    } catch (e) {
      console.error(e);
      const prefixStr = currentUrl.split('/error/notLogin')[0];
      const urlObj = new URL(prefixStr);
      let basePath = urlObj.pathname;
      if (basePath.endsWith('/')) {
        basePath = basePath.slice(0, -1);
      }
      const fallbackUrl = basePath + DEFAULT_LOGIN_PAGE_URL;
      if (!currentUrl.includes(fallbackUrl)) {
        window.location.replace(fallbackUrl);
      }
    }
  }
}
