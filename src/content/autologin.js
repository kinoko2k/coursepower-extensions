let lastAttemptedUrl = "";
let activeCountdownIntervalId = null;
let activePopupElement = null;
let activeObserver = null;

function normalizePathname(pathname) {
  if (!pathname) {
    return "/";
  }
  const withoutMatrixParams = pathname
    .split("/")
    .map((segment) => segment.split(";")[0])
    .join("/");
  const normalized =
    withoutMatrixParams.endsWith("/") && withoutMatrixParams !== "/"
      ? withoutMatrixParams.slice(0, -1)
      : withoutMatrixParams;
  return normalized || "/";
}

function parseLoginPageSetting(loginPageUrl) {
  const raw = (loginPageUrl || "").trim();
  if (!raw) {
    return null;
  }

  const isAbsolute = /^https?:\/\//i.test(raw);
  if (isAbsolute) {
    let parsedUrl;
    try {
      parsedUrl = new URL(raw);
    } catch (error) {
      console.warn("ログインページが無効です。", raw, error);
      return null;
    }
    return {
      origin: parsedUrl.origin,
      pathname: normalizePathname(parsedUrl.pathname)
    };
  }

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return {
    origin: null,
    pathname: normalizePathname(path)
  };
}

function isTargetLoginPage(loginPageUrl) {
  const target = parseLoginPageSetting(loginPageUrl);
  if (!target) {
    return false;
  }

  if (target.origin && target.origin !== window.location.origin) {
    return false;
  }

  const currentPathname = normalizePathname(window.location.pathname);
  if (currentPathname === target.pathname) {
    return true;
  }

  return (
    currentPathname.startsWith(`${target.pathname}/`) ||
    currentPathname.startsWith(`${target.pathname};`) ||
    window.location.href.includes(loginPageUrl.trim())
  );
}

function createCountdownPopup() {
  if (activePopupElement) {
    activePopupElement.remove();
  }
  const popup = document.createElement("div");
  popup.id = "coursepower-autologin-popup";
  popup.style.position = "fixed";
  popup.style.top = "16px";
  popup.style.right = "16px";
  popup.style.zIndex = "2147483647";
  popup.style.padding = "10px 12px";
  popup.style.background = "#1f2937";
  popup.style.color = "#ffffff";
  popup.style.borderRadius = "8px";
  popup.style.fontSize = "13px";
  popup.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  popup.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.28)";
  document.body.appendChild(popup);
  activePopupElement = popup;
  return popup;
}

function clearActiveCountdown() {
  if (activeCountdownIntervalId !== null) {
    window.clearInterval(activeCountdownIntervalId);
    activeCountdownIntervalId = null;
  }
  if (activePopupElement) {
    activePopupElement.remove();
    activePopupElement = null;
  }
}

function stopActiveObserver() {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
}

function fillCredentials(userIdInput, passwordInput, userId, password) {
  userIdInput.value = userId;
  userIdInput.dispatchEvent(new Event("input", { bubbles: true }));
  userIdInput.dispatchEvent(new Event("change", { bubbles: true }));

  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
  passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
}

async function runAutoLogin() {
  const currentUrl = window.location.href;
  if (lastAttemptedUrl === currentUrl) {
    return;
  }

  const settings = await api.storage.local.get({
    loginPageUrl: DEFAULT_LOGIN_PAGE_URL,
    userId: "",
    password: "",
    autoLoginEnabled: false
  });

  if (!isTargetLoginPage(settings.loginPageUrl)) {
    clearActiveCountdown();
    stopActiveObserver();
    return;
  }

  if (!settings.autoLoginEnabled || !settings.userId || !settings.password) {
    clearActiveCountdown();
    stopActiveObserver();
    return;
  }

  const startCountdownAndLogin = (loginForm, userIdInput, passwordInput) => {
    lastAttemptedUrl = window.location.href;
    clearActiveCountdown();

    const popup = createCountdownPopup();
    let remainingSeconds = COUNTDOWN_SECONDS;

    const updateMessage = () => {
      popup.textContent = `自動ログインまで ${remainingSeconds} 秒`;
    };

    const executeLogin = () => {
      fillCredentials(userIdInput, passwordInput, settings.userId, settings.password);

      const loginButton = loginForm.querySelector('button[name="loginButton"]');
      if (loginButton) {
        loginButton.click();
        return;
      }

      const submitInput = loginForm.querySelector('input[type="submit"]');
      if (submitInput) {
        submitInput.click();
        return;
      }

      if (typeof loginForm.requestSubmit === "function") {
        loginForm.requestSubmit();
      } else {
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        loginForm.submit();
      }
    };

    updateMessage();
    activeCountdownIntervalId = window.setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds > 0) {
        updateMessage();
        return;
      }

      clearActiveCountdown();
      executeLogin();
    }, 1000);
  };

  const findLoginTargets = () => {
    const candidateForms = document.querySelectorAll("form");
    for (const formElement of candidateForms) {
      const userIdInput = formElement.querySelector('input[name="userId"]');
      const passwordInput = formElement.querySelector('input[name="password"]');
      if (!userIdInput || !passwordInput) {
        continue;
      }
      return {
        loginForm: formElement,
        userIdInput,
        passwordInput
      };
    }
    return null;
  };

  const initialTargets = findLoginTargets();
  if (initialTargets) {
    startCountdownAndLogin(initialTargets.loginForm, initialTargets.userIdInput, initialTargets.passwordInput);
    return;
  }

  stopActiveObserver();
  activeObserver = new MutationObserver(() => {
    const targets = findLoginTargets();
    if (!targets) {
      return;
    }
    stopActiveObserver();
    startCountdownAndLogin(targets.loginForm, targets.userIdInput, targets.passwordInput);
  });

  activeObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.setTimeout(() => {
    stopActiveObserver();
  }, 30000);
}
