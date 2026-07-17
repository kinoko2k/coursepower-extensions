const api = typeof browser !== "undefined" ? browser : chrome;
const versionElement = document.getElementById("version");
const openSettingsButton = document.getElementById("openSettingsButton");
const manifest = api.runtime.getManifest();

versionElement.textContent = `Version: ${manifest.version}`;
openSettingsButton.addEventListener("click", () => {
  api.runtime.openOptionsPage();
});
