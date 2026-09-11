async function setupFavicon() {
  const settings = await api.storage.local.get({
    customFaviconEnabled: false,
    customFaviconUrl: "",
    customFaviconBase64: ""
  });

  if (!settings.customFaviconEnabled) {
    return;
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
