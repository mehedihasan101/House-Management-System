/**
 * Smooth Navigation
 * Page load cholar somoy onno page e click korle:
 *  - sathe sathe cholte thaka request gulo cancel hoye jabe
 *  - "Load failed" error alert ar ashbe na
 *  - upore ekta chhoto progress bar dekhabe (click hoyeche bujhar jonno)
 *  - purano page er load shesh howar jonno wait korte hobe na
 *
 * Use kora: ei code ta app.js er EKDOM SHURU te paste koro
 * (apiCall define howar age). Ager "Load failed" snippet ta thakle mushe dao.
 */
(function () {
  if (window.__smoothNavReady) return;
  window.__smoothNavReady = true;
  window.__pageLeaving = false;

  // ===== 1. fetch error: page chere jawar somoy hole error dhore feli =====
  // Page chere jachchi, tai error er bodole request ta "chup kore jhule thake"
  // (page unload holei shesh). Ete apiCall er catch/alert kichu dekhay na.
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch) {
    window.fetch = function () {
      return nativeFetch.apply(window, arguments).catch(function (err) {
        if (window.__pageLeaving) return new Promise(function () {});
        throw err;
      });
    };
  }

  // ===== 2. Safety net: alert e network error ashle, page chere gele dekhabe na =====
  const nativeAlert = window.alert.bind(window);
  const NET_ERR = /load failed|failed to fetch|networkerror|network request failed|aborted/i;
  window.alert = function (msg) {
    if (window.__pageLeaving && NET_ERR.test(String(msg))) return;
    nativeAlert(msg);
  };

  // ===== 3. Upore progress bar (click er sathe sathe feedback) =====
  const style = document.createElement('style');
  style.textContent = `
    #navProgress { position: fixed; top: 0; left: 0; height: 3px; width: 0; background: var(--primary, #0f766e); z-index: 99999; opacity: 0; pointer-events: none; }
    #navProgress.run { opacity: 1; width: 85%; transition: width 2.5s cubic-bezier(0.1, 0.7, 0.2, 1); }
    body.nav-leaving { opacity: 0.6; transition: opacity 0.25s ease; }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'navProgress';
  document.body.appendChild(bar);

  function showProgress() {
    bar.classList.remove('run');
    void bar.offsetWidth; // restart transition
    bar.classList.add('run');
    document.body.classList.add('nav-leaving');
  }

  function resetNav() {
    window.__pageLeaving = false;
    bar.classList.remove('run');
    document.body.classList.remove('nav-leaving');
  }

  // Back button e ferot ashle (bfcache) state reset
  window.addEventListener('pageshow', resetNav);

  // ===== 4. Link e click korle sathe sathe onno page e jawa =====
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

    const href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(href)) return;
    if (a.origin !== location.origin) return;                  // baire er link
    if (a.pathname === location.pathname) return;              // same page
    if (href === 'more.html' && window.__moreSheetReady) return; // More sheet khulbe

    e.preventDefault();
    window.__pageLeaving = true;
    showProgress();

    try { window.stop(); } catch (err) {}   // cholte thaka request cancel
    location.href = a.href;                 // sathe sathe notun page e

    // Jodi kono karone navigation na hoy, 8 sec pore normal e ferot
    setTimeout(resetNav, 8000);
  }, true);
})();







const API_URL = "https://script.google.com/macros/s/AKfycbwvesxwvTINTOwXpFL40GGwwKOLK9VFg5aqOQsHNwgnBzyTd1g5AKHCUhMaRfrCdBW2/exec"; 

const session = JSON.parse(localStorage.getItem('hm_session'));

if (!session && !window.location.pathname.includes('index.html')) {
  window.location.href = 'index.html';
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item, .b-nav-item').forEach(item => {
    if (item.getAttribute('href') === currentPath) item.classList.add('active');
  });

  if (session) {
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = session.name);
  }
});

function logout() {
  localStorage.removeItem('hm_session');
  window.location.href = 'index.html';
}

async function apiCall(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload: { token: session ? session.token : '', ...payload } }),
      redirect: 'follow'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  } catch (err) {
    console.error("API Error: ", err);
    alert("Error: " + err.message);
    return null;
  }
}







