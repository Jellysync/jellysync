import firebase from 'firebase/app';
import 'firebase/database';
import * as actions from './actions';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import $ from 'jquery';

const axiosInstance = axios.create();
axiosRetry(axiosInstance, {
  retries: 3
});

const actionFunctions = {
  forceRefresh: actions.forceRefresh,
  clearCache: actions.clearCache,
  clearLocalStorage: actions.clearLocalStorage,
  clearSessionStorage: actions.clearSessionStorage,
  clearCookies: actions.clearCookies
};

const prdUrl = 'http://localhost:5001/jellysync/us-central1/api';
let initialLoad = true;
let database = null;
let projectId = null;
let endpoint = null;
let dbRef = null;

async function initialize(pId) {
  projectId = pId;
  endpoint = await getEndpoint(projectId);

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

  connect();

  window.onbeforeunload = () => {
    killAndReconnect(false);

    return null;
  };

  $(window).blur(function () {
    killAndReconnect(false);

    return null;
  });

  $(window).focus(function () {
    connect();
  });
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
      }
    }

    dbRef = database.ref(`projects/${projectId}/${endpoint.id}`);
    dbRef.onDisconnect(() => killAndReconnect());

    dbRef.on('value', async snapshot => {
      const snapshotValue = snapshot.val();

      // should happen when we scramble
      if (!snapshotValue) {
        killAndReconnect();
        return;
      }

      if (localStorage.getItem('jellySyncVersion') !== snapshotValue.version) {
        snapshotValue.initialLoad = initialLoad;
        localStorage.setItem('jellySyncVersion', snapshotValue.version);

        (snapshotValue.actions || []).forEach(action => actionFunctions[action](snapshotValue));
      }

      initialLoad = false;
    });
  } catch (e) {
    console.log(e.message);
    await connect(attemptsRemaining - 1);
  }
}

async function getEndpoint(projectId) {
  try {
    const currEndpoint = await axiosInstance.get(`${prdUrl}/projectEndpoint?projectId=${projectId}`);

    return currEndpoint ? currEndpoint.data : null;
  } catch (e) {
    return null;
  }
}

function killAndReconnect(shouldReconnect = true) {
  dbRef.off();

  if (endpoint) {
    axiosInstance.post(`${prdUrl}/killChannel`, {
      projectId,
      channelId: endpoint.id
    });
  }

  endpoint = null;

  if (shouldReconnect) {
    connect();
  }
}

const Jellysync = {
  initialize
};

window.Jellysync = Jellysync;
export default Jellysync;
