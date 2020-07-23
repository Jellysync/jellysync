const firebase = require('firebase');
const actions = require('./actions');
require('antd/dist/antd.css');

const firebaseConfig = {
  apiKey: 'AIzaSyDRP5cBqpyLVUugQWZtYbSjaqrQlxYs2G8',
  authDomain: 'jellysync.firebaseapp.com',
  databaseURL: 'https://jellysync.firebaseio.com',
  projectId: 'jellysync',
  storageBucket: 'jellysync.appspot.com',
  messagingSenderId: '757397537758',
  appId: '1:757397537758:web:7dd1645537045fdfcb534f'
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const actionFunctions = {
  forceUpdate: actions.forceUpdate,
  clearCache: actions.clearCache,
  clearLocalStorage: actions.clearLocalStorage,
  clearSessionStorage: actions.clearSessionStorage,
  clearCookies: actions.clearCookies
};

let currVersion = null;

function initialize(projectId, options) {
  currVersion = localStorage.getItem('jellySyncVersion');

  const ref = database.ref(`projects/${projectId}`);
  connect(ref);

  ref.onDisconnect(() => connect(ref));
}

function connect(ref) {
  ref.on('value', snapshot => {
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
}

const Jellysync = {
  initialize
};

window.Jellysync = Jellysync;

module.exports = Jellysync;
