import {
    auth,
    db
} from "./firebase.js";


import {

GoogleAuthProvider,

signInWithPopup,

createUserWithEmailAndPassword,

signInWithEmailAndPassword

}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {

doc,

getDoc,

setDoc

}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const provider =
new GoogleAuthProvider();



const message =
document.getElementById("message");



async function checkUser(user){


const userRef =
doc(
db,
"users",
user.uid
);



const snapshot =
await getDoc(userRef);



if(!snapshot.exists()){


await setDoc(
userRef,
{

username:"",

email:user.email,

photoURL:
user.photoURL || "",

wins:0,

gamesPlayed:0,

funnyScore:0,

profileComplete:false,

created:
Date.now()

});


window.location.href =
"profile-setup.html";


return;

}



const data =
snapshot.data();



if(!data.profileComplete){


window.location.href =
"profile-setup.html";


return;


}



window.location.href =
"lobby.html";


}






// GOOGLE LOGIN

const googleButton =
document.getElementById(
"googleLogin"
);



if(googleButton){


googleButton.onclick =
async()=>{


try{


const result =
await signInWithPopup(
auth,
provider
);


await checkUser(
result.user
);


}

catch(error){

console.error(error);

message.textContent =
error.message;

}


};


}






// EMAIL LOGIN

const loginButton =
document.getElementById(
"emailLogin"
);



if(loginButton){


loginButton.onclick =
async()=>{


try{


const email =
document.getElementById(
"email"
).value;


const password =
document.getElementById(
"password"
).value;



const result =
await signInWithEmailAndPassword(
auth,
email,
password
);



await checkUser(
result.user
);



}

catch(error){

console.error(error);

message.textContent =
error.message;

}



};


}






// EMAIL SIGNUP

const signupButton =
document.getElementById(
"emailSignup"
);



if(signupButton){


signupButton.onclick =
async()=>{


try{


const email =
document.getElementById(
"email"
).value;


const password =
document.getElementById(
"password"
).value;



const result =
await createUserWithEmailAndPassword(
auth,
email,
password
);



await checkUser(
result.user
);



}

catch(error){

console.error(error);

message.textContent =
error.message;

}



};


}