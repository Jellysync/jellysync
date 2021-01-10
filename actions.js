import './microModal.css';
import MicroModal from 'micromodal';
import jsCookie from 'js-cookie';
import appendHtml from 'appendhtml';

export async function showUpdateModal(snapshot, callback) {
  const { refreshTime, modalTitle, modalText, updateIsOptional } = snapshot;

  // Don't do anything if a modal is already open
  if (document.getElementsByClassName('jellysync_modal').length) {
    return;
  }

  const closeTag = updateIsOptional ? 'data-micromodal-close' : '';
  const countdown = updateIsOptional ? '' : `<p class="jellysync_modal__countdown">Auto refreshing in ${refreshTime} seconds.</p>`;
  const cancelButton = updateIsOptional
    ? '<button id="jellysync_cancel_button" class="jellysync_modal__btn jellysync_modal__btn jellysync_cancel_button" data-micromodal-close>Cancel</button>'
    : '';

  const jellySyncModal = `
    <div class="jellysync_modal" id="jellysync-modal" aria-hidden="true">
      <div class="jellysync_modal__overlay" tabindex="-1" ${closeTag}>
        <div class="jellysync_modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
          <header class="jellysync_modal__header">
            <h2 class="jellysync_modal__title" id="modal-1-title">
              ${modalTitle}
            </h2>
          </header>
          <main class="jellysync_modal__content" id="modal-1-content">
            <p>${modalText}</p>
            ${countdown}
          </main>
          <footer class="jellysync_modal__footer">
            ${cancelButton}
            <button id="jellysync_update_button" class="jellysync_modal__btn jellysync_modal__btn-primary jellysync_update_button">Update</button>
          </footer>
        </div>
      </div>
    </div>
  `;

  await appendHtml(jellySyncModal, document.body);

  // Must be called before modal is opened
  if (!updateIsOptional) {
    document.onkeydown = event => {
      if (event.keyCode === 27) {
        event.stopImmediatePropagation();
      }
    };
  }

  let secondsToGo = refreshTime;
  let timer = null;

  MicroModal.show('jellysync-modal', {
    onClose: async () => {
      const modal = document.querySelector('#jellysync-modal');
      modal.parentNode.removeChild(modal);
    }
  });

  const performUpdate = async () => {
    clearInterval(timer);

    if (countdown) {
      document.getElementsByClassName('jellysync_modal__countdown')[0].innerHTML = ``;
    }

    const updateButton = document.querySelector('#jellysync_update_button');
    updateButton.textContent = 'Updating...';
    updateButton.disabled = true;

    const cancelButtonSelector = document.querySelector('#jellysync_cancel_button');

    if (cancelButtonSelector) {
      cancelButtonSelector.parentElement.removeChild(cancelButtonSelector);
    }

    await callback();

    MicroModal.close('jellysync-modal');
  };

  if (!updateIsOptional) {
    timer = setInterval(async () => {
      secondsToGo -= 1;

      document.getElementsByClassName('jellysync_modal__countdown')[0].innerHTML = `Auto refreshing in ${secondsToGo} seconds.`;

      if (secondsToGo <= 0) {
        await performUpdate();
      }
    }, 1000);
  }

  document.getElementsByClassName('jellysync_update_button')[0].onclick = async () => {
    await performUpdate();
  };
}

export function forceRefresh(snapshot) {
  location.reload((snapshot.actions || []).includes('clearCache'));
}

export async function clearCache() {
  const keyList = await caches.keys();

  await Promise.all(keyList.map(key => caches.delete(key)));

  const scripts = Object.values(document.scripts).map(s => s.src);
  const links = Object.values(document.getElementsByTagName('link')).map(l => l.href);
  const sources = scripts.concat(links);

  for (let i = 0; i < sources.length; i++) {
    let currUrl = sources[i];

    if (currUrl.includes(window.location.origin)) {
      currUrl = currUrl.replace(window.location.origin, '');
    } else {
      continue;
    }

    const ifr = document.createElement('iframe');
    ifr.name = ifr.id = `ifr_${i}_${Date.now()}`;
    ifr.classList.add(`jellysync_ifr`);
    document.body.appendChild(ifr);

    const form = document.createElement('form');
    form.method = 'POST';
    form.target = ifr.name;
    form.action = currUrl;

    document.body.appendChild(form);

    form.submit();

    try {
      await fetch(currUrl, { cache: 'reload', credentials: 'include' });
    } catch (e) {}
  }
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
        if (storage[k]) {
          localStorage.setItem(k, storage[k]);
        }
      });
    }
  } else {
    localStorage.clear();
  }

  localStorage.setItem('jellySyncVersion', snapshot.version);
  localStorage.setItem('jellySyncEndpoint', JSON.stringify(snapshot.endpoint));
}

export function clearSessionStorage(snapshot) {
  if (!snapshot.clearAllSessionStorage) {
    if (snapshot.whiteListSessionStorage) {
      snapshot.sessionStorageKeys.forEach(k => sessionStorage.removeItem(k));
    } else {
      const storage = {};

      snapshot.sessionStorageKeys.forEach(k => (storage[k] = sessionStorage.getItem(k)));
      sessionStorage.clear();
      Object.keys(storage).forEach(k => {
        if (storage[k]) {
          sessionStorage.setItem(k, storage[k]);
        }
      });
    }
  } else {
    sessionStorage.clear();
  }
}

export function clearCookies(snapshot) {
  Object.keys(jsCookie.get()).forEach(cookie => {
    if (snapshot.clearAllCookies) {
      jsCookie.remove(cookie);
      return;
    }

    if (snapshot.whiteListCookies) {
      if (snapshot.cookieKeys.includes(cookie)) {
        jsCookie.remove(cookie);
        return;
      }
    } else {
      if (!snapshot.cookieKeys.includes(cookie)) {
        jsCookie.remove(cookie);
        return;
      }
    }
  });
}
