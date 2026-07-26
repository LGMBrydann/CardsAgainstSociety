import {
    db
} from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    blackCards,
    whiteCards,
    loadCards
} from "./cards.js";

function getRandomCards(count = 5) {
    const pool = [...whiteCards];
    const picked = [];

    while (picked.length < count && pool.length) {
        const index = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(index, 1)[0]);
    }

    return picked;
}

function getNextJudge(players, currentJudge) {
    if (!players || !players.length) {
        return null;
    }

    if (!currentJudge) {
        return players[0].id;
    }

    const currentIndex = players.findIndex((player) => player.id === currentJudge);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % players.length : 0;

    return players[nextIndex].id;
}

function ensurePlayerHands(players, existingHands = {}, currentScores = {}, judgeId) {
    const hands = {};
    players.forEach((player) => {
        if (player.id === judgeId) {
            hands[player.id] = [];
        } else {
            const existingHand = Array.isArray(existingHands[player.id]) ? existingHands[player.id] : [];
            if (existingHand.length >= 5) {
                hands[player.id] = existingHand;
            } else {
                hands[player.id] = [...existingHand, ...getRandomCards(5 - existingHand.length)];
            }
        }
        if (!currentScores[player.id]) {
            currentScores[player.id] = 0;
        }
    });
    return { hands, scores: currentScores };
}

export async function startRound(roomCode) {
    await loadCards();

    const roomRef = doc(db, "rooms", roomCode);
    const snapshot = await getDoc(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found");
    }

    const data = snapshot.data();
    const players = Array.isArray(data.players) ? data.players : [];
    const card = blackCards[Math.floor(Math.random() * blackCards.length)];
    const currentScores = data.scores || {};
    const existingHands = data.hands || {};
    const nextJudge = getNextJudge(players, data.judge);
    const { hands, scores } = ensurePlayerHands(players, existingHands, currentScores, nextJudge);

    await updateDoc(roomRef, {
        status: "playing",
        round: (data.round || 0) + 1,
        judge: nextJudge,
        blackCard: card.text,
        submissions: {},
        scores,
        hands,
        winner: null,
        winnerText: "",
        winnerCard: null,
        roundOver: false
    });
}

export async function submitCard(roomCode, playerId, card) {
    await loadCards();

    const roomRef = doc(db, "rooms", roomCode);
    const snapshot = await getDoc(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found");
    }

    const data = snapshot.data();
    const player = (data.players || []).find((entry) => entry.id === playerId);
    const submissions = data.submissions || {};
    const hands = data.hands || {};
    const currentHand = Array.isArray(hands[playerId]) ? hands[playerId] : [];

    const nextHand = currentHand.filter((entry) => entry.text !== card.text);
    const replacementCards = getRandomCards(Math.max(0, 5 - nextHand.length));

    submissions[playerId] = {
        playerId,
        playerName: player?.name || "Player",
        text: card.text,
        card
    };

    await updateDoc(roomRef, {
        submissions,
        hands: {
            ...hands,
            [playerId]: [...nextHand, ...replacementCards]
        }
    });
}

export async function chooseWinner(roomCode, submissionKey) {
    await loadCards();

    const roomRef = doc(db, "rooms", roomCode);
    const snapshot = await getDoc(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found");
    }

    const data = snapshot.data();
    const selectedSubmission = data.submissions?.[submissionKey];

    if (!selectedSubmission) {
        return;
    }

    const scores = {
        ...(data.scores || {})
    };

    const winnerId = selectedSubmission.playerId;
    scores[winnerId] = (scores[winnerId] || 0) + 1;

    await updateDoc(roomRef, {
        winner: winnerId,
        winnerText: selectedSubmission.text,
        winnerCard: selectedSubmission.card || null,
        scores,
        status: "round-over",
        roundOver: true
    });

    window.setTimeout(() => {
        startRound(roomCode).catch((error) => console.error(error));
    }, 2200);
}