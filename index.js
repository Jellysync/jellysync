import firebase from 'firebase/app';
import 'firebase/database';
import * as actions from './actions';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const axiosInstance = axios.create();
axiosRetry(axiosInstance, { retries: 3 });

const actionFunctions = {
  forceRefresh: actions.forceRefresh,
  clearCache: actions.clearCache,
  clearLocalStorage: actions.clearLocalStorage,
  clearSessionStorage: actions.clearSessionStorage,
  clearCookies: actions.clearCookies
};

let initialLoad = true;
let database = null;
let projectId = null;
let endpoint = null;
let dbRef = null;

async function initialize(pId) {
  projectId = pId;
  endpoint = JSON.parse(localStorage.getItem('jellySyncEndpoint')) || (await getEndpoint(projectId));

  if (!endpoint) {
    return;
  }

  const firebaseConfig = {
    apiKey: 'AIzaSyDRP5cBqpyLVUugQWZtYbSjaqrQlxYs2G8',
    authDomain: 'jellysync.firebaseapp.com',
    databaseURL: endpoint.databaseURL,
    projectId: 'jellysync',
    storageBucket: 'jellysync.appspot.com',
    messagingSenderId: '757397537758',
    appId: '1:757397537758:web:7dd1645537045fdfcb534f'
  };

  firebase.initializeApp(firebaseConfig);
  database = firebase.database();

  await connect();

  document.body.onfocus = async () => {
    const connected = await firebase.database().ref('.info/connected').once('value');

    if (!connected.val()) {
      connect();
    }
  };
}

async function connect(attemptsRemaining = 4) {
  if (attemptsRemaining === 0) {
    return;
  }

  try {
    if (!endpoint) {
      endpoint = await getEndpoint(projectId);

      if (!endpoint) {
        connect(attemptsRemaining - 1);
        return;
      }
    }

    dbRef = database.ref(`projects/${projectId}/${endpoint.id}`);

    dbRef.onDisconnect(() => connect());

    dbRef.on('value', async snapshot => {
      const snapshotValue = snapshot.val();

      // should happen when we scramble
      if (!snapshotValue) {
        endpoint = await getEndpoint(projectId);
        connect();

        return;
      }

      dbRef.update({ currentVersion: localStorage.getItem('jellySyncVersion') });

      if (snapshotValue.version && localStorage.getItem('jellySyncVersion') !== snapshotValue.version) {
        const runUpdate = async () => {
          localStorage.setItem('jellySyncVersion', snapshotValue.version);

          snapshotValue.endpoint = endpoint;

          const actions = snapshotValue.actions || [];

          for (let action of actions) {
            await actionFunctions[action](snapshotValue);
          }
        };

        if (initialLoad || !snapshotValue.showModalOnForce) {
          await runUpdate();
        } else {
          actions.showUpdateModal(snapshotValue, runUpdate);
        }
      }

      initialLoad = false;
    });
  } catch (e) {
    await connect(attemptsRemaining - 1);
  }
}

async function getEndpoint(projectId) {
  try {
    const currEndpoint = await axiosInstance.get(`https://app.jellysync.com/api/v1/projects/${projectId}/projectEndpoint`);

    if (currEndpoint.data) {
      localStorage.setItem('jellySyncEndpoint', JSON.stringify(currEndpoint.data));
    }

    return currEndpoint.data;
  } catch (e) {
    return null;
  }
}

const Jellysync = {
  initialize
};

window.Jellysync = Jellysync;
export default Jellysync;
