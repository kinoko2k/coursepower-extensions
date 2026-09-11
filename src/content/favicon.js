async function setupFavicon() {
  const settings = await api.storage.local.get({
    customFaviconEnabled: false,
    customFaviconUrl: "",
    customFaviconBase64: "",
    loginPageUrl: "/lginLgir/"
  });

  if (!settings.customFaviconEnabled) {
    return;
  }

  if (typeof parseLoginPageSetting === "function") {
    const target = parseLoginPageSetting(settings.loginPageUrl);
    if (target && target.origin) {
      if (window.location.origin !== target.origin) {
        return;
      }
    } else {
      const path = window.location.pathname.toLowerCase();
      const hostname = window.location.hostname.toLowerCase();
      if (!path.includes('/lms') && !path.includes('coursepower') && !hostname.includes('coursepower')) {
        return;
      }
    }
  }

  const targetUrl = settings.customFaviconBase64 || settings.customFaviconUrl;
  if (!targetUrl) {
    return;
  }

  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = targetUrl;
}
