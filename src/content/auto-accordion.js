async function runAutoAccordion() {
  const settings = await api.storage.local.get({
    autoOpenAccordion: true
  });
  
  if (!settings.autoOpenAccordion) {
    return;
  }
  
  const tryOpen = () => {
    const allOpenBtn = document.querySelector('.allOpen');
    if (allOpenBtn && !allOpenBtn.classList.contains('on')) {
      allOpenBtn.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      
      setTimeout(() => {
        if (!allOpenBtn.classList.contains('on')) {
          allOpenBtn.classList.add('on');
          const txt = document.getElementById('allOpenTxt');
          if (txt) txt.textContent = "すべて閉じる";
          document.querySelectorAll('.kyozaiHidden').forEach(el => {
            el.style.display = 'table-row';
            el.classList.remove('hide');
          });
          document.querySelectorAll('.jyugyoHidden').forEach(el => el.classList.add('on'));
        }
      }, 100);
      return true;
    }
    return !!allOpenBtn;
  };

  if (!tryOpen()) {
    const observer = new MutationObserver((mutations, obs) => {
      if (tryOpen()) {
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => observer.disconnect(), 5000);
  }
}
