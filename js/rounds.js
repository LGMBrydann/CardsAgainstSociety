import {
    db
} from "./firebase.js";


import {
    doc,
    updateDoc
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


import {
    blackCards
} from "./cards.js";


export async function startRound(roomCode){


    const card =
    blackCards[
        Math.floor(
            Math.random() * blackCards.length
        )
    ];


    await updateDoc(
        doc(db,"rooms",roomCode),
        {

            blackCard: card.text,

            submissions:{}

        }
    );

}