export class DOMManager {

    /**
     * Affiche la zone de jeu et masque le formulaire + met à jour le nom du joueur dans le header (début de partie) */
    showGameArea(playerName) {
        document.querySelector('.setup-form').classList.add('hidden');
        document.querySelector('.game-area').classList.remove('hidden');
        document.querySelector('#player-name').textContent = playerName;
    }

    /**
     * Ajuste la grille selon le nombre de paires (5 colonnes si impair pour éviter un mauvais format du jeu). */
    setGridColumns(nbPaires) {
        const board = document.querySelector('.game-board');
        board.classList.toggle('cols-5', nbPaires === 5);
    }

    // Gestion des cartes

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
            const clone = card.cloneNode(true);
            clone.classList.add('locked');
            card.replaceWith(clone);
        }, {once: true});
    }

    // Chronomètre

    /**
     * Met à jour le chronomètre au format MM:SS */
    updateTimer(seconds) {
        const timerElement = document.querySelector('.game-timer');
        if (!timerElement) return;

        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        timerElement.textContent = `${mm}:${ss}`;

        if (seconds <= 10) {
            timerElement.classList.add('timer-danger');
        } else {
            timerElement.classList.remove('timer-danger');
        }
    }

    // Fin de partie

    /**
     * Retourne toutes les cartes une par une comme un domino puis affiche les résultats
     * @param {Function} callback - appelé après l'animation
     */
    playVictoryAnimation(callback) {
        const cards = Array.from(document.querySelectorAll('.game-board .card'));
        const delay = 2000 / cards.length;

        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.remove('flip');
            }, index * delay);
        });

        setTimeout(() => {
            callback();
        }, 2000 + 300);
    }

    /**
     * Masque la zone de jeu et affiche la page de résultats + génère le badge de mode, le récap temps/fautes et le bouton retour
     * Déclenche les étoiles animées uniquement en cas de victoire
     * @param {string} playerName - nom du joueur
     * @param {number} timeSeconds - temps total en secondes
     * @param {number} fautes - nombre de mauvaises paires
     * @param {string} performanceMessage - message principal affiché en titre
     * @param {string} mode - mode de jeu ('classic', 'time-attack', 'shuffle', 'chaos')
     * @param {boolean} isVictory - true uniquement si toutes les paires ont été trouvées
     */
    showResults(playerName, timeSeconds, fautes, performanceMessage, mode = 'classic', isVictory = false) {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.classList.add('hidden');
        }

        const resultsPage = document.createElement('div');
        resultsPage.classList.add('results-page');

        const resultsContent = document.createElement('div');
        resultsContent.classList.add('results-content');

        const minutes = Math.floor(timeSeconds / 60);
        const seconds = timeSeconds % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        let modeMessage = '';
        if (mode === 'time-attack') {
            modeMessage = '<p class="mode-badge">Mode Contre-la-Montre</p>';
        }
        else if (mode === 'shuffle') {
            modeMessage = '<p class="mode-badge mode-shuffle">Mode Shuffle</p>';
        }
        else if (mode === 'chaos') {
            modeMessage = '<p class="mode-badge mode-chaos">Mode Chaos</p>';
        }

        resultsContent.innerHTML = `
        ${modeMessage}
        <h2>${performanceMessage}</h2>
        <p><strong>${playerName}</strong>, voici ton score :</p>
        <p>Temps : ${formattedTime}</p>
        <p>Fautes : ${fautes}</p>
        <button id="back-to-menu">Retour au menu</button>`;

        resultsPage.appendChild(resultsContent);
        if (isVictory) this.spawnStars(resultsPage);
        document.body.appendChild(resultsPage);

        document.querySelector('#back-to-menu').addEventListener('click', () => {
            resultsPage.remove();
            document.querySelector('.setup-form').classList.remove('hidden');
        });
    }

    /**
     * Génère 30 étoiles colorées animées qui tombent sur la page de résultats
     * Appelé uniquement en cas de victoire
     * @param {HTMLElement} container - la page de résultats dans laquelle injecter les étoiles
     */
    spawnStars(container) {
        const colors = ['#f9d71c', '#ff6b9d', '#a855f7', '#38bdf8', '#4ade80', '#fb923c'];
        for (let i = 0; i < 30; i++) {
            const star = document.createElement('div');
            star.classList.add('victory-star');
            star.style.left = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 2}s`;
            star.style.animationDuration = `${1.5 + Math.random() * 2}s`;
            star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            star.style.width = star.style.height = `${8 + Math.random() * 10}px`;
            container.appendChild(star);
        }
    }

}
