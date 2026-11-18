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