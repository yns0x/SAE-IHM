import { imageCollections } from './ImageCollection.js';

/**
 * Gère tous les effets du mode Chaos :
 * - Objets volants (images depuis imageCollections.chaos)
 * - Calcul mental bloquant les clics
 * - Vidéo subway surfer sur les côtés
 */
export class ChaosManager {

    #flyingInterval = null;
    #mathTimeout = null;
    #isMathBlocking = false;
    #isActive = false;
    #onBlockChange = null;

    /**
     * @param {Function} onBlockChange - appelé avec (true/false) pour bloquer/débloquer les clics
     */
    constructor(onBlockChange) {
        this.#onBlockChange = onBlockChange;
    }

    /**
     * Lance tous les effets chaos
     */
    start() {
        this.#isActive = true;
        this.#startFlyingObjects();
        this.#startMathChallenges();
        this.#startSubwayVideos();
    }

    /**
     * Arrête tout
     */
    stop() {
        this.#isActive = false;

        clearInterval(this.#flyingInterval);
        clearTimeout(this.#mathTimeout);

        document.querySelectorAll('.chaos-object').forEach(el => el.remove());
        document.querySelectorAll('.chaos-math-overlay').forEach(el => el.remove());
        document.querySelectorAll('.chaos-subway').forEach(el => el.remove());

        if (this.#isMathBlocking) {
            this.#isMathBlocking = false;
            this.#onBlockChange?.(false);
        }
    }

    // IMAGES VOLANTES

    #startFlyingObjects() {
        this.#spawnFlyingObject();
        this.#flyingInterval = setInterval(() => {
            if (!this.#isActive) return;
            this.#spawnFlyingObject();
        }, 500);
    }

    #spawnFlyingObject() {
        const images = imageCollections.chaos;
        const img = images[Math.floor(Math.random() * images.length)];

        const obj = document.createElement('img');
        obj.src = img.url;
        obj.classList.add('chaos-object');

        const size = 50 + Math.random() * 70;
        obj.style.width = `${size}px`;
        obj.style.height = `${size}px`;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const side = Math.floor(Math.random() * 4);

        let startX, startY, endX, endY;
        switch (side) {
            case 0:
                startX = Math.random() * vw; startY = -size;
                endX = Math.random() * vw;   endY = vh + size;
                break;
            case 1:
                startX = Math.random() * vw; startY = vh + size;
                endX = Math.random() * vw;   endY = -size;
                break;
            case 2:
                startX = -size;              startY = Math.random() * vh;
                endX = vw + size;            endY = Math.random() * vh;
                break;
            case 3:
                startX = vw + size;          startY = Math.random() * vh;
                endX = -size;                endY = Math.random() * vh;
                break;
        }

        obj.style.left = `${startX}px`;
        obj.style.top = `${startY}px`;

        const rotation = Math.random() * 720 - 360;
        const duration = 2 + Math.random() * 2;

        obj.style.setProperty('--end-x', `${endX - startX}px`);
        obj.style.setProperty('--end-y', `${endY - startY}px`);
        obj.style.setProperty('--rotation', `${rotation}deg`);
        obj.style.animationDuration = `${duration}s`;

        document.body.appendChild(obj);
        setTimeout(() => obj.remove(), duration * 1000 + 100);
    }

    // CALCUL MENTAL

    #startMathChallenges() {
        const scheduleNext = () => {
            if (!this.#isActive) return;
            const delay = 8000 + Math.random() * 4000;
            this.#mathTimeout = setTimeout(() => {
                if (!this.#isActive) return;
                this.#showMathChallenge(() => scheduleNext());
            }, delay);
        };
        scheduleNext();
    }

    #showMathChallenge(onComplete) {
        if (this.#isMathBlocking) return;

        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const isAddition = Math.random() > 0.5;
        const answer = isAddition ? a + b : Math.abs(a - b);
        const question = isAddition ? `${a} + ${b}` : `${Math.max(a, b)} - ${Math.min(a, b)}`;

        this.#isMathBlocking = true;
        this.#onBlockChange?.(true);

        const overlay = document.createElement('div');
        overlay.classList.add('chaos-math-overlay');

        const choices = this.#generateChoices(answer);

        overlay.innerHTML = `
            <div class="chaos-math-box">
                <p class="chaos-math-question">${question} = ?</p>
                <div class="chaos-math-choices">
                    ${choices.map(c => `<button class="chaos-math-btn" data-value="${c}">${c}</button>`).join('')}
                </div>
                <p class="chaos-math-error hidden">❌ Mauvaise réponse !</p>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.chaos-math-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (parseInt(btn.dataset.value) === answer) {
                    overlay.remove();
                    this.#isMathBlocking = false;
                    this.#onBlockChange?.(false);
                    onComplete?.();
                } else {
                    const box = overlay.querySelector('.chaos-math-box');
                    const error = overlay.querySelector('.chaos-math-error');
                    box.classList.add('shake');
                    error.classList.remove('hidden');
                    setTimeout(() => box.classList.remove('shake'), 500);
                }
            });
        });
    }

    #generateChoices(answer) {
        const choices = new Set([answer]);
        while (choices.size < 4) {
            const offset = Math.floor(Math.random() * 10) - 5;
            const fake = answer + offset;
            if (fake !== answer && fake >= 0) choices.add(fake);
        }
        return [...choices].sort(() => Math.random() - 0.5);
    }

    // VIDÉO SUBWAY SURFER

    #startSubwayVideos() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;

        ['left', 'right'].forEach(side => {
            const video = document.createElement('video');
            video.src = './assets/images/gameplay.mp4';
            video.classList.add('chaos-subway', `chaos-subway-${side}`);
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;

            if (side === 'right') {
                video.style.transform = 'scaleX(-1)';
            }

            gameArea.appendChild(video);
        });
    }
}