const firebase = require('firebase');
const actions = require('./actions');
const { message } = require('antd');
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
  forcedUpdate: actions.forceUpdate,
  clearCache: actions.clearCache,
  clearLocalStorage: actions.clearLocalStorage,
  clearSessionStorage: actions.clearSessionStorage,
  clearCookies: actions.clearCookies
};

let version = null;

function initialize(projectId, options) {
  version = localStorage.getItem('jellySyncVersion');
  const ref = database.ref(`projects/${projectId}`);
  connect(ref);

  ref.onDisconnect(() => connect(ref));
}

function connect(ref) {
  ref.on('value', snapshot => {
    const incomingVersion = snapshot.val().version;
    if (!version || version !== incomingVersion) {
      snapshot.val().actions.foreach(action => actionFunctions[action]);
      localStorage.setItem(('jellySyncVersion', incomingVersion));
      version = incomingVersion;

      return;
    }
  });
}

module.exports = {
  initialize
};
