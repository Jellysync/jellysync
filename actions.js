const jsCookie = require('js-cookie');

function forceUpdate() {
  // configure showing modal
  location.reload();
}

function clearCache() {
  // configure showing modal
  location.reload(true);
}

function clearLocalStorage() {
  localStorage.clear();
}

function clearSessionStorage() {
  sessionStorage.clear();
}

function clearCookies() {
  Object.keys(jsCookie.get()).forEach(cookie => jsCookie.remove(cookie));
}

module.exports = {
  forceUpdate,
  clearCache,
  clearCookies,
  clearLocalStorage,
  clearSessionStorage
};
