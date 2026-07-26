import {
    auth,
    db
} from "./firebase.js";

import {
    doc,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    loadCards
} from "./cards.js";

import {
    chooseWinner,
    startRound,
    submitCard
} from "./rounds.js";

let roomCode = null;
let currentRoomData = null;
let hand = [];
let selectedCardIndex = null;
let unsubscribe = null;

function getRoomCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("room");
}

function getCurrentUserId() {
    return auth.currentUser?.uid || null;
}

function setStatus(message) {
    const status = document.getElementById("gameStatus");
    if (status) {
        status.textContent = message;
    }
}

function renderHand() {
    const area = document.getElementById("hand");
    if (!area) {
        return;
    }

    area.innerHTML = "";

    hand.forEach((card, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.textContent = card.text;

        if (selectedCardIndex === index) {
            div.classList.add("selected");
        }

        div.onclick = () => {
            selectedCardIndex = index;
            renderHand();
        };

        area.appendChild(div);
    });
}

function renderScores() {
    const list = document.getElementById("scores");
    if (!list || !currentRoomData) {
        return;
    }

    const players = currentRoomData.players || [];
    const scores = currentRoomData.scores || {};

    list.innerHTML = "";

    players.forEach((player) => {
        const item = document.createElement("li");
        item.textContent = `${player.name}: ${scores[player.id] || 0}`;
        if (currentRoomData.judge === player.id) {
            item.textContent += " 👑";
        }
        list.appendChild(item);
    });
}

function renderSubmissions() {
    const judgePanel = document.getElementById("judgePanel");
    const waitingPanel = document.getElementById("waitingPanel");
    const submitButton = document.getElementById("submitCard");
    const waitingText = document.getElementById("waitingText");
    const submissionsArea = document.getElementById("submissions");
    const resultMessage = document.getElementById("resultMessage");

    if (!judgePanel || !waitingPanel || !submissionsArea || !waitingText || !submitButton || !resultMessage) {
        return;
    }

    const userId = getCurrentUserId();
    const submissions = currentRoomData?.submissions || {};
    const isJudge = currentRoomData?.judge === userId;
    const alreadySubmitted = Boolean(submissions[userId]);

    judgePanel.classList.toggle("hidden", !isJudge);
    waitingPanel.classList.toggle("hidden", isJudge);
    submitButton.classList.toggle("hidden", isJudge);
    submitButton.disabled = isJudge || alreadySubmitted;

    if (isJudge) {
        submissionsArea.innerHTML = "";
        const submissionEntries = Object.entries(submissions);

        if (!submissionEntries.length) {
            submissionsArea.innerHTML = "<p>Waiting for players to submit cards...</p>";
        } else {
            submissionEntries.forEach(([key, submission]) => {
                const button = document.createElement("button");
                button.textContent = submission.text;
                button.onclick = async () => {
                    await chooseWinner(roomCode, key);
                };
                submissionsArea.appendChild(button);
            });
        }
    } else {
        submissionsArea.innerHTML = "";
        waitingText.textContent = alreadySubmitted
            ? "Your card is in. Waiting for the judge..."
            : "Waiting for the judge...";
    }

    if (currentRoomData?.winnerText) {
        resultMessage.textContent = `Winner: ${currentRoomData.winnerText}`;
    } else {
        resultMessage.textContent = "";
    }
}

async function ensurePlayerHand() {
    const userId = getCurrentUserId();
    if (!userId || !roomCode || !currentRoomData) {
        return;
    }

    const existingHand = currentRoomData.hands?.[userId];
    if (existingHand?.length) {
        hand = existingHand;
        renderHand();
        return;
    }

    const roomRef = doc(db, "rooms", roomCode);
    const newHand = [];
    const whiteCardPool = (await import("./cards.js")).whiteCards;

    while (newHand.length < 5 && whiteCardPool.length) {
        const index = Math.floor(Math.random() * whiteCardPool.length);
        newHand.push(whiteCardPool.splice(index, 1)[0]);
    }

    await updateDoc(roomRef, {
        hands: {
            ...(currentRoomData.hands || {}),
            [userId]: newHand
        }
    });
}

async function syncRoomState() {
    if (!roomCode) {
        return;
    }

    const roomRef = doc(db, "rooms", roomCode);
    unsubscribe = onSnapshot(roomRef, async (snapshot) => {
        if (!snapshot.exists()) {
            setStatus("Room not found.");
            return;
        }

        currentRoomData = snapshot.data();

        document.getElementById("roomCode").textContent = roomCode;
        document.getElementById("roundText").textContent = `Round ${currentRoomData.round || 1}`;

        const blackCardText = currentRoomData.blackCard || "Waiting for the next round...";
        document.getElementById("blackCard").textContent = blackCardText;

        const judge = (currentRoomData.players || []).find((player) => player.id === currentRoomData.judge);
        if (judge) {
            setStatus(`Judge: ${judge.name}`);
        } else {
            setStatus("Waiting for the judge...");
        }

        if (currentRoomData.host === getCurrentUserId() && (!currentRoomData.blackCard || currentRoomData.status !== "playing")) {
            try {
                await startRound(roomCode);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        renderScores();
        renderSubmissions();
        await ensurePlayerHand();
        renderHand();
    });
}

async function handleSubmitCard() {
    const userId = getCurrentUserId();
    if (!userId || !roomCode || !currentRoomData) {
        return;
    }

    if (currentRoomData.judge === userId) {
        setStatus("You are the judge. Wait for submissions.");
        return;
    }

    if (selectedCardIndex === null) {
        alert("Pick a card first!");
        return;
    }

    const selectedCard = hand[selectedCardIndex];
    if (!selectedCard) {
        return;
    }

    if (currentRoomData.submissions?.[userId]) {
        setStatus("You already submitted a card.");
        return;
    }

    await submitCard(roomCode, userId, selectedCard);
    setStatus("Card submitted. Waiting for the judge...");
    selectedCardIndex = null;
    renderHand();
}

function attachEvents() {
    const submitButton = document.getElementById("submitCard");
    if (submitButton) {
        submitButton.onclick = handleSubmitCard;
    }

    const returnLobbyButton = document.getElementById("returnLobby");
    if (returnLobbyButton) {
        returnLobbyButton.onclick = () => {
            window.location.href = "lobby.html";
        };
    }
}

async function startGame() {
    await loadCards();
    attachEvents();

    roomCode = getRoomCodeFromUrl();

    if (!roomCode) {
        setStatus("No room code found. Open this page from the lobby.");
        return;
    }

    await syncRoomState();
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    startGame().catch((error) => console.error(error));
});