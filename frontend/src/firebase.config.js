import { getApp, getApps, initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
import {getStorage} from "firebase/getStorage"
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const firebaseConfig = {
  apiKey: process.env.FIREBASE,
  authDomain: "mern-auth-82257.firebaseapp.com",
  projectId: "mern-auth-82257",
  storageBucket: "mern-auth-82257.appspot.com",
  messagingSenderId: "354174433221",
  appId: "1:354174433221:web:cd145a2bf124f207fafdac"
};

const app =getApps.length > 0 ? getApp() : initializeApp(firebaseConfig)

const firestore  =getFirestore(app)
const storage = getStorage(app)
export {app ,firestore, storage}