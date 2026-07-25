import {
    auth,
    db
} from "./firebase.js";


import {
    onAuthStateChanged
} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    doc,
    updateDoc,
    getDoc
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let currentUser;



onAuthStateChanged(auth,(user)=>{


if(!user){

window.location.href="login.html";

return;

}


currentUser=user;


});




const button =
document.getElementById(
"saveProfile"
);



button.onclick = async()=>{


const username =
document.getElementById(
"username"
).value.trim();



if(username.length < 3){

alert(
"Username must be at least 3 characters"
);

return;

}



const userRef =
doc(
db,
"users",
currentUser.uid
);



await updateDoc(
userRef,
{


username: username,


profileComplete:true


});



window.location.href =
"lobby.html";


};