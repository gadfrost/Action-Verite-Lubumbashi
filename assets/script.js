/**
 * Action ou Vérité - PWA Moderne
 * Logique de jeu avec interactions entre joueurs, support PWA et Thèmes
 */

// ============================================
// VARIABLES GLOBALES
// ============================================
let gameState = {
    difficulty: null,
    players: [],
    shuffledPlayers: [],
    currentPlayerIndex: 0,
    challenges: {
        truths: [],
        actions: []
    },
    usedIndices: {
        truths: [],
        actions: []
    },
    roundsCompleted: 0
};

let deferredPrompt;

// ============================================
// GESTION DU THÈME (SOMBRE/CLAIR)
// ============================================

function initTheme() {
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = document.getElementById('themeIcon');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.textContent = '☀️';
    }

    themeBtn?.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// ============================================
// GESTION PWA
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker enregistré'))
            .catch(err => console.log('Erreur SW:', err));
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'flex';
    }
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Résultat de l'installation: ${outcome}`);
    deferredPrompt = null;
    document.getElementById('installBtn').style.display = 'none';
});

window.addEventListener('appinstalled', (evt) => {
    console.log('Application installée');
    document.getElementById('installBtn').style.display = 'none';
});

// ============================================
// GESTION DES ÉCRANS
// ============================================

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    target.classList.add('active');
}

function selectDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    loadChallenges(difficulty);
    showScreen('playersScreen');
}

function goBackToDifficulty() {
    gameState.difficulty = null;
    gameState.players = [];
    gameState.challenges = { truths: [], actions: [] };
    updatePlayersList();
    showScreen('difficultyScreen');
}

// ============================================
// GESTION DES JOUEURS
// ============================================

function addPlayer() {
    const input = document.getElementById('playerInput');
    const playerName = input.value.trim();

    if (!playerName) return;

    if (gameState.players.includes(playerName)) {
        alert('Ce joueur existe déjà !');
        return;
    }

    gameState.players.push(playerName);
    input.value = '';
    updatePlayersList();
    updateStartGameButton();
}

function handlePlayerKeyPress(event) {
    if (event.key === 'Enter') {
        addPlayer();
    }
}

function removePlayer(index) {
    gameState.players.splice(index, 1);
    updatePlayersList();
    updateStartGameButton();
}

function updatePlayersList() {
    const playersList = document.getElementById('playersList');
    const playersCount = document.getElementById('playersCount');
    playersList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${player}</span>
            <button onclick="removePlayer(${index})">Supprimer</button>
        `;
        playersList.appendChild(li);
    });

    if (playersCount) {
        playersCount.textContent = gameState.players.length;
    }
}

function updateStartGameButton() {
    const btn = document.getElementById('startGameBtn');
    btn.disabled = gameState.players.length < 2;
}

// ============================================
// CHARGEMENT DES DÉFIS
// ============================================

async function loadChallenges(difficulty) {
    try {
        const response = await fetch(`contenu/${difficulty}.json`);
        if (!response.ok) throw new Error('Erreur de chargement');
        const data = await response.json();
        gameState.challenges = {
            truths: data.truths,
            actions: data.actions
        };
        gameState.usedIndices = { truths: [], actions: [] };
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ============================================
// LOGIQUE DE JEU
// ============================================

function startGame() {
    if (gameState.players.length < 2) return;

    gameState.shuffledPlayers = shuffleArray([...gameState.players]);
    gameState.currentPlayerIndex = 0;
    gameState.roundsCompleted = 0;

    showScreen('gameScreen');
    updateGameDisplay();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function updateGameDisplay() {
    const currentPlayer = gameState.shuffledPlayers[gameState.currentPlayerIndex];
    const nextIndex = (gameState.currentPlayerIndex + 1) % gameState.shuffledPlayers.length;
    const nextPlayer = gameState.shuffledPlayers[nextIndex];

    document.getElementById('currentPlayerName').textContent = currentPlayer;
    document.getElementById('nextPlayerName').textContent = nextPlayer;

    document.getElementById('challengeDisplay').classList.add('hidden');
    document.querySelector('.choice-buttons').style.display = 'grid';
}

function selectChallenge(type) {
    const challenge = getRandomChallenge(type);
    const processedChallenge = processChallengeText(challenge, type);
    displayChallenge(processedChallenge, type);
}

function getRandomChallenge(type) {
    const challenges = gameState.challenges[type === 'truth' ? 'truths' : 'actions'];
    const usedIndices = gameState.usedIndices[type === 'truth' ? 'truths' : 'actions'];

    if (usedIndices.length === challenges.length) {
        gameState.usedIndices[type === 'truth' ? 'truths' : 'actions'] = [];
    }

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * challenges.length);
    } while (usedIndices.includes(randomIndex));

    usedIndices.push(randomIndex);
    return challenges[randomIndex];
}

function processChallengeText(text, type) {
    const currentPlayer = gameState.shuffledPlayers[gameState.currentPlayerIndex];
    
    if (type === 'action') {
        const otherPlayers = gameState.players.filter(p => p !== currentPlayer);
        if (otherPlayers.length > 0) {
            const secondPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            
            const replacements = [
                { regex: /la personne à ta droite/gi, replacement: secondPlayer },
                { regex: /la personne à ta gauche/gi, replacement: secondPlayer },
                { regex: /la personne en face de toi/gi, replacement: secondPlayer },
                { regex: /chaque personne présente/gi, replacement: "tout le monde" },
                { regex: /à quelqu'un/gi, replacement: `à ${secondPlayer}` }
            ];

            let newText = text;
            replacements.forEach(r => {
                newText = newText.replace(r.regex, r.replacement);
            });

            if (newText === text && (text.includes("fait un compliment") || text.includes("imite"))) {
                return `${currentPlayer}, fais un compliment à ${secondPlayer} : ${text}`;
            }

            return `${currentPlayer}, ${newText}`;
        }
    }
    
    return text;
}

function displayChallenge(challenge, type) {
    const typeLabel = type === 'truth' ? 'Vérité' : 'Action';
    const typeEmoji = type === 'truth' ? '🤔' : '🎬';

    document.getElementById('challengeType').textContent = `${typeEmoji} ${typeLabel}`;
    document.getElementById('challengeText').textContent = challenge;
    
    document.querySelector('.choice-buttons').style.display = 'none';
    document.getElementById('challengeDisplay').classList.remove('hidden');
}

function nextChallenge() {
    gameState.currentPlayerIndex++;

    if (gameState.currentPlayerIndex >= gameState.shuffledPlayers.length) {
        gameState.roundsCompleted++;
        showScreen('roundEndScreen');
        return;
    }

    updateGameDisplay();
}

function restartWithSameOrder() {
    gameState.currentPlayerIndex = 0;
    showScreen('gameScreen');
    updateGameDisplay();
}

function reshufflePlayers() {
    gameState.shuffledPlayers = shuffleArray([...gameState.players]);
    gameState.currentPlayerIndex = 0;
    showScreen('gameScreen');
    updateGameDisplay();
}

function resetGame() {
    if (confirm('Voulez-vous vraiment quitter la partie ?')) {
        gameState.difficulty = null;
        gameState.players = [];
        gameState.challenges = { truths: [], actions: [] };
        updatePlayersList();
        showScreen('difficultyScreen');
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    showScreen('difficultyScreen');
});
