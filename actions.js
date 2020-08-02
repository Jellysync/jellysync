import './microModal.css';
import MicroModal from 'micromodal';
import jsCookie from 'js-cookie';
import $ from 'jquery';

export function showUpdateModal(snapshot, clearCache) {
  const { version, showModalOnForce, refreshTime, modalText } = snapshot;

  // Don't do anything if a modal is already open
  if ($('.jellysync_modal').length) {
    return;
  }

  if (!showModalOnForce) {
    return location.reload(clearCache);
  }

  $(document.body).append(`
    <div class="jellysync_modal" id="jellysync-modal" aria-hidden="true">
      <div class="jellysync_modal__overlay" tabindex="-1">
        <div class="jellysync_modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
          <header class="jellysync_modal__header">
            <h2 class="jellysync_modal__title" id="modal-1-title">
              Update to version ${version}
            </h2>
          </header>
          <main class="jellysync_modal__content" id="modal-1-content">
            <p>${modalText}</p>
            <p class="jellysync_modal__countdown">Auto refreshing in ${refreshTime} seconds.</p>
          </main>
          <footer class="jellysync_modal__footer">
            <button class="jellysync_modal__btn jellysync_modal__btn-primary jellysync_update_button">Update</button>
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

  MicroModal.show('jellysync-modal', {
    onClose: () => {
      clearInterval(timer);
      snapshot.reloadCallback();
      location.reload(clearCache);
    }
  });

  timer = setInterval(() => {
    secondsToGo -= 1;

    $('.jellysync_modal__countdown').text(`Auto refreshing in ${secondsToGo} seconds.`);

    if (secondsToGo <= 0) {
      MicroModal.close('jellysync-modal');
    }
  }, 1000);

  $('.jellysync_update_button').click(() => {
    MicroModal.close('jellysync-modal');
  });
}

export function forceRefresh(snapshot) {
  if (snapshot.initialLoad) {
    snapshot.reloadCallback();
    location.reload(false);
    return;
  }

  showUpdateModal(snapshot, false);
}

export function clearCache(snapshot) {
  if (snapshot.initialLoad) {
    snapshot.reloadCallback();
    location.reload(true);
    return;
  }

  showUpdateModal(snapshot, true);
}

export function clearLocalStorage(snapshot) {
  if (!snapshot.clearAllLocalStorage) {
    if (snapshot.whiteListLocalStorage) {
      snapshot.localStorageKeys.forEach(k => localStorage.removeItem(k));
    } else {
      const storage = {};

      snapshot.localStorageKeys.forEach(k => (storage[k] = localStorage.getItem(k)));
      localStorage.clear();
      Object.keys(storage).forEach(k => {
        console.log(storage[k]);
        if (storage[k]) {
          localStorage.setItem(k, storage[k]);
        }
      });
    }
  } else {
    localStorage.clear();
  }

  localStorage.setItem('jellySyncVersion', snapshot.version);
}

export function clearSessionStorage() {
  sessionStorage.clear();
}

export function clearCookies() {
  Object.keys(jsCookie.get()).forEach(cookie => jsCookie.remove(cookie));
}
