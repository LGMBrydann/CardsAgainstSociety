export let blackCards = [];

export let whiteCards = [];


export async function loadCards(){

const black =
await fetch(
"data/blackCards.json"
);


blackCards =
await black.json();



const white =
await fetch(
"data/whiteCards.json"
);


whiteCards =
await white.json();

}