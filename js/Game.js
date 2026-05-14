import {imageCollections} from './ImageCollection.js';
import {ApiService} from './ApiService.js';


export class Game {
  /**
   * @type {number} id identifiant de la partie en cours
   */
    #id;
    #nbPaires;
    #pairesRestantes;
    #timerInterval;
    #seconds;
    #premiereCarteRetournee;
    #enAttente;
    #domManager;

    constructor(domManager) {
        this.#domManager = domManager;
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
        this.#seconds = 0;
        this.#domManager.updateTimer(0);
        this.#timerInterval = setInterval(() => {
            this.#seconds++;
            this.#domManager.updateTimer(this.#seconds);
        }, 1000);
    }

    /**
     * Arrête la partie
     */
    async endGame() {
        this.stopTimer();
        try {
          const result = await ApiService.updateGameResult(this.#id, this.#pairesRestantes);
          console.log('Fin de partie:', result);
        } catch (error) {
          console.error('Error:', error);
          alert(error.message || 'Erreur lors de la fin de la partie');
        }

        this.#domManager.showSetupForm();

      }

      /**
       * Start a new game.
       * @param {number} id - The game ID.
       * @param pseudo
       * @param difficulty
       * @param collection
       */
      startGame(id, pseudo, difficulty, collection) {
          this.#id = id;
          this.#nbPaires = difficulty;
          this.#pairesRestantes = difficulty;
          this.#premiereCarteRetournee = null;
          this.#enAttente = false;
          this.#seconds = 0;

          const images = imageCollections[collection].slice(0, difficulty);

          this.#domManager.showGameArea(pseudo);
          this.#domManager.setGridColumns(difficulty);
          this.#domManager.createCards(images, (card, imageId) => this.onCardClick(card, imageId));

          this.startTimer();

          document.querySelector('#abandon').addEventListener('click', () => this.endGame());

      }

    /**
     * Gère le clic sur une carte
     */
      onCardClick(card, imageId) {
          if (this.#enAttente) return;
          if (card.classList.contains('flip')) return;

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
     * verrouille les deux cartes et vérifie si la partie est terminée.
     * @param deuxiemeCarte
     */
    onPaireTrouvee(deuxiemeCarte) {
        this.#domManager.lockCard(this.#premiereCarteRetournee.card);
        this.#domManager.lockCard(deuxiemeCarte);
        this.#premiereCarteRetournee = null;
        this.#pairesRestantes--;
        if (this.#pairesRestantes === 0) this.endGame();
    }

    /**
     * retourne les deux cartes face cachée après 1 seconde.
     * @param deuxiemeCarte
     */
    onPaireRatee(deuxiemeCarte) {
        this.#enAttente = true;
        const premiere = this.#premiereCarteRetournee.card;
        this.#premiereCarteRetournee = null;

        setTimeout(() => {
            this.#domManager.unflipCard(premiere);
            this.#domManager.unflipCard(deuxiemeCarte);
            this.#enAttente = false;
        }, 1000);
    }

}
