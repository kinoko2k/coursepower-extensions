const api = typeof browser !== "undefined" ? browser : chrome;
const form = document.getElementById("settingsForm");
const loginPageUrlInput = document.getElementById("loginPageUrl");
const userIdInput = document.getElementById("userId");
const passwordInput = document.getElementById("password");
const autoLoginEnabledInput = document.getElementById("autoLoginEnabled");
const sessionTimerEnabledInput = document.getElementById("sessionTimerEnabled");
const sessionTimeoutInput = document.getElementById("sessionTimeout");
const statusElement = document.getElementById("status");

const DEFAULT_SETTINGS = {
  loginPageUrl: "/lginLgir/",
  userId: "",
  password: "",
  autoLoginEnabled: false,
  sessionTimerEnabled: true,
  sessionTimeout: 30
};

async function loadSettings() {
  const settings = await api.storage.local.get(DEFAULT_SETTINGS);
  loginPageUrlInput.value = settings.loginPageUrl || DEFAULT_SETTINGS.loginPageUrl;
  userIdInput.value = settings.userId || "";
  passwordInput.value = settings.password || "";
  autoLoginEnabledInput.checked = Boolean(settings.autoLoginEnabled);
  sessionTimerEnabledInput.checked = Boolean(settings.sessionTimerEnabled);
  sessionTimeoutInput.value = settings.sessionTimeout || 30;
}

async function saveSettings(event) {
  event.preventDefault();
  await api.storage.local.set({
    loginPageUrl: loginPageUrlInput.value.trim(),
    userId: userIdInput.value.trim(),
    password: passwordInput.value,
    autoLoginEnabled: autoLoginEnabledInput.checked,
    sessionTimerEnabled: sessionTimerEnabledInput.checked,
    sessionTimeout: parseInt(sessionTimeoutInput.value, 10) || 30
  });

  statusElement.textContent = "保存しました。";
  setTimeout(() => {
    statusElement.textContent = "";
  }, 1600);
}

loadSettings();
form.addEventListener("submit", saveSettings);
