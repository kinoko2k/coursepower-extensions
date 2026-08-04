let sessionTimerIntervalId = null;
let sessionTimerPopupElement = null;

function createSessionTimerPopup() {
  if (sessionTimerPopupElement) {
    sessionTimerPopupElement.remove();
  }
  const popup = document.createElement("div");
  popup.id = "coursepower-session-timer-popup";
  popup.style.position = "fixed";
  popup.style.top = "24px";
  popup.style.right = "24px";
  popup.style.zIndex = "2147483647";
  popup.style.padding = "20px 24px";
  popup.style.background = "#ffffff";
  popup.style.color = "#1f2937";
  popup.style.border = "1px solid #e5e7eb";
  popup.style.borderRadius = "12px";
  popup.style.fontSize = "16px";
  popup.style.fontWeight = "bold";
  popup.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  popup.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.2)";
  popup.style.display = "flex";
  popup.style.alignItems = "center";
  popup.style.gap = "16px";

  const message = document.createElement("span");
  message.id = "coursepower-session-timer-message";
  popup.appendChild(message);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.fontSize = "20px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.color = "#9ca3af";
  closeBtn.style.padding = "0";
  closeBtn.style.lineHeight = "1";
  closeBtn.onclick = () => popup.remove();
  popup.appendChild(closeBtn);

  document.body.appendChild(popup);
  sessionTimerPopupElement = popup;
  return { popup, message };
}

function showSessionTimerPopup(minutesPassed, isTimeout) {
  const { popup, message } = createSessionTimerPopup();
  if (isTimeout) {
    message.textContent = `ログインから ${minutesPassed} 分経過しました。自動的にログアウトされる可能性があります。`;
    message.style.color = "#dc2626";
  } else {
    message.textContent = `ログインから ${minutesPassed} 分経過しました。`;
  }
  
  if (!isTimeout) {
    setTimeout(() => {
      if (sessionTimerPopupElement === popup) {
        popup.remove();
        sessionTimerPopupElement = null;
      }
    }, 15000);
  }
}

async function runSessionTimer() {
  const settings = await api.storage.local.get({
    loginPageUrl: DEFAULT_LOGIN_PAGE_URL,
    sessionTimerEnabled: true,
    sessionTimeout: 30,
    loginTime: 0
  });

  if (!settings.sessionTimerEnabled) {
    if (sessionTimerIntervalId) {
      clearInterval(sessionTimerIntervalId);
    }
    return;
  }

  const isLogin = isTargetLoginPage(settings.loginPageUrl);

  if (isLogin) {
    await api.storage.local.set({ loginTime: 0 });
    if (sessionTimerIntervalId) {
      clearInterval(sessionTimerIntervalId);
    }
    return;
  }

  let loginTime = settings.loginTime;
  if (!loginTime) {
    loginTime = Date.now();
    await api.storage.local.set({ loginTime });
  }

  if (sessionTimerIntervalId) {
    clearInterval(sessionTimerIntervalId);
  }

  let notifiedMinutes = new Set();

  sessionTimerIntervalId = setInterval(() => {
    const elapsedMs = Date.now() - loginTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    if (elapsedMinutes > 0 && elapsedMinutes % 10 === 0 && !notifiedMinutes.has(elapsedMinutes)) {
      notifiedMinutes.add(elapsedMinutes);
      const isTimeout = elapsedMinutes >= settings.sessionTimeout;
      showSessionTimerPopup(elapsedMinutes, isTimeout);
    }
  }, 5000);
}
