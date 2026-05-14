export class DOMManager {


  /**
   * Ajoute toutes les images d'une collection sur le gameBoard
   * @param {Image[]} images
   * @param onCardClick
   */
    createCards(images, onCardClick) {
          const gameBoard = document.querySelector('.game-board');
          gameBoard.innerHTML = '';

          const paires = [...images, ...images];
          paires.sort(() => Math.random() - 0.5);

          for (const image of paires) {
              const card = document.createElement('div');
              card.classList.add('card');
              card.dataset.imageId = image.id;

              card.innerHTML = `
                <div class="card-inner">
                  <div class="card-front">
                    <img src="./assets/images/mask1.jpg" alt="Hidden card">
                  </div>
                  <div class="card-back">
                    <img src="${image.url}" alt="${image.name}">
                  </div>
                </div>`;

              card.addEventListener('click', () => onCardClick(card, image.id));
              gameBoard.appendChild(card);
          }
    }

    /**
     * ajoute la classe flip */
    flipCard(card) {
        card.classList.add('flip');
    }

    /**
     * retire la classe flip */
    unflipCard(card) {
        card.classList.remove('flip');
    }

    /**
     * Désactive les clics sur une carte trouvée */
    lockCard(card) {
        card.addEventListener('transitionend', () => {
            card.style.cursor = 'default';
            card.replaceWith(card.cloneNode(true));
        }, {once: true});
    }

    /**
     * Met à jour le chronomètre au format MM:SS */
    updateTimer(seconds) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        document.querySelector('.game-timer').textContent = `${mm}:${ss}`;
    }

    /**
     * Ajuste la grille selon le nombre de paires (5 colonnes si impair pour éviter un mauvais format du jeu). */
    setGridColumns(nbPaires) {
        const board = document.querySelector('.game-board');
        board.classList.toggle('cols-5', nbPaires === 5);
    }

    /**
     * Affiche le formulaire et masque la zone de jeu + vide le plateau de jeu (fin de partie grosso modo) */
    showSetupForm() {
        document.querySelector('.setup-form').classList.remove('hidden');
        document.querySelector('.game-area').classList.add('hidden');
        document.querySelector('.game-board').innerHTML = '';
    }

    /**
     * Affiche la zone de jeu et masque le formulaire + met à jour le nom du joueur dans le header (début de partie) */
    showGameArea(playerName) {
        document.querySelector('.setup-form').classList.add('hidden');
        document.querySelector('.game-area').classList.remove('hidden');
        document.querySelector('#player-name').textContent = playerName;
    }

}
