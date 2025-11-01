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
     * Crée une visualisation D3 interactive en bulles de l'arbre des genres
     * @param {string} containerSelector - Sélecteur CSS du conteneur
     */
    createVisualization(containerSelector) {
        if (!this.genreTree) {
            console.error('Impossible de créer la visualisation : aucune donnée chargée');
            return;
        }

        // Sélectionner le conteneur et le vider
        const container = d3.select(containerSelector);

        if (container.empty()) {
            console.error(`Conteneur non trouvé: ${containerSelector}`);
            return;
        }

        // Nettoyer le conteneur
        container.html('');

        // Dimensions de la visualisation
        const width = 800;
        const height = 600;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        // Créer le SVG
        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('border', '1px solid #ccc')
            .style('background', '#f9f9f9');

        // Groupe principal pour les transformations
        const mainGroup = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // État de navigation
        this.currentNode = this.genreTree;
        this.navigationHistory = [this.genreTree];

        // Créer la visualisation initiale
        this.renderBubbles(mainGroup, width - margin.left - margin.right, height - margin.top - margin.bottom);

        console.log('Visualisation en bulles créée dans', containerSelector);
    }

    /**
     * Rend les bulles pour un nœud donné
     * @param {any} group - Groupe SVG D3
     * @param {number} width - Largeur disponible
     * @param {number} height - Hauteur disponible
     */
    renderBubbles(group, width, height) {
        // Nettoyer le groupe
        group.selectAll('*').remove();

        // Titre du niveau actuel
        group.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(this.currentNode.name);

        // Bouton retour (si pas à la racine)
        if (this.navigationHistory.length > 1) {
            const backButton = group.append('g')
                .attr('class', 'back-button')
                .style('cursor', 'pointer');

            backButton.append('rect')
                .attr('x', 10)
                .attr('y', 10)
                .attr('width', 60)
                .attr('height', 25)
                .attr('rx', 5)
                .style('fill', '#007bff')
                .style('stroke', '#0056b3');

            backButton.append('text')
                .attr('x', 40)
                .attr('y', 27)
                .attr('text-anchor', 'middle')
                .style('fill', 'white')
                .style('font-size', '12px')
                .text('← Retour');

            backButton.on('click', () => {
                this.goBack();
                this.renderBubbles(group, width, height);
            });
        }

        // Vérifier s'il y a des enfants
        if (!this.currentNode.children || this.currentNode.children.length === 0) {
            group.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('fill', '#666')
                .text('Aucun sous-genre disponible');
            return;
        }

        // Données des enfants avec informations sur les chansons
        const children = this.currentNode.children.map(child => ({
            ...child,
            songCount: child.songs ? child.songs.length : 0,
            childCount: child.children ? child.children.length : 0
        }));

        // Calculer la taille des bulles basée sur le nombre de chansons
        const maxSongs = Math.max(...children.map(d => d.songCount), 1);
        const radiusScale = d3.scaleSqrt()
            .domain([0, maxSongs])
            .range([20, 80]);

        // Couleurs pour les bulles
        const colorScale = d3.scaleOrdinal(d3.schemeSet3);

        // Simulation de force pour positionner les bulles
        const simulation = d3.forceSimulation(children)
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => radiusScale(d.songCount || 0) + 5));

        // Créer les bulles
        const bubbles = group.selectAll('.bubble')
            .data(children)
            .enter()
            .append('g')
            .attr('class', 'bubble')
            .style('cursor', 'pointer');

        // Cercles des bulles
        bubbles.append('circle')
            .attr('r', d => radiusScale(d.songCount))
            .style('fill', (d, i) => colorScale(i))
            .style('stroke', '#333')
            .style('stroke-width', 2)
            .style('opacity', 0.8);

        // Texte des bulles (nom du genre)
        bubbles.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .style('font-size', d => Math.max(10, radiusScale(d.songCount) / 4) + 'px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('pointer-events', 'none')
            .each(function (d) {
                const words = d.name.split(' ');
                const text = d3.select(this);

                if (words.length > 1 && d.name.length > 15) {
                    // Diviser en plusieurs lignes si nécessaire
                    text.text('');
                    words.forEach((word, i) => {
                        text.append('tspan')
                            .attr('x', 0)
                            .attr('dy', i === 0 ? 0 : '1.2em')
                            .text(word);
                    });
                } else {
                    text.text(d.name);
                }
            });

        // Informations supplémentaires (nombre de chansons)
        bubbles.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.5em')
            .style('font-size', '10px')
            .style('fill', '#666')
            .style('pointer-events', 'none')
            .text(d => `${d.songCount} chansons`);

        // Indication des sous-enfants disponibles
        bubbles.filter(d => d.childCount > 0)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '2.8em')
            .style('font-size', '9px')
            .style('fill', '#007bff')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => `${d.childCount} sous-genres`);

        // Événements de clic pour navigation
        bubbles.on('click', (event, d) => {
            if (d.children && d.children.length > 0) {
                this.navigateToChild(d);
                this.renderBubbles(group, width, height);
            } else {
                console.log(`Genre "${d.name}" sélectionné (${d.songCount} chansons)`);
                // Ici on pourrait afficher plus de détails sur le genre
                this.showGenreDetails(d);
            }
        });

        // Effet de survol
        bubbles
            .on('mouseover', function (event, d) {
                d3.select(this).select('circle')
                    .transition()
                    .duration(200)
                    .style('opacity', 1)
                    .style('stroke-width', 3);
            })
            .on('mouseout', function (event, d) {
                d3.select(this).select('circle')
                    .transition()
                    .duration(200)
                    .style('opacity', 0.8)
                    .style('stroke-width', 2);
            });

        // Mettre à jour les positions avec la simulation
        simulation.on('tick', () => {
            bubbles.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
    }

    /**
     * Navigue vers un enfant spécifique
     * @param {any} childNode - Le nœud enfant vers lequel naviguer
     */
    navigateToChild(childNode) {
        this.navigationHistory.push(childNode);
        this.currentNode = childNode;
        console.log(`Navigation vers: ${childNode.name}`);
    }

    /**
     * Revient au niveau précédent
     */
    goBack() {
        if (this.navigationHistory.length > 1) {
            this.navigationHistory.pop();
            this.currentNode = this.navigationHistory[this.navigationHistory.length - 1];
            console.log(`Retour vers: ${this.currentNode.name}`);
        }
    }

    /**
     * Affiche les détails d'un genre (feuille de l'arbre)
     * @param {any} genreNode - Le nœud de genre
     */
    showGenreDetails(genreNode) {
        console.log('=== DÉTAILS DU GENRE ===');
        console.log(`Nom: ${genreNode.name}`);
        console.log(`Nombre de chansons: ${genreNode.songCount}`);

        if (genreNode.songs && genreNode.songs.length > 0) {
            console.log('Premières chansons:');
            genreNode.songs.slice(0, 5).forEach((song, i) => {
                console.log(`${i + 1}. ${song.artist_name} - ${song.track_name}`);
            });
            if (genreNode.songs.length > 5) {
                console.log(`... et ${genreNode.songs.length - 5} autres`);
            }
        }
        console.log('========================');
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