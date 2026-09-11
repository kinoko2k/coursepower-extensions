const api = typeof browser !== "undefined" ? browser : chrome;
const form = document.getElementById("settingsForm");
const loginPageUrlInput = document.getElementById("loginPageUrl");
const userIdInput = document.getElementById("userId");
const passwordInput = document.getElementById("password");
const autoLoginEnabledInput = document.getElementById("autoLoginEnabled");
const sessionTimerEnabledInput = document.getElementById("sessionTimerEnabled");
const sessionTimeoutInput = document.getElementById("sessionTimeout");
const autoOpenAccordionInput = document.getElementById("autoOpenAccordion");
const customFaviconEnabledInput = document.getElementById("customFaviconEnabled");
const customFaviconUrlInput = document.getElementById("customFaviconUrl");
const faviconUploadInput = document.getElementById("faviconUpload");
const faviconPreview = document.getElementById("faviconPreview");
const clearFaviconUploadBtn = document.getElementById("clearFaviconUpload");
const statusElement = document.getElementById("status");

let uploadedFaviconBase64 = "";

const DEFAULT_SETTINGS = {
  loginPageUrl: "/lginLgir/",
  userId: "",
  password: "",
  autoLoginEnabled: false,
  sessionTimerEnabled: true,
  sessionTimeout: 30,
  autoOpenAccordion: true,
  customFaviconEnabled: false,
  customFaviconUrl: "",
  customFaviconBase64: ""
};

async function loadSettings() {
  const settings = await api.storage.local.get(DEFAULT_SETTINGS);
  loginPageUrlInput.value = settings.loginPageUrl || DEFAULT_SETTINGS.loginPageUrl;
  userIdInput.value = settings.userId || "";
  passwordInput.value = settings.password || "";
  autoLoginEnabledInput.checked = Boolean(settings.autoLoginEnabled);
  sessionTimerEnabledInput.checked = Boolean(settings.sessionTimerEnabled);
  sessionTimeoutInput.value = settings.sessionTimeout || 30;
  autoOpenAccordionInput.checked = Boolean(settings.autoOpenAccordion);
  customFaviconEnabledInput.checked = Boolean(settings.customFaviconEnabled);
  customFaviconUrlInput.value = settings.customFaviconUrl || "";
  
  uploadedFaviconBase64 = settings.customFaviconBase64 || "";
  if (uploadedFaviconBase64) {
    faviconPreview.src = uploadedFaviconBase64;
    faviconPreview.style.display = "block";
    clearFaviconUploadBtn.style.display = "block";
  } else {
    faviconPreview.style.display = "none";
    clearFaviconUploadBtn.style.display = "none";
  }
}

async function saveSettings(event) {
  event.preventDefault();
  await api.storage.local.set({
    loginPageUrl: loginPageUrlInput.value.trim(),
    userId: userIdInput.value.trim(),
    password: passwordInput.value,
    autoLoginEnabled: autoLoginEnabledInput.checked,
    sessionTimerEnabled: sessionTimerEnabledInput.checked,
    sessionTimeout: parseInt(sessionTimeoutInput.value, 10) || 30,
    autoOpenAccordion: autoOpenAccordionInput.checked,
    customFaviconEnabled: customFaviconEnabledInput.checked,
    customFaviconUrl: customFaviconUrlInput.value.trim(),
    customFaviconBase64: uploadedFaviconBase64,
    autoLoginAttempts: 0
  });

  statusElement.textContent = "保存しました。";
  setTimeout(() => {
    statusElement.textContent = "";
  }, 1600);
}

faviconUploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 64;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      uploadedFaviconBase64 = canvas.toDataURL("image/png");
      faviconPreview.src = uploadedFaviconBase64;
      faviconPreview.style.display = "block";
      clearFaviconUploadBtn.style.display = "block";
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

clearFaviconUploadBtn.addEventListener("click", () => {
  uploadedFaviconBase64 = "";
  faviconUploadInput.value = "";
  faviconPreview.src = "";
  faviconPreview.style.display = "none";
  clearFaviconUploadBtn.style.display = "none";
});

loadSettings();
form.addEventListener("submit", saveSettings);
