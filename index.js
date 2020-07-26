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

async function initialize(projectId, options) {
  endpoint = localStorage.getItem('jellysyncEndpoint');

  if (!endpoint) {
    endpoint = await getEndpoint(projectId);
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
  const database = firebase.database();

  currVersion = localStorage.getItem('jellySyncVersion');

  dbRef = database.ref(`projects/${projectId}/${endpoint.id}`);
  connect();

  dbRef.onDisconnect(() => connect());
}

async function connect() {
  if (attempts == 0) {
    return;
  }

  try {
    dbRef.on('value', snapshot => {
      // successful connection resets attempts
      attempts = 4;
      const snapshotValue = snapshot.val();

      if (!currVersion) {
        localStorage.setItem('jellySyncVersion', snapshotValue.version);
        currVersion = snapshotValue.version;

        return;
      }

      if (currVersion !== snapshotValue.version) {
        (snapshotValue.actions || []).forEach(action => actionFunctions[action](snapshotValue));

        localStorage.setItem('jellySyncVersion', snapshotValue.version);
        currVersion = snapshotValue.version;
      }
    });
  } catch (e) {
    attempts--;
    endpoint = await getEndpoint(pId);
    dbRef = database.ref(`projects/${pId}/${endpoint.id}`);
    connect();

    dbRef.onDisconnect(() => connect());
  }
}

async function getEndpoint(projectId) {
  const currEndpoint = await axios.get(
    `https://us-central1-jellysync.cloudfunctions.net/api/projectEndpoint?projectId=${projectId}`
  );

  const stringifiedEndpoint = JSON.stringify(currEndpoint.data);
  localStorage.setItem('jellysyncEndpoint', stringifiedEndpoint);

  return currEndpoint.data;
}

const Jellysync = {
  initialize
};

window.Jellysync = Jellysync;

module.exports = Jellysync;
