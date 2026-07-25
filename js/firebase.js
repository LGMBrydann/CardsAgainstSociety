// Firebase imports
import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
    getAuth 
} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyBRtNVJR6ejJ2dGxXOr9uWNpef7NfrYyv8",

    authDomain: "cardsagainstsociety-auth.firebaseapp.com",

    projectId: "cardsagainstsociety-auth",

    storageBucket: "cardsagainstsociety-auth.firebasestorage.app",

    messagingSenderId: "370760597907",

    appId: "1:370760597907:web:0f7dd22f21ac8ec331a866"

};



const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const db = getFirestore(app);