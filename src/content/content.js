const api = typeof browser !== "undefined" ? browser : chrome;
const COUNTDOWN_SECONDS = 3;
const DEFAULT_LOGIN_PAGE_URL = "/lginLgir/";
const URL_CHANGE_EVENT = "coursepower:urlchange";
const CORSCOLL_PATH_SEGMENT = "/corsColl/";
const BULK_PANEL_ID = "coursepower-bulk-download-panel";

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

function isCorsCollPage() {
  return window.location.pathname.toLowerCase().includes("corscoll");
}

function updatePanelStatus(text) {
  const status = document.getElementById("coursepower-bulk-status");
  if (status) status.textContent = text;
}

function removeBulkDownloadPanel() {
  const panel = document.getElementById(BULK_PANEL_ID);
  if (panel) panel.remove();
}

function parseMaterialLinks() {
  return Array.from(document.querySelectorAll('a[onclick*="kyozaiTitleLink("]'));
}

function parseUnreadMaterialLinks() {
  const links = parseMaterialLinks();
  return links.filter((link) => {
    let parent = link.parentElement;
    while (parent && parent.tagName !== 'TR') {
      parent = parent.parentElement;
    }
    if (parent && parent.textContent.includes('未参照')) return true;
    if (parent && !parent.textContent.includes('参照済')) return true;
    return false;
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function checkBulkReadWorkflow() {
  const tryStep = () => {
    if (sessionStorage.getItem("cp_bulk_read_active") !== "true") return true;

    const downloadLink = document.querySelector('a[onclick*="downloadFile("]');
    if (downloadLink) {
      if (sessionStorage.getItem("cp_current_download") === window.location.href) {
        updatePanelStatus("処理済みの詳細ページです。戻ります...");
        sessionStorage.removeItem("cp_current_download");
        setTimeout(() => goBackFromDetail(), 1000);
        return true;
      }

      updatePanelStatus("ダウンロード詳細ページ処理中...");
      sessionStorage.setItem("cp_current_download", window.location.href);
      downloadLink.click();
      setTimeout(() => goBackFromDetail(), 2500);
      return true;
    }

    const allLinks = parseMaterialLinks();
    if (allLinks.length > 0) {
      const unreadLinks = parseUnreadMaterialLinks();
      if (unreadLinks.length > 0) {
        updatePanelStatus(`自動処理中... (残り: ${unreadLinks.length})`);
        setTimeout(() => {
          unreadLinks[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        }, 1500);
      } else {
        updatePanelStatus("すべての処理が完了しました");
        sessionStorage.removeItem("cp_bulk_read_active");
        const btn = document.getElementById("coursepower-bulk-btn");
        if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
        const stopBtn = document.getElementById("coursepower-bulk-stop-btn");
        if (stopBtn) stopBtn.style.display = "none";
      }
      return true;
    }
    return false;
  };

  let attempts = 0;
  const intervalId = setInterval(() => {
    attempts++;
    if (tryStep() || attempts > 20) {
      clearInterval(intervalId);
      if (attempts > 20 && sessionStorage.getItem("cp_bulk_read_active") === "true") {
        updatePanelStatus("対象要素が見つからず待機しています...");
      }
    }
  }, 500);
}

function goBackFromDetail() {
  const backBtn = Array.from(document.querySelectorAll('a, input, button')).find((el) => {
    const txt = el.textContent || el.value || "";
    const clk = el.getAttribute('onclick') || "";
    return txt.includes('戻る') || clk.includes('back');
  });
  if (backBtn && typeof backBtn.click === 'function') {
    backBtn.click();
  } else {
    history.back();
  }
}

function setupCorsCollBulkDownloadPanel() {
  if (window.top !== window) return;

  const isActive = sessionStorage.getItem("cp_bulk_read_active") === "true";

  if (!isActive && !isCorsCollPage()) {
    removeBulkDownloadPanel();
    return;
  }

  let panel = document.getElementById(BULK_PANEL_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = BULK_PANEL_ID;
    panel.style.position = "fixed";
    panel.style.bottom = "16px";
    panel.style.left = "16px";
    panel.style.zIndex = "2147483647";
    panel.style.padding = "10px";
    panel.style.background = "#111827";
    panel.style.color = "#ffffff";
    panel.style.borderRadius = "8px";
    panel.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
    panel.style.fontSize = "12px";
    panel.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.28)";
    panel.style.minWidth = "220px";

    const button = document.createElement("button");
    button.id = "coursepower-bulk-btn";
    button.type = "button";
    button.textContent = "資料を一括で開く";
    button.style.width = "100%";
    button.style.border = "1px solid #374151";
    button.style.borderRadius = "6px";
    button.style.padding = "8px 10px";
    button.style.background = "#2563eb";
    button.style.color = "#ffffff";
    button.style.cursor = "pointer";

    const stopBtn = document.createElement("button");
    stopBtn.id = "coursepower-bulk-stop-btn";
    stopBtn.type = "button";
    stopBtn.textContent = "停止";
    stopBtn.style.width = "100%";
    stopBtn.style.border = "1px solid #374151";
    stopBtn.style.borderRadius = "6px";
    stopBtn.style.padding = "4px 10px";
    stopBtn.style.marginTop = "4px";
    stopBtn.style.background = "#dc2626";
    stopBtn.style.color = "#ffffff";
    stopBtn.style.cursor = "pointer";
    stopBtn.style.display = "none";

    const status = document.createElement("div");
    status.id = "coursepower-bulk-status";
    status.style.marginTop = "8px";
    status.style.color = "#d1d5db";
    status.textContent = "待機中";

    button.addEventListener("click", () => {
      const unreadLinks = parseUnreadMaterialLinks();
      if (!unreadLinks.length) {
        status.textContent = "未参照のリンクが見つかりませんでした";
        return;
      }
      sessionStorage.setItem("cp_bulk_read_active", "true");
      button.disabled = true;
      button.style.opacity = "0.7";
      stopBtn.style.display = "block";
      status.textContent = `自動処理中... (残り: ${unreadLinks.length})`;

      const link = unreadLinks[0];
      setTimeout(() => {
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      }, 500);
    });

    stopBtn.addEventListener("click", () => {
      sessionStorage.removeItem("cp_bulk_read_active");
      sessionStorage.removeItem("cp_current_download");
      button.disabled = false;
      button.style.opacity = "1";
      stopBtn.style.display = "none";
      status.textContent = "停止しました";
    });

    panel.appendChild(button);
    panel.appendChild(stopBtn);
    panel.appendChild(status);
    document.body.appendChild(panel);
  }

  if (isActive) {
    const button = document.getElementById("coursepower-bulk-btn");
    const stopBtn = document.getElementById("coursepower-bulk-stop-btn");
    if (button) { button.disabled = true; button.style.opacity = "0.7"; }
    if (stopBtn) stopBtn.style.display = "block";
    checkBulkReadWorkflow();
  }
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
  });
}

installUrlChangeHooks();
runAutoLogin();
setupCorsCollBulkDownloadPanel();
