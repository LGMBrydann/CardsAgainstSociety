import {
    db,
    auth
} from "./firebase.js";


import {
    getDoc
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    onSnapshot
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    startRound
} from "./rounds.js";

await startRound(currentRoom);

let currentRoom = null;
let ready = false;



function generateCode(){

return Math.random()
.toString(36)
.substring(2,8)
.toUpperCase();

}


async function getProfile(){

const userRef =
doc(
db,
"users",
auth.currentUser.uid
);


const snapshot =
await getDoc(userRef);


return snapshot.data();

}


async function createRoom(privateRoom){


const profile = await getProfile();
const user = auth.currentUser;

const code = generateCode();


await setDoc(
doc(db,"rooms",code),
{

host:user.uid,

private:privateRoom,

players:[
{
id:user.uid,
name:profile.username,
avatar:profile.avatar,
ready:false
}
],

status:"waiting",

created:Date.now()

});


joinRoom(code);

}



async function joinRoom(code){


const profile = await getProfile();
const user = auth.currentUser;


const roomRef =
doc(db,"rooms",code);


const room =
await getDoc(roomRef);



if(!room.exists()){

alert("Room not found!");

return;

}



await updateDoc(
roomRef,
{

players:
arrayUnion({

id:user.uid,

name:profile.username,

avatar:profile.avatar,

ready:false
})

});



currentRoom = code;


listenRoom(code);


}



function listenRoom(code){


onSnapshot(
doc(db,"rooms",code),

(snapshot)=>{


const data =
snapshot.data();


document
.getElementById(
"codeDisplay"
)
.textContent =
code;



const list =
document.getElementById(
"players"
);



list.innerHTML="";



data.players.forEach(player=>{


const card =
document.createElement("div");


card.className =
"player-card";


card.innerHTML = `

<img src="${player.avatar}"
class="player-avatar">


<div>

<h3>
${player.name}
</h3>


<p>
${player.ready ? "✅ Ready":"⏳ Waiting"}
</p>


</div>

`;


list.appendChild(card);


});



if(data.host === auth.currentUser.uid){

document
.getElementById(
"startButton"
)
.hidden=false;

}


});


}




document
.getElementById("publicGame")
.onclick=()=>createRoom(false);



document
.getElementById("privateGame")
.onclick=()=>createRoom(true);



document
.getElementById("joinRoom")
.onclick=()=>{


const code =
document
.getElementById("roomCode")
.value
.toUpperCase();


joinRoom(code);


};





document
.getElementById("readyButton")
.onclick=async()=>{


ready=!ready;


const ref =
doc(db,"rooms",currentRoom);


const snap =
await getDoc(ref);


let players =
snap.data().players;


players =
players.map(p=>{


if(p.id === auth.currentUser.uid){

p.ready = ready;

}


return p;


});



await updateDoc(
ref,
{

players

});


};





document
.getElementById("startButton")
.onclick=async()=>{


await updateDoc(
doc(db,"rooms",currentRoom),
{

status:"playing"

});


window.location.href =
"game.html?room="+currentRoom;


};