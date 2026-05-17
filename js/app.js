import {DOMManager} from './DOMManager.js';
import {Game} from './Game.js';
import {ApiService} from './ApiService.js';
import { imageCollections } from './ImageCollection.js';

const domManager = new DOMManager();
const game = new Game(domManager);
import { ThemeManager } from './ThemeManager.js';
ThemeManager.init();

function parseDifficulty(difficultyValue) {
    const [mode, pairs] = difficultyValue.split('-');
    return {
        mode: mode,
        pairs: parseInt(pairs)
    };
}

document.querySelector('.game-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const pseudo = document.querySelector('#pseudo').value;
    const difficultyValue = document.querySelector('#difficulty').value;
    const { mode, pairs: difficulty } = parseDifficulty(difficultyValue);
    const collection = document.querySelector('#collection').value;

    try {
     const data = await ApiService.createGame(pseudo, difficulty);
     console.log('Success:', data, data.id);
     game.startGame(data.id, pseudo, difficulty, collection, mode);
    } catch (error) {
     console.error('Error:', error);
     alert(error.message || 'Erreur lors de la création de la partie');
    }
});

// Prévisualisation de la collection
function renderPreview(collectionName) {
    const images = imageCollections[collectionName];

    let container = document.querySelector('.collection-preview');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('collection-preview');
        document.querySelector('.setup-form').appendChild(container);
    }

    container.innerHTML = `
        <p class="preview-label">Aperçu de la collection</p>
        <div class="preview-grid">
            ${images.map(img => `
                <div class="preview-card">
                    <img src="${img.url}" alt="${img.name}">
                </div>
            `).join('')}
        </div>
    `;
}

// Lancement au chargement + à chaque changement
const collectionSelect = document.querySelector('#collection');
renderPreview(collectionSelect.value);
collectionSelect.addEventListener('change', () => renderPreview(collectionSelect.value));