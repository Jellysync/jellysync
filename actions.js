require('./microModal.css');

const jsCookie = require('js-cookie');
const MicroModal = require('micromodal').default;
const $ = require('jquery');

function showUpdateModal(snapshot, clearCache) {
  const { version, showModalOnForce, refreshTime, modalText } = snapshot;

  if (!showModalOnForce) {
    return location.reload(clearCache);
  }

  $(document.body).append(`
    <div class="jellysync_modal micromodal-slide" id="jellysync-modal" aria-hidden="true">
      <div class="modal__overlay" tabindex="-1">
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
          <header class="modal__header">
            <h2 class="modal__title" id="modal-1-title">
              Update to version ${version}
            </h2>
          </header>
          <main class="modal__content" id="modal-1-content">
            <p>${modalText}</p>
            <p class="modal__countdown">Auto refreshing in ${refreshTime} seconds.</p>
          </main>
          <footer class="modal__footer">
            <button class="modal__btn modal__btn-primary jellysync_update_button">Update</button>
          </footer>
        </div>
      </div>
    </div>
  `);

  $(document).keydown(function (event) {
    if (event.keyCode === 27) {
      event.stopImmediatePropagation();
    }
  });

  let secondsToGo = refreshTime;
  let timer = null;

  MicroModal.init();
  MicroModal.show('jellysync-modal', {
    onClose: () => {
      clearInterval(timer);
      location.reload(clearCache);
    }
  });

  timer = setInterval(() => {
    secondsToGo -= 1;

    $('.modal__countdown').text(`Auto refreshing in ${secondsToGo} seconds.`);

    if (secondsToGo <= 0) {
      MicroModal.close('jellysync-modal');
    }
  }, 1000);

  $('.jellysync_update_button').click(() => {
    MicroModal.close('jellysync-modal');
  });
}

function forceUpdate(snapshot) {
  if (snapshot.initialLoad) {
    location.reload(false);
    return;
  }

  showUpdateModal(snapshot, false);
}

function clearCache(snapshot) {
  if (snapshot.initialLoad) {
    location.reload(true);
    return;
  }

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
