const firebase = require('firebase');

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

function initialize(projectId) {
  database.ref(`projects/${projectId}/version`).on('value', snapshot => {
    alert(snapshot.val());
  });

  window.onclose = () => {
    database.ref(`projects/${projectId}/version`).off();
  };
}

module.exports = {
  initialize
};
