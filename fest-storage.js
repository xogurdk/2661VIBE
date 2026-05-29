/**
 * 페스티벌 공통 저장 — 로그인 이름 기준 (부모 index.html 연동)
 * 각 게임: FestStorage.init(gameId); FestStorage.onReady((data)=>{...}); FestStorage.save(data);
 */
(function (global) {
  let user = null;
  let gameId = null;
  let data = null;
  const listeners = [];

  function notify() {
    listeners.forEach(function (fn) {
      try { fn(data); } catch (e) { console.warn(e); }
    });
  }

  function localKey(gid) {
    const u = user || '_guest';
    return 'gfest_save_' + gid + '_' + u;
  }

  function loadLocal(gid) {
    try {
      const raw = localStorage.getItem(localKey(gid || gameId));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveLocal(gid, payload) {
    try {
      localStorage.setItem(localKey(gid || gameId), JSON.stringify(payload));
    } catch (e) {}
  }

  global.addEventListener('message', function (e) {
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'FEST_INIT') {
      user = d.user || null;
      gameId = d.gameId;
      data = d.data != null ? d.data : loadLocal(d.gameId);
      notify();
    }
    if (d.type === 'FEST_DATA') {
      if (d.gameId != null) gameId = d.gameId;
      if (d.user) user = d.user;
      data = d.data != null ? d.data : null;
      notify();
    }
  });

  function init(gid) {
    gameId = gid;
    data = loadLocal(gid);
    try { parent.postMessage({ type: 'FEST_LOAD', gameId: gid }, '*'); } catch (e) {}
    try { parent.postMessage({ type: 'FEST_READY', gameId: gid }, '*'); } catch (e) {}
    setTimeout(function () {
      if (user == null) notify();
    }, 300);
  }

  function onReady(fn) {
    listeners.push(fn);
    if (data != null) fn(data);
  }

  function save(payload) {
    data = payload;
    saveLocal(gameId, payload);
    try {
      parent.postMessage({ type: 'FEST_SAVE', gameId: gameId, data: payload }, '*');
    } catch (e) {}
  }

  function get() {
    return data;
  }

  function getUser() {
    return user;
  }

  function merge(defaults) {
    const base = JSON.parse(JSON.stringify(defaults));
    if (!data || typeof data !== 'object') return base;
    return Object.assign(base, data);
  }

  global.FestStorage = {
    init: init,
    onReady: onReady,
    save: save,
    get: get,
    getUser: getUser,
    loadLocal: loadLocal,
    merge: merge
  };
})(window);
