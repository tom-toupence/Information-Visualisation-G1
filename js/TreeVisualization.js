/**
 * TreeVisualization - Classe pour gérer la visualisation de l'arbre des genres musicaux
 */

import { DataLoader } from './data/DataLoader.js';

/**
 * Classe pour gérer la visualisation de l'arbre des genres musicaux
 */
export class TreeVisualization {
    constructor() {
        /** @type {DataLoader} */
        this.dataLoader = DataLoader.getInstance();
        
        /** @type {any} */
        this.genreTree = null;
    }

    /**
     * Initialise la visualisation en chargeant les données
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Chargement de l\'arbre des genres...');
            this.genreTree = await this.dataLoader.loadGenreTreeWithSongs();
            console.log('Arbre des genres chargé avec succès:', this.genreTree);
            
            // Afficher les enfants du premier niveau dans la console
            this.displayFirstLevelChildren();
            
        } catch (error) {
            console.error('Erreur lors du chargement de l\'arbre des genres:', error);
        }
    }

    /**
     * Affiche dans la console les noms des enfants du premier niveau
     */
    displayFirstLevelChildren() {
        if (!this.genreTree) {
            console.warn('Aucun arbre de genres chargé');
            return;
        }

        console.log('=== ENFANTS DU PREMIER NIVEAU DE L\'ARBRE DES GENRES ===');
        console.log('Nœud racine:', this.genreTree.name);
        
        if (this.genreTree.children && this.genreTree.children.length > 0) {
            console.log('Enfants du premier niveau:');
            this.genreTree.children.forEach((child, index) => {
                console.log(`${index + 1}. ${child.name} (${child.songs ? child.songs.length : 0} chansons)`);
            });
        } else {
            console.log('Aucun enfant trouvé au premier niveau');
        }
        console.log('=======================================================');
    }

    /**
     * Crée une visualisation D3 de l'arbre (méthode d'exemple à développer)
     * @param {string} containerSelector - Sélecteur CSS du conteneur
     */
    createVisualization(containerSelector) {
        if (!this.genreTree) {
            console.error('Impossible de créer la visualisation : aucune donnée chargée');
            return;
        }

        // Sélectionner le conteneur
        const container = d3.select(containerSelector);
        
        if (container.empty()) {
            console.error(`Conteneur non trouvé: ${containerSelector}`);
            return;
        }

        // Ici on peut ajouter la logique de visualisation D3
        // Pour l'instant, on affiche juste un message
        container.html(`
            <div>
                <h2>Arbre des Genres Musicaux</h2>
                <p>Nœud racine: ${this.genreTree.name}</p>
                <p>Nombre d'enfants: ${this.genreTree.children ? this.genreTree.children.length : 0}</p>
            </div>
        `);

        console.log('Visualisation basique créée dans', containerSelector);
    }

    /**
     * Retourne les données de l'arbre pour utilisation externe
     * @returns {any}
     */
    getTreeData() {
        return this.genreTree;
    }

    /**
     * Recherche un genre spécifique dans l'arbre
     * @param {string} genreName - Nom du genre à rechercher
     * @returns {any}
     */
    findGenre(genreName) {
        if (!this.genreTree) return null;
        
        const search = (node) => {
            if (node.name.toLowerCase().includes(genreName.toLowerCase())) {
                return node;
            }
            
            if (node.children) {
                for (const child of node.children) {
                    const result = search(child);
                    if (result) return result;
                }
            }
            
            return null;
        };
        
        return search(this.genreTree);
    }

    /**
     * Obtient les statistiques de l'arbre
     * @returns {object}
     */
    getTreeStatistics() {
        if (!this.genreTree) return null;

        const stats = {
            totalNodes: 0,
            totalSongs: 0,
            maxDepth: 0,
            genreNames: []
        };

        const traverse = (node, depth = 0) => {
            stats.totalNodes++;
            stats.maxDepth = Math.max(stats.maxDepth, depth);
            stats.genreNames.push(node.name);
            
            if (node.songs) {
                stats.totalSongs += node.songs.length;
            }

            if (node.children) {
                node.children.forEach(child => traverse(child, depth + 1));
            }
        };

        traverse(this.genreTree);
        return stats;
    }
}