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
  const firebaseConfig = {
    apiKey: 'AIzaSyDRP5cBqpyLVUugQWZtYbSjaqrQlxYs2G8',
    authDomain: 'jellysync.firebaseapp.com',
    databaseURL: `https://jellysync-${projectId}.firebaseio.com`,
    projectId: 'jellysync',
    storageBucket: 'jellysync.appspot.com',
    messagingSenderId: '757397537758',
    appId: '1:757397537758:web:7dd1645537045fdfcb534f'
  };

  pId = projectId;

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  currVersion = localStorage.getItem('jellySyncVersion');
  endpoint = localStorage.getItem('jellysyncEndpoint');

  if (!endpoint) {
    endpoint = await getEndpoint(projectId);
  }

  dbRef = database.ref(`project/${endpoint}`);
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
    dbRef = database.ref(`project/${endpoint}`);
    connect();

    dbRef.onDisconnect(() => connect());
  }
}

async function getEndpoint(projectId) {
  const endpointId = await axios.get(
    `https://us-central1-jellysync.cloudfunctions.net/api/projectEndpoint?projectId=${projectId}`
  );
  localStorage.setItem('jellysyncEndpoint', endpointId.data);

  return endpointId.data;
}

const Jellysync = {
  initialize
};

window.Jellysync = Jellysync;

module.exports = Jellysync;
