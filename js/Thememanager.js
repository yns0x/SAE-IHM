/**
 * Gère la sélection et la persistance du thème visuel.
 */
export class ThemeManager {

    static #THEMES = [
        { id: 'theme-midnight', label: 'Midnight Purple' },
        { id: 'theme-pastel',   label: 'Soft Pastel'     },
        { id: 'theme-sunset',   label: 'Sunset'          },
        { id: 'theme-mono',     label: 'Monochrome'       },
        { id: 'theme-lava',     label: 'Volcanic Lava'   },
        { id: 'theme-arctic',   label: 'Arctic Ice'      },
    ];

    static #STORAGE_KEY = 'memory-theme';

    /**
     * Initialise le sélecteur et applique le thème sauvegardé.
     */
    static init() {
        this.#injectSelector();
        const saved = localStorage.getItem(this.#STORAGE_KEY) || 'theme-midnight';
        this.#applyTheme(saved);
    }

    /**
     * Crée et insère le sélecteur dans le header.
     */
    static #injectSelector() {
        const select = document.createElement('select');
        select.id = 'theme-selector';

        this.#THEMES.forEach(({ id, label }) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = label;
            select.appendChild(option);
        });

        // Remettre la valeur sauvegardée
        select.value = localStorage.getItem(this.#STORAGE_KEY) || 'theme-midnight';

        select.addEventListener('change', () => {
            this.#applyTheme(select.value);
            localStorage.setItem(this.#STORAGE_KEY, select.value);
        });

        const header = document.querySelector('header');
        header.appendChild(select);
    }

    /**
     * Applique un thème en swappant la classe sur <body>.
     * @param {string} themeId
     */
    static #applyTheme(themeId) {
        const classes = this.#THEMES.map(t => t.id);
        document.body.classList.remove(...classes);
        document.body.classList.add(themeId);

        // Sync le select si appelé depuis l'extérieur
        const select = document.querySelector('#theme-selector');
        if (select) select.value = themeId;
    }
}