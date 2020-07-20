const firebase = require('firebase');
const actions = require('./actions');
const { message } = require('antd');
require('antd/dist/antd.css');

const firebaseConfig = {
  apiKey: 'AIzaSyDweMX3B6S8PxKeokSVnmOMAdO_oRqgQX8',
  authDomain: 'mergefly-sync.firebaseapp.com',
  databaseURL: 'https://mergefly-sync.firebaseio.com',
  projectId: 'mergefly-sync',
  storageBucket: 'mergefly-sync.appspot.com',
  messagingSenderId: '185516473579',
  appId: '1:185516473579:web:6953bd4c841a55c93492ae',
  measurementId: 'G-BYY5M8ZCST'
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
