require('./actions.css');
const jsCookie = require('js-cookie');
const { Modal } = require('antd');

function showUpdateModal(snapshot, clearCache) {
  const { version, showModalOnForce, refreshTime, modalText } = snapshot;

  if (!showModalOnForce) {
    return location.reload(clearCache);
  }

  let secondsToGo = refreshTime;

  const modal = Modal.info({
    className: 'jellySyncUpdateModal',
    title: `Update to version ${version}`,
    content: `${modalText}\n\nAuto refreshing in ${secondsToGo} seconds.`,
    keyboard: false,
    okText: 'Update',
    onOk() {
      location.reload(clearCache);
    }
  });

  const timer = setInterval(() => {
    secondsToGo -= 1;

    modal.update({
      content: `${modalText}\n\nAuto refreshing in ${secondsToGo} seconds.`
    });
  }, 1000);

  setTimeout(() => {
    clearInterval(timer);

    location.reload(clearCache);
  }, secondsToGo * 1000);
}

function forceUpdate(snapshot) {
  showUpdateModal(snapshot, false);
}

function clearCache(snapshot) {
  showUpdateModal(snapshot, true);
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
