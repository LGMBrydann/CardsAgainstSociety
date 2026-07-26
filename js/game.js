import {
blackCards,
whiteCards,
loadCards
}
from "./cards.js";


let hand=[];

let selected=null;


let playerScore=0;

let cpuScore=0;



async function startGame(){

await loadCards();


drawBlackCard();


drawHand();


}



function drawBlackCard(){

const card =
blackCards[
Math.floor(
Math.random()*blackCards.length
)
];


document
.getElementById("blackCard")
.textContent =
card.text;

}




function drawHand(){

hand=[];


while(hand.length < 5){

let card =
whiteCards[
Math.floor(
Math.random()*whiteCards.length
)
];


hand.push(card);


}



renderHand();

}



function renderHand(){

const area =
document.getElementById("hand");


area.innerHTML="";



hand.forEach((card,index)=>{


const div =
document.createElement("div");


div.className="card";


div.textContent =
card.text;



div.onclick=()=>{


document
.querySelectorAll(".card")
.forEach(c=>
c.classList.remove("selected")
);


div.classList.add(
"selected"
);


selected=index;


};



area.appendChild(div);


});

}




document
.getElementById("submit")
.onclick=()=>{


if(selected===null){

alert(
"Pick a card first!"
);

return;

}



document
.getElementById("result")
.textContent =
"You played: "
+
hand[selected].text;


};



startGame();