import { SoundCollection } from './SoundCollection.js';

/**
 * Gère le chargement et la lecture des sons du jeu.
 * Les sons sont préchargés au démarrage pour éviter tout délai à la lecture.
 */
export class SoundManager {

    // Dictionnaire nom → HTMLAudioElement
    #sounds = {};
    #backgroundMusic = null;

    /**
     * Précharge tous les sons de la SoundCollection.
     * À appeler une seule fois au démarrage dans app.js.
     */
    init() {
        for (const sound of SoundCollection.sounds) {
            const audio = new Audio(sound.url);
            audio.preload = 'auto';
            this.#sounds[sound.name] = audio;
        }
    }

    /**
     * Joue un son par son nom.
     * Remet le son au début s'il est déjà en cours de lecture.
     * @param {string} name - nom du son dans SoundCollection
     */
    play(name) {
        const audio = this.#sounds[name];
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {}); // ignorer les erreurs autoplay navigateur
    }

    /**
     * Démarre une musique de fond en boucle.
     * Arrête la musique précédente si elle était en cours.
     * @param {string} name - 'BackgroundNormal' ou 'BackgroundChaos'
     */
    playBackground(name) {
        this.stopBackground();
        const audio = this.#sounds[name];
        if (!audio) return;
        audio.loop = true;
        audio.volume = 0.4;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        this.#backgroundMusic = audio;
    }

    /**
     * Arrête la musique de fond en cours.
     */
    stopBackground() {
        if (this.#backgroundMusic) {
            this.#backgroundMusic.pause();
            this.#backgroundMusic.currentTime = 0;
            this.#backgroundMusic = null;
        }
    }
}