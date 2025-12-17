const firebaseConfig = {
  apiKey: "AIzaSyBIP8ylGV5eken3YCaZjThQQ_d7C1Nt2Nc",
  authDomain: "knitting-notes-dbb77.firebaseapp.com",
  databaseURL: "https://knitting-notes-dbb77-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "knitting-notes-dbb77",
  storageBucket: "knitting-notes-dbb77.firebasestorage.app",
  messagingSenderId: "787568293944",
  appId: "1:787568293944:web:977590261ae7abe75a8ecd"
};

// Firebase初期化
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
