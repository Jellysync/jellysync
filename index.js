const firebase = require('firebase');
const actions = require('./actions');
const axios = require('axios');

const actionFunctions = {
  forceUpdate: actions.forceUpdate,
  clearCache: actions.clearCache,
  clearLocalStorage: actions.clearLocalStorage,
  clearSessionStorage: actions.clearSessionStorage,
  clearCookies: actions.clearCookies
};

let currVersion = null;
let endpoint = null;
let dbRef = null;
let pId = null;
let attempts = 4;
let initialLoad = true;
let database = null;

async function initialize(projectId) {
  endpoint = localStorage.getItem('jellysyncEndpoint');

  if (!endpoint) {
    endpoint = await getEndpoint(projectId);
    console.log(endpoint);
  } else {
    endpoint = JSON.parse(endpoint);
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

  pId = projectId;

  firebase.initializeApp(firebaseConfig);
  database = firebase.database();

  currVersion = localStorage.getItem('jellySyncVersion');

  dbRef = database.ref(`/projects/${projectId}/${endpoint.id}`);
  connect();

  dbRef.onDisconnect(() => connect());
}

async function connect() {
  if (attempts == 0) {
    return;
  }

  try {
    dbRef.on('value', async snapshot => {
      // successful connection resets attempts
      console.log('connected');
      attempts = 4;
      const snapshotValue = snapshot.val();

      if (!snapshotValue) {
        await reconnect();
        return;
      }

      if (!currVersion) {
        localStorage.setItem('jellySyncVersion', snapshotValue.version);
        currVersion = snapshotValue.version;

        return;
      }

      if (currVersion !== snapshotValue.version) {
        snapshotValue.initialLoad = initialLoad;

        (snapshotValue.actions || []).forEach(action => actionFunctions[action](snapshotValue));

        localStorage.setItem('jellySyncVersion', snapshotValue.version);
        localStorage.setItem('jellysyncEndpoint', JSON.stringify(endpoint));
        currVersion = snapshotValue.version;
      }

      initialLoad = false;
    });
  } catch (e) {
    await reconnect();
  }
}

async function reconnect() {
  attempts--;
  endpoint = await getEndpoint(pId);
  dbRef = database.ref(`/projects/${pId}/${endpoint.id}`);
  connect();

  dbRef.onDisconnect(() => connect());
}

async function getEndpoint(projectId) {
  const prdUrl = 'https://us-central1-jellysync.cloudfunctions.net/api';
  const localUrl = 'http://localhost:5001/jellysync/us-central1/api';
  const currEndpoint = await axios.get(`${localUrl}/projectEndpoint?projectId=${projectId}`);

  const stringifiedEndpoint = JSON.stringify(currEndpoint.data);
  localStorage.setItem('jellysyncEndpoint', stringifiedEndpoint);

  return currEndpoint.data;
}

const Jellysync = {
  initialize
};

window.Jellysync = Jellysync;

module.exports = Jellysync;
