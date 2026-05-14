/**
 * Action ou Vérité - Jeu interactif
 * Logique complète du jeu avec rotation équitable des joueurs
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

// ============================================
// GESTION DES ÉCRANS
// ============================================

/**
 * Affiche un écran spécifique et cache les autres
 * @param {string} screenId - ID de l'écran à afficher
 */
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

/**
 * Sélectionne la difficulté et passe à l'écran d'ajout de joueurs
 * @param {string} difficulty - Niveau de difficulté (soft, medium, hard, extreme)
 */
function selectDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    loadChallenges(difficulty);
    showScreen('playersScreen');
}

/**
 * Retour à l'écran de sélection de difficulté
 */
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

/**
 * Ajoute un joueur à la liste
 */
function addPlayer() {
    const input = document.getElementById('playerInput');
    const playerName = input.value.trim();

    if (!playerName) {
        alert('Veuillez entrer un nom de joueur');
        return;
    }

    if (gameState.players.includes(playerName)) {
        alert('Ce joueur existe déjà !');
        return;
    }

    gameState.players.push(playerName);
    input.value = '';
    updatePlayersList();
    updateStartGameButton();
}

/**
 * Gère la touche Entrée pour ajouter un joueur
 * @param {Event} event - Événement clavier
 */
function handlePlayerKeyPress(event) {
    if (event.key === 'Enter') {
        addPlayer();
    }
}

/**
 * Supprime un joueur de la liste
 * @param {number} index - Index du joueur à supprimer
 */
function removePlayer(index) {
    gameState.players.splice(index, 1);
    updatePlayersList();
    updateStartGameButton();
}

/**
 * Met à jour l'affichage de la liste des joueurs
 */
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

/**
 * Met à jour l'état du bouton "Commencer le jeu"
 */
function updateStartGameButton() {
    const btn = document.getElementById('startGameBtn');
    btn.disabled = gameState.players.length < 2;
}

// ============================================
// CHARGEMENT DES DÉFIS
// ============================================

/**
 * Charge les défis depuis le fichier JSON correspondant
 * @param {string} difficulty - Niveau de difficulté
 */
async function loadChallenges(difficulty) {
    try {
        const response = await fetch(`contenu/${difficulty}.json`);
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement du fichier ${difficulty}.json`);
        }
        const data = await response.json();
        gameState.challenges = {
            truths: data.truths,
            actions: data.actions
        };
        gameState.usedIndices = {
            truths: [],
            actions: []
        };
    } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
        alert('Erreur lors du chargement des défis. Veuillez réessayer.');
    }
}

// ============================================
// LOGIQUE DE JEU
// ============================================

/**
 * Démarre le jeu en mélangeant les joueurs
 */
function startGame() {
    if (gameState.players.length < 2) {
        alert('Au minimum 2 joueurs sont requis');
        return;
    }

    // Mélange la liste des joueurs une seule fois
    gameState.shuffledPlayers = shuffleArray([...gameState.players]);
    gameState.currentPlayerIndex = 0;
    gameState.roundsCompleted = 0;

    showScreen('gameScreen');
    updateGameDisplay();
}

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} - Tableau mélangé
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Met à jour l'affichage du jeu (joueur actuel et prochain)
 */
function updateGameDisplay() {
    const currentPlayer = gameState.shuffledPlayers[gameState.currentPlayerIndex];
    const nextIndex = (gameState.currentPlayerIndex + 1) % gameState.shuffledPlayers.length;
    const nextPlayer = gameState.shuffledPlayers[nextIndex];

    document.getElementById('currentPlayerName').textContent = currentPlayer;
    document.getElementById('nextPlayerName').textContent = nextPlayer;

    // Cache l'affichage du défi
    document.getElementById('challengeDisplay').classList.add('hidden');
}

/**
 * Sélectionne un type de défi (Vérité ou Action)
 * @param {string} type - Type de défi ('truth' ou 'action')
 */
function selectChallenge(type) {
    const challenge = getRandomChallenge(type);
    displayChallenge(challenge, type);
}

/**
 * Récupère un défi aléatoire non utilisé
 * @param {string} type - Type de défi ('truth' ou 'action')
 * @returns {string} - Le défi sélectionné
 */
function getRandomChallenge(type) {
    const challenges = gameState.challenges[type === 'truth' ? 'truths' : 'actions'];
    const usedIndices = gameState.usedIndices[type === 'truth' ? 'truths' : 'actions'];

    // Si tous les défis ont été utilisés, réinitialise la liste
    if (usedIndices.length === challenges.length) {
        gameState.usedIndices[type === 'truth' ? 'truths' : 'actions'] = [];
        usedIndices.length = 0;
    }

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * challenges.length);
    } while (usedIndices.includes(randomIndex));

    usedIndices.push(randomIndex);
    return challenges[randomIndex];
}

/**
 * Affiche le défi à l'écran
 * @param {string} challenge - Le texte du défi
 * @param {string} type - Type de défi ('truth' ou 'action')
 */
function displayChallenge(challenge, type) {
    const typeLabel = type === 'truth' ? 'Vérité' : 'Action';
    const typeEmoji = type === 'truth' ? '🤔' : '🎬';

    document.getElementById('challengeType').textContent = `${typeEmoji} ${typeLabel}`;
    document.getElementById('challengeText').textContent = challenge;
    document.getElementById('challengeDisplay').classList.remove('hidden');
}

/**
 * Passe au défi suivant et au joueur suivant
 */
function nextChallenge() {
    gameState.currentPlayerIndex++;

    // Vérifie si c'est la fin d'un tour
    if (gameState.currentPlayerIndex >= gameState.shuffledPlayers.length) {
        gameState.roundsCompleted++;
        showScreen('roundEndScreen');
        return;
    }

    updateGameDisplay();
}

/**
 * Recommence avec le même ordre de joueurs
 */
function restartWithSameOrder() {
    gameState.currentPlayerIndex = 0;
    gameState.roundsCompleted = 0;
    showScreen('gameScreen');
    updateGameDisplay();
}

/**
 * Remélange la liste des joueurs et recommence
 */
function reshufflePlayers() {
    gameState.shuffledPlayers = shuffleArray([...gameState.players]);
    gameState.currentPlayerIndex = 0;
    gameState.roundsCompleted = 0;
    showScreen('gameScreen');
    updateGameDisplay();
}

/**
 * Réinitialise le jeu complètement
 */
function resetGame() {
    gameState = {
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
    document.getElementById('playerInput').value = '';
    updatePlayersList();
    showScreen('difficultyScreen');
}

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise l'application au chargement
 */
document.addEventListener('DOMContentLoaded', function() {
    showScreen('difficultyScreen');
});
