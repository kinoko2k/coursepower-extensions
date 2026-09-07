function isCorsCollPage() {
  const path = window.location.pathname.toLowerCase();
  return path.includes("corscoll") || path.includes("dolinkkougi");
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

function getTargetBulkLinks() {
  const mode = sessionStorage.getItem("cp_bulk_read_mode") || "unread";
  const processed = JSON.parse(sessionStorage.getItem("cp_bulk_processed") || "[]");
  let candidates = parseMaterialLinks();
  if (mode === "unread") {
    candidates = parseUnreadMaterialLinks();
  }
  return candidates.filter((link) => {
    const key = link.getAttribute("onclick") || link.href || link.textContent.trim();
    return !processed.includes(key);
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function checkBulkReadWorkflow() {
  const tryStep = () => {
    if (sessionStorage.getItem("cp_bulk_read_active") !== "true") return true;

    const allLinks = parseMaterialLinks();

    if (allLinks.length > 0) {
      sessionStorage.removeItem("cp_detail_processed");
      sessionStorage.removeItem("cp_current_download");

      const targetLinks = getTargetBulkLinks();
      if (targetLinks.length > 0) {
        updatePanelStatus(`自動処理中... (残り: ${targetLinks.length})`);
        const link = targetLinks[0];
        const key = link.getAttribute("onclick") || link.href || link.textContent.trim();
        const processed = JSON.parse(sessionStorage.getItem("cp_bulk_processed") || "[]");
        if (!processed.includes(key)) {
          processed.push(key);
          sessionStorage.setItem("cp_bulk_processed", JSON.stringify(processed));
        }
        setTimeout(() => {
          link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        }, 1500);
      } else {
        updatePanelStatus("すべての処理が完了しました");
        sessionStorage.removeItem("cp_bulk_read_active");
        sessionStorage.removeItem("cp_bulk_read_mode");
        sessionStorage.removeItem("cp_bulk_processed");
        const btn = document.getElementById("coursepower-bulk-btn");
        if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
        const allBtn = document.getElementById("coursepower-bulk-all-btn");
        if (allBtn) { allBtn.disabled = false; allBtn.style.opacity = "1"; }
        const stopBtn = document.getElementById("coursepower-bulk-stop-btn");
        if (stopBtn) stopBtn.style.display = "none";
      }
      return true;
    }

    if (sessionStorage.getItem("cp_detail_processed") === "true") {
      return true;
    }

    const downloadLinks = Array.from(document.querySelectorAll('a[onclick*="downloadFile("]'));
    if (downloadLinks.length > 0) {
      sessionStorage.setItem("cp_detail_processed", "true");
      updatePanelStatus(`詳細ページ処理中... (${downloadLinks.length}件のファイル)`);

      downloadLinks.forEach((link, index) => {
        setTimeout(() => {
          link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        }, index * 1000);
      });

      setTimeout(() => goBackFromDetail(), downloadLinks.length * 1000 + 1500);
      return true;
    }

    const backBtn = Array.from(document.querySelectorAll('a, input, button')).find((el) => {
      const txt = el.textContent || el.value || "";
      const clk = el.getAttribute('onclick') || "";
      return txt.includes('戻る') || clk.includes('back');
    });

    if (backBtn) {
      sessionStorage.setItem("cp_detail_processed", "true");
      updatePanelStatus("ファイルなし。戻ります...");
      setTimeout(() => goBackFromDetail(), 1000);
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

function applyStyles(element, styles) {
  Object.assign(element.style, styles);
  return element;
}

function createPanelElement(id, styles) {
  const el = document.createElement("div");
  if (id) el.id = id;
  return applyStyles(el, styles);
}

function createStyledButton(id, text, styles, onClick) {
  const btn = document.createElement("button");
  if (id) btn.id = id;
  btn.type = "button";
  btn.textContent = text;
  applyStyles(btn, {
    border: "none",
    borderRadius: "5px",
    padding: "6px 8px",
    color: "#ffffff",
    cursor: "pointer",
    ...styles
  });
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}

function setupCorsCollBulkDownloadPanel() {

  const isActive = sessionStorage.getItem("cp_bulk_read_active") === "true";

  if (!isActive && !isCorsCollPage()) {
    removeBulkDownloadPanel();
    return;
  }

  let panel = document.getElementById(BULK_PANEL_ID);
  if (!panel) {
    panel = createPanelElement(BULK_PANEL_ID, {
      position: "fixed",
      bottom: "16px",
      left: "16px",
      zIndex: "2147483647",
      padding: "10px",
      background: "#111827",
      color: "#ffffff",
      borderRadius: "8px",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      fontSize: "12px",
      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.28)",
      minWidth: "220px"
    });

    const header = createPanelElement(null, {
      fontSize: "11px",
      fontWeight: "600",
      color: "#9ca3af",
      marginBottom: "6px"
    });
    header.textContent = "資料一括ダウンロード";

    const btnGroup = createPanelElement(null, { display: "flex", gap: "6px" });

    const startBulkDownload = (mode) => {
      sessionStorage.setItem("cp_bulk_read_mode", mode);
      sessionStorage.setItem("cp_bulk_processed", JSON.stringify([]));
      const targetLinks = getTargetBulkLinks();
      if (!targetLinks.length) {
        status.textContent = mode === "unread" ? "未参照のリンクが見つかりませんでした" : "対象のリンクが見つかりませんでした";
        return;
      }
      sessionStorage.setItem("cp_bulk_read_active", "true");
      button.disabled = true;
      button.style.opacity = "0.7";
      allBtn.disabled = true;
      allBtn.style.opacity = "0.7";
      stopBtn.style.display = "block";
      status.textContent = `自動処理中... (残り: ${targetLinks.length})`;

      const link = targetLinks[0];
      const key = link.getAttribute("onclick") || link.href || link.textContent.trim();
      sessionStorage.setItem("cp_bulk_processed", JSON.stringify([key]));
      setTimeout(() => {
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      }, 500);
    };

    const button = createStyledButton("coursepower-bulk-btn", "未参照のみ", { flex: "1", background: "#2563eb" }, () => startBulkDownload("unread"));
    const allBtn = createStyledButton("coursepower-bulk-all-btn", "すべて", { flex: "1", background: "#374151", border: "1px solid #4b5563" }, () => startBulkDownload("all"));

    const stopBtn = createStyledButton("coursepower-bulk-stop-btn", "停止", { width: "100%", padding: "5px", marginTop: "6px", background: "#ef4444", display: "none" }, () => {
      sessionStorage.removeItem("cp_bulk_read_active");
      sessionStorage.removeItem("cp_bulk_read_mode");
      sessionStorage.removeItem("cp_bulk_processed");
      sessionStorage.removeItem("cp_current_download");
      sessionStorage.removeItem("cp_detail_processed");
      button.disabled = false;
      button.style.opacity = "1";
      allBtn.disabled = false;
      allBtn.style.opacity = "1";
      stopBtn.style.display = "none";
      status.textContent = "停止しました";
    });

    const status = createPanelElement("coursepower-bulk-status", {
      marginTop: "6px",
      color: "#9ca3af",
      fontSize: "11px"
    });
    status.textContent = "待機中";

    const updateButtonStates = () => {
      if (sessionStorage.getItem("cp_bulk_read_active") === "true") return;
      
      const allLinks = parseMaterialLinks();
      const unreadLinks = parseUnreadMaterialLinks();
      
      const setBtnState = (btn, count) => {
        if (!btn) return;
        if (count === 0) {
          btn.disabled = true;
          btn.style.opacity = "0.4";
          btn.style.cursor = "not-allowed";
        } else {
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }
      };
      
      setBtnState(button, unreadLinks.length);
      setBtnState(allBtn, allLinks.length);
      
      if (allLinks.length === 0) {
        status.textContent = "ダウンロード可能な資料がありません";
      } else {
        status.textContent = `待機中 (全資料: ${allLinks.length}件 / 未参照: ${unreadLinks.length}件)`;
      }
    };

    updateButtonStates();
    const btnStateInterval = setInterval(() => {
      if (!document.getElementById(BULK_PANEL_ID)) {
        clearInterval(btnStateInterval);
        return;
      }
      updateButtonStates();
    }, 1000);

    btnGroup.appendChild(button);
    btnGroup.appendChild(allBtn);
    panel.appendChild(header);
    panel.appendChild(btnGroup);
    panel.appendChild(stopBtn);
    panel.appendChild(status);
    document.body.appendChild(panel);
  }

  if (isActive) {
    const button = document.getElementById("coursepower-bulk-btn");
    const allBtn = document.getElementById("coursepower-bulk-all-btn");
    const stopBtn = document.getElementById("coursepower-bulk-stop-btn");
    if (button) { button.disabled = true; button.style.opacity = "0.7"; }
    if (allBtn) { allBtn.disabled = true; allBtn.style.opacity = "0.7"; }
    if (stopBtn) stopBtn.style.display = "block";
    checkBulkReadWorkflow();
  }
}
