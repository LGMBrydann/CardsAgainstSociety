import {
    db,
    auth
} from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    startRound
} from "./rounds.js";

let currentRoom = null;
let ready = false;
let roomUnsubscribe = null;

function generateCode() {
    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
}

function setStatus(message) {
    const messageEl = document.getElementById("message");
    if (messageEl) {
        messageEl.textContent = message;
    }
}

async function ensureSignedIn() {
    if (auth.currentUser) {
        return auth.currentUser;
    }

    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
}

async function getProfile() {
    const user = await ensureSignedIn();

    if (!user) {
        throw new Error("Please sign in before creating or joining a room.");
    }

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const defaultProfile = {
            username: user.displayName || "Player",
            email: user.email || "",
            photoURL: user.photoURL || "",
            avatar: user.photoURL || "https://i.pravatar.cc/100",
            wins: 0,
            gamesPlayed: 0,
            funnyScore: 0,
            profileComplete: false,
            created: Date.now()
        };

        await setDoc(userRef, defaultProfile);
        return defaultProfile;
    }

    const data = snapshot.data() || {};

    return {
        ...data,
        username: data.username || user.displayName || "Player",
        avatar: data.avatar || data.photoURL || user.photoURL || "https://i.pravatar.cc/100"
    };
}

async function createRoom(privateRoom) {
    try {
        setStatus("Creating room...");
        const profile = await getProfile();
        const user = await ensureSignedIn();

        if (!user) {
            throw new Error("Please sign in before creating a room.");
        }

        let code = null;

        for (let attempt = 0; attempt < 10; attempt += 1) {
            code = generateCode();
            const roomRef = doc(db, "rooms", code);
            const existingRoom = await getDoc(roomRef);

            if (!existingRoom.exists()) {
                break;
            }

            code = null;
        }

        if (!code) {
            throw new Error("Unable to create a room right now. Please try again.");
        }

        await setDoc(doc(db, "rooms", code), {
            host: user.uid,
            private: privateRoom,
            players: [{
                id: user.uid,
                name: profile.username || user.displayName || "Player",
                avatar: profile.avatar || user.photoURL || "https://i.pravatar.cc/100",
                ready: false
            }],
            status: "waiting",
            round: 0,
            judge: null,
            blackCard: "",
            submissions: {},
            scores: {},
            hands: {},
            created: Date.now()
        });

        await joinRoom(code, true);
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Could not create a room.");
    }
}

async function joinRoom(code, isHost = false) {
    const roomCode = (code || "").trim().toUpperCase();

    if (!roomCode) {
        setStatus("Enter a room code.");
        return;
    }

    try {
        setStatus("Joining room...");
        const profile = await getProfile();
        const user = await ensureSignedIn();

        if (!user) {
            throw new Error("Please sign in first.");
        }

        const roomRef = doc(db, "rooms", roomCode);
        const room = await getDoc(roomRef);

        if (!room.exists()) {
            setStatus("Room not found.");
            return;
        }

        const data = room.data() || {};
        const players = Array.isArray(data.players) ? data.players : [];
        const alreadyJoined = players.some((player) => player.id === user.uid);

        if (!alreadyJoined) {
            await updateDoc(roomRef, {
                players: arrayUnion({
                    id: user.uid,
                    name: profile.username || user.displayName || "Player",
                    avatar: profile.avatar || user.photoURL || "https://i.pravatar.cc/100",
                    ready: false
                })
            });
        }

        currentRoom = roomCode;
        listenRoom(roomCode);
        setStatus(`Joined room ${roomCode}`);
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Could not join the room.");
    }
}

function listenRoom(code) {
    if (roomUnsubscribe) {
        roomUnsubscribe();
    }

    roomUnsubscribe = onSnapshot(doc(db, "rooms", code), (snapshot) => {
        if (!snapshot.exists()) {
            setStatus("Room was deleted.");
            return;
        }

        const data = snapshot.data() || {};
        const codeDisplay = document.getElementById("codeDisplay");

        if (codeDisplay) {
            codeDisplay.textContent = code;
        }

        const roomTitle = document.getElementById("roomTitle");
        if (roomTitle) {
            roomTitle.textContent = `Room ${code}`;
        }

        const list = document.getElementById("players");

        if (list) {
            list.innerHTML = "";

            const players = Array.isArray(data.players) ? data.players : [];
            players.forEach((player) => {
                const card = document.createElement("div");
                card.className = "player-card";
                card.innerHTML = `
                    <img src="${player.avatar || "https://i.pravatar.cc/100"}" class="player-avatar">
                    <div>
                        <h3>${player.name || "Player"}</h3>
                        <p>${player.ready ? "✅ Ready" : "⏳ Waiting"}</p>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        const startButton = document.getElementById("startButton");
        if (startButton) {
            const currentUserId = auth.currentUser?.uid || null;
            startButton.hidden = data.host !== currentUserId;
        }

        if (data.status === "playing" && currentRoom && window.location.pathname.includes("lobby.html")) {
            window.location.href = "game.html?room=" + encodeURIComponent(currentRoom);
        }
    });
}

async function initializeLobby() {
    try {
        const user = await ensureSignedIn();

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        setStatus("Ready to create or join a room.");
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Please sign in first.");
    }
}

const publicGameButton = document.getElementById("publicGame");
if (publicGameButton) {
    publicGameButton.onclick = () => createRoom(false);
}

const privateGameButton = document.getElementById("privateGame");
if (privateGameButton) {
    privateGameButton.onclick = () => createRoom(true);
}

const joinRoomButton = document.getElementById("joinRoom");
if (joinRoomButton) {
    joinRoomButton.onclick = () => {
        const codeField = document.getElementById("roomCode");
        const code = codeField ? codeField.value : "";
        joinRoom(code);
    };
}

const readyButton = document.getElementById("readyButton");
if (readyButton) {
    readyButton.onclick = async () => {
        if (!currentRoom) {
            setStatus("Create or join a room first.");
            return;
        }

        ready = !ready;
        const ref = doc(db, "rooms", currentRoom);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return;
        }

        const players = (snap.data().players || []).map((player) => {
            if (player.id === auth.currentUser?.uid) {
                return { ...player, ready };
            }
            return player;
        });

        await updateDoc(ref, { players });
        setStatus(ready ? "You are ready." : "You are not ready.");
    };
}

const startButton = document.getElementById("startButton");
if (startButton) {
    startButton.onclick = () => {
        if (!currentRoom) {
            return;
        }

        setStatus("Starting game...");
        startRound(currentRoom).catch((error) => {
            console.error(error);
            setStatus("Game started, but the room setup needs a moment.");
        });
        window.location.href = "game.html?room=" + encodeURIComponent(currentRoom);
    };
}

initializeLobby();