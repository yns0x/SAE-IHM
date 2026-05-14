import {DOMManager} from './DOMManager.js';
import {Game} from './Game.js';
import {ApiService} from './ApiService.js';

const domManager = new DOMManager();
const game = new Game(domManager);


document.querySelector('.game-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const pseudo = document.querySelector('#pseudo').value;
    const difficulty = parseInt(document.querySelector('#difficulty').value);
    const collection = document.querySelector('#collection').value;

    try {
     const data = await ApiService.createGame(pseudo, difficulty);
     console.log('Success:', data, data.id);
     game.startGame(data.id, pseudo, difficulty, collection);
    } catch (error) {
     console.error('Error:', error);
     alert(error.message || 'Erreur lors de la création de la partie');
    }
});
