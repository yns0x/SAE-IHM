import {imageCollections} from './ImageCollection.js';
import {ApiService} from './ApiService.js';
import {ChaosManager} from "./ChaosManager.js";


export class Game {

    /* ATTRIBUS */
  /**
   * @type {number} id identifiant de la partie en cours
   */
    #id;

    #nbPaires;
    #pairesRestantes;
    #premiereCarteRetournee;
    #enAttente;
    #domManager;
    #fautes;

    // Timer
    #timerInterval;
    #seconds;
    #timeAttackMode;
    #timeLimit;

    // Modes
    #shuffleMode;
    #shuffleInterval;
    #chaosMode;
    #chaosManager;

    // Contrôle de fin de partie
    #gameEnded;
    #victoryTimeout;



    constructor(domManager) {
        this.#domManager = domManager;
        this.#timeAttackMode = false;
        this.#timeLimit = null;
        this.#shuffleMode = false;
        this.#shuffleInterval = null;
        this.#chaosMode = false;
        this.#chaosManager = null;
        this.#gameEnded = false;
        this.#victoryTimeout = null;
    }

    /**
     * Start a new game.
     * @param {number} id - The game ID.
     * @param pseudo - le nom du joueur
     * @param difficulty - la difficulté / nombre de paire
     * @param collection - le set d'images
     * @param mode - le mode de jeu
     */
    startGame(id, pseudo, difficulty, collection, mode = 'classic') {
        this.#id = id;
        this.#nbPaires = difficulty;
        this.#pairesRestantes = difficulty;
        this.#premiereCarteRetournee = null;
        this.#enAttente = false;
        this.#seconds = 0;
        this.#fautes = 0;
        this.#gameEnded = false;
        this.#victoryTimeout = null;

        this.setupGameMode(mode);

        if (this.#shuffleMode) {
            this.startShuffle();
        }
        if (this.#chaosMode) {
            this.#chaosManager = new ChaosManager((blocked) => {
                this.#enAttente = blocked;
            });
            this.#chaosManager.start();
        }

        const images = imageCollections[collection].slice(0, difficulty);

        this.#domManager.showGameArea(pseudo);
        this.#domManager.setGridColumns(difficulty);
        this.#domManager.createCards(images, (card, imageId) => this.onCardClick(card, imageId));

        this.startTimer();

        const abandonBtn = document.querySelector('#abandon');
        abandonBtn.replaceWith(abandonBtn.cloneNode(true));
        document.querySelector('#abandon').addEventListener('click', () => this.endGame(false, true), { once: true });
    }

    /**
     * Configure les attribus du mode de jeu sélectionné et réinitialise tous les modes avant d'en activer un
     */
    setupGameMode(mode) {
        this.#timeAttackMode = false;
        this.#timeLimit = null;
        this.#shuffleMode = false;
        this.#chaosMode = false;

        switch (mode) {
            case 'time_attack':
                this.#timeAttackMode = true;
                this.#timeLimit = 60;
                break;
            case 'shuffle':
                this.#shuffleMode = true;
                break;
            case 'chaos':
                this.#chaosMode = true;
                break;
        }
    }

    /**
     * Permet d'arrêter le chronomètre
     * */
    stopTimer() {
        clearInterval(this.#timerInterval);
    }

    /**
     * Lance le chronomètre
     */
    startTimer() {
        clearInterval(this.#timerInterval);
        if (this.#timeAttackMode) {
            this.#domManager.updateTimer(this.#timeLimit);
            this.#timerInterval = setInterval(() => {
                this.#timeLimit--;
                this.#domManager.updateTimer(this.#timeLimit);

                if (this.#timeLimit <= 0) {
                    this.stopTimer();
                    this.endGame(true);
                }
            }, 1000);
        } else {
            this.#seconds = 0;
            this.#domManager.updateTimer(0);
            this.#timerInterval = setInterval(() => {
                this.#seconds++;
                this.#domManager.updateTimer(this.#seconds);
            }, 1000);
        }
    }


    /* Gestion des clics sur les cartes */


    /**
     * Gère le clic sur une carte
     */
    onCardClick(card, imageId) {
        if (this.#enAttente) return;
        if (card.classList.contains('flip')) return;
        if (this.#timeAttackMode && this.#timeLimit <= 0) return;

        this.#domManager.flipCard(card);

        if (!this.#premiereCarteRetournee) {
            this.#premiereCarteRetournee = {card, imageId};
            return;
        }

        if (this.#premiereCarteRetournee.imageId === imageId) {
            this.onPaireTrouvee(card);
        } else {
            this.onPaireRatee(card);
        }
    }

    /**
     * verrouille les deux cartes et vérifie si la partie est terminée
     * @param deuxiemeCarte
     */
    onPaireTrouvee(deuxiemeCarte) {
        this.#domManager.lockCard(this.#premiereCarteRetournee.card);
        this.#domManager.lockCard(deuxiemeCarte);
        this.#premiereCarteRetournee.card.classList.add('locked');
        deuxiemeCarte.classList.add('locked');
        this.#premiereCarteRetournee = null;
        this.#pairesRestantes--;

        if (this.#pairesRestantes === 0) {
            this.#victoryTimeout = setTimeout(() => {
                if (!this.#gameEnded) this.endGame();
            }, 700);
        }
    }

    /**
     * retourne les deux cartes face cachée après 1 seconde
     * @param deuxiemeCarte
     */
    onPaireRatee(deuxiemeCarte) {
        this.#enAttente = true;
        this.#fautes++;
        const premiere = this.#premiereCarteRetournee.card;
        premiere.classList.add('shake');
        deuxiemeCarte.classList.add('shake');
        this.#premiereCarteRetournee = null;

        setTimeout(() => {
            this.#domManager.unflipCard(premiere);
            this.#domManager.unflipCard(deuxiemeCarte);
            premiere.classList.remove('shake');
            deuxiemeCarte.classList.remove('shake');
            this.#enAttente = false;
        }, 1000);
    }


    // Fin de partie

    /**
     * Termine la partie : arrête tous les timers et effets présent dans le jeu, envoie le résultat à l'API et affiche la page de résultats
     * Déclenche l'animation de victoire uniquement si toutes les paires ont été trouvées sinon le joueur ne le mérite pas
     * @param {boolean} isTimeUp - true si le temps est écoulé (mode time-attack / contre-la-montre)
     * @param {boolean} isAbandoned - true si le joueur a cliqué sur Abandonner
     */
    async endGame(isTimeUp = false, isAbandoned = false) {
        if (this.#gameEnded) return;
        this.#gameEnded = true;

        if (this.#victoryTimeout) {
            clearTimeout(this.#victoryTimeout);
            this.#victoryTimeout = null;
        }

        this.stopTimer();

        if (this.#shuffleInterval) clearInterval(this.#shuffleInterval);
        if (this.#chaosManager) {
            this.#chaosManager.stop();
            this.#chaosManager = null;
        }

        try {
            const result = await ApiService.updateGameResult(this.#id, this.#pairesRestantes);
            console.log('Fin de partie:', result);

            let currentMode = 'classic';
            if (this.#timeAttackMode) currentMode = 'time-attack';
            else if (this.#shuffleMode) currentMode = 'shuffle';
            else if (this.#chaosMode) currentMode = 'chaos';

            const performanceMessage = (!isTimeUp && !isAbandoned) ? this.getPerformanceMessage() : '';
            const endMessage = isTimeUp
                ? "Temps écoulé ! Vous avez perdu..."
                : (isAbandoned
                    ? "Partie abandonnée"
                    : "🎉 Bravo ! Vous avez gagné !");

            const isVictory = !isTimeUp && !isAbandoned && this.#pairesRestantes === 0;

            const showResults = () => {
                this.#domManager.showResults(
                    document.querySelector('#player-name').textContent,
                    this.#timeAttackMode ? (60 - this.#timeLimit) : this.#seconds,
                    this.#fautes,
                    performanceMessage ? `${endMessage}\n${performanceMessage}` : endMessage,
                    currentMode,
                    isVictory  // ← nouveau paramètre
                );
            };

            if (isVictory) {
                this.#domManager.playVictoryAnimation(showResults);
            } else {
                showResults();
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Erreur lors de la fin de la partie');
        }
    }

    /**
     * Calcule et retourne un message de performance basé sur le temps moyen par paire et le nombre de fautes par paire
     */
    getPerformanceMessage() {
        const temps = this.#timeAttackMode ? (60 - this.#timeLimit) : this.#seconds;
        const tempsParPaire = temps / this.#nbPaires;
        const fautesParPaire = this.#fautes / this.#nbPaires;


        const TEMPS_LIMITE = 10;
        const FAUTES_LIMITE = 0.5;

        if (tempsParPaire <= TEMPS_LIMITE && fautesParPaire <= FAUTES_LIMITE) {
            return "Champion ! Tu as écrasé ce jeu !";
        } else if (tempsParPaire <= TEMPS_LIMITE * 1.5 && fautesParPaire <= FAUTES_LIMITE * 2) {
            return "Pas mal mais tu peux faire mieux";
        } else if (tempsParPaire > TEMPS_LIMITE * 2 || fautesParPaire > FAUTES_LIMITE * 3) {
            return "C'est vraiment le max que tu peux faire ?";
        } else {
            return "Bonne tentative..";
        }
    }

    // Mode Shuffle

    /**
     * Lance l'intervalle qui mélange les cartes toutes les 10 secondes
     */
    startShuffle() {
        if (!this.#shuffleMode) return;

        this.#shuffleInterval = setInterval(() => {
            this.shuffleCards();
        }, 10000);
    }

    /**
     * Mélange aléatoirement les cartes non verrouillées sur le plateau et ignore le mélange si une paire est en cours de vérification.
     */
    shuffleCards() {
        if (this.#enAttente) return;

        const cards = document.querySelectorAll('.game-board .card:not(.locked)');
        const cardsArray = Array.from(cards);

        cards.forEach(card => card.classList.add('shuffling'));

        setTimeout(() => {
            for (let i = cardsArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cardsArray[i], cardsArray[j]] = [cardsArray[j], cardsArray[i]];
            }

            const gameBoard = document.querySelector('.game-board');
            cardsArray.forEach(card => {
                gameBoard.appendChild(card);
                card.classList.remove('shuffling');
            });
        }, 300);
    }
}
