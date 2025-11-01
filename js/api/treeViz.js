/**
 * @typedef {import('../../types/index.d.ts').GenreTreeNode} GenreTreeNode
 * @typedef {import('../../types/index.d.ts').TreeVizResponse} TreeVizResponse
 * @typedef {import('../../types/index.d.ts').TreeVizParams} TreeVizParams
 */

/**
 * Classe pour traiter et naviguer dans l'arbre de genres musicaux
 */
class TreeVizProcessor {
    /**
     * Créer une instance de TreeVizProcessor
     * @param {GenreTreeNode} genreTree - L'arbre de genres musicaux
     */
    constructor(genreTree) {
        /** @type {GenreTreeNode} */
        this.genreTree = genreTree;
    }

    /**
     * Récupère les données en fonction du chemin parcouru et des paramètres
     * @param {string[]} previous - Le chemin parcouru dans l'arbre
     * @param {TreeVizParams} params - Les paramètres de visualisation
     * @returns {TreeVizResponse} La réponse avec les données à afficher
     */
    getData(previous, params) {
        let current = this.genreTree;

        for (let prop of previous) {
            if (!current.children || !current.children.some(child => child.name === prop)) {
                return { type: "genres", values: [] };
            }
            current = current.children.find(child => child.name === prop);
        }

        if (current.children && current.children.length > 0) {
            return {
                type: "genres",
                values: current.children.map(child => child.name)
            };
        } else {
            return {
                type: "songs",
                values: (current.songs || []).map(song => song.track_name)
            };
        }
    }
}

export { TreeVizProcessor };