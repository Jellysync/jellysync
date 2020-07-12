const firebase = require('firebase');
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

let version = null;

function initialize(projectId, options) {
  database.ref(`projects/${projectId}/version`).on('value', snapshot => {
    if (!version) {
      // send that we are listening to the server
      version = snapshot.val();
      return;
    }

    message.info(snapshot.val());
    console.log(snapshot.val());
  });

  window.onclose = () => {
    alert('closing');
    database.ref(`projects/${projectId}/version`).off();
  };
}

module.exports = {
  initialize
};
