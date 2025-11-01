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

        // Calculer dynamiquement les dimensions en fonction du conteneur (taille réduite)
        const node = /** @type {HTMLElement} */ (container.node());
        const bbox = (node && node.getBoundingClientRect) ? node.getBoundingClientRect() : { width: window.innerWidth * 0.6, height: window.innerHeight * 0.6 };
        const width = Math.max(400, Math.min(800, bbox.width || window.innerWidth * 0.6));
        const height = Math.max(300, Math.min(600, bbox.height || window.innerHeight * 0.6));
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        // Créer le SVG responsive, sans fond (transparent) et sans bordure
        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('background', 'transparent')
            .style('display', 'block');

        // Groupe principal (on positionne les éléments en coordonnées absolues)
        const mainGroup = svg.append('g');

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

        // Préparer les données à afficher selon le type de nœud
        const dataToShow = [];

        // Si le nœud actuel a des enfants genres, afficher uniquement ces enfants
        if (this.currentNode.children && this.currentNode.children.length > 0) {
            const childrenGenres = this.currentNode.children.map(child => ({
                ...child,
                type: 'genre',
                songCount: child.songs ? child.songs.length : 0,
                childCount: child.children ? child.children.length : 0,
                displayName: child.name
            }));
            dataToShow.push(...childrenGenres);
        }
        // Sinon, si c'est une feuille avec des chansons, afficher les chansons
        else if (this.currentNode.songs && this.currentNode.songs.length > 0) {
            const songs = this.currentNode.songs.slice(0, 10).map(song => ({
                type: 'song',
                name: song.track_name,
                artist: song.artist_name || 'Artiste inconnu', // Gérer le cas où artist_name n'existe pas
                displayName: song.artist_name ? `${song.artist_name} - ${song.track_name}` : song.track_name,
                songCount: 1, // Une chanson = 1
                childCount: 0,
                songData: song
            }));
            dataToShow.push(...songs);
        }

        // Vérifier s'il y a des données à afficher
        if (dataToShow.length === 0) {
            group.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('fill', '#666')
                .text('Aucun contenu disponible');
            return;
        }

        // Utiliser les données combinées
        const children = dataToShow;

        // Calculer la taille des bulles différemment selon le type
        const maxSongs = Math.max(...children.filter(d => d.type === 'genre').map(d => d.songCount), 1);

        const radiusScale = d3.scaleOrdinal()
            .domain(['genre', 'song'])
            .range([
                d3.scaleSqrt().domain([0, maxSongs]).range([25, 70]), // Genres : plus grands
                () => 50
            ]);

        // Fonction pour mesurer la largeur du texte d'une chanson
        const measureSongTextWidth = (songNode, fontSize) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            context.font = `${fontSize}px Arial`;

            const text = songNode.displayName || songNode.name;
            return context.measureText(text).width;
        };

        // Fonction pour calculer la taille de police optimale pour une chanson
        const calculateOptimalFontSize = (songNode, fixedRadius) => {
            const text = songNode.displayName || songNode.name;
            const availableWidth = fixedRadius * 1.6; // Largeur utilisable dans le cercle

            // Tester différentes tailles de police
            for (let fontSize = 14; fontSize >= 6; fontSize--) {
                const textWidth = measureSongTextWidth(songNode, fontSize);

                // Si le texte rentre avec cette taille de police
                if (textWidth <= availableWidth) {
                    return fontSize;
                }
            }

            // Taille minimum de sécurité
            return 6;
        };

        // Fonction pour obtenir le rayon selon le type
        const getRadius = (d) => {
            if (d.type === 'genre') {
                return radiusScale('genre')(d.songCount);
            } else {
                // Chansons : taille fixe
                return 50;
            }
        };

        // Couleurs différentes pour genres et chansons
        const genreColorScale = d3.scaleOrdinal(d3.schemeSet3);
        const songColor = '#ff6b6b'; // Rouge-orange pour les chansons

        const getColor = (d, i) => {
            if (d.type === 'genre') {
                return genreColorScale(i);
            } else {
                return songColor;
            }
        };

        // Simulation de force pour positionner les bulles
        /** @type {any} */
        const simulation = d3.forceSimulation(children)
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function (d) { return getRadius(/** @type {any} */(d)) + 5; }));

        // Créer les bulles
        const bubbles = group.selectAll('.bubble')
            .data(children)
            .enter()
            .append('g')
            .attr('class', 'bubble')
            .style('cursor', 'pointer');

        // Cercles des bulles
        bubbles.append('circle')
            .attr('r', d => getRadius(d))
            .style('fill', (d, i) => getColor(d, i))
            .style('stroke', '#333')
            .style('stroke-width', 2)
            .style('opacity', 0.8);

        // Texte des bulles - centré verticalement
        bubbles.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', d => {
                const radius = getRadius(d);
                if (d.type === 'song') {
                    // Pour les chansons, calculer la taille optimale pour rentrer dans la bulle fixe
                    return calculateOptimalFontSize(d, radius) + 'px';
                } else {
                    // Pour les genres, garder la logique existante
                    return Math.max(9, radius / 4.5) + 'px';
                }
            })
            .style('font-weight', d => d.type === 'song' ? 'normal' : 'bold') // Texte normal pour les chansons
            .style('fill', '#333')
            .style('pointer-events', 'none')
            .each(function (d) {
                const text = d3.select(this);
                const displayText = d.displayName || d.name;
                const words = displayText.split(' ');
                const radius = getRadius(d);

                // Ajuster la longueur du texte selon le type et la taille
                let maxLength;
                let shouldSplit = false;

                if (d.type === 'song') {
                    // Pour les chansons : bulle fixe de rayon 50, adapter le texte
                    const fontSize = calculateOptimalFontSize(d, radius);
                    maxLength = Math.floor(radius * 2.5 / (fontSize * 0.6)); // Estimation basée sur la police calculée
                    shouldSplit = words.length > 1 && displayText.length > 15;
                } else {
                    // Pour les genres - logique existante
                    maxLength = radius > 35 ? 50 : 35;
                    shouldSplit = words.length > 1 && displayText.length > 10 && radius > 25;
                }

                if (displayText.length > maxLength) {
                    // Tronquer le texte si trop long
                    text.text(displayText.substring(0, maxLength - 3) + '...');
                } else if (shouldSplit) {
                    // Diviser intelligemment en lignes en groupant les mots
                    text.text('');
                    const lineHeight = d.type === 'song' ? 1.0 : 1.1;
                    const maxLines = d.type === 'song' ? 3 : 3; // Augmenter à 3 lignes pour les genres aussi

                    // Calculer la longueur maximale par ligne basée sur le rayon
                    const maxCharsPerLine = Math.floor(radius / 3.5); // Adaptatif selon la taille de bulle

                    // Grouper les mots intelligemment
                    const lines = [];
                    let currentLine = '';

                    for (let word of words) {
                        const testLine = currentLine ? currentLine + ' ' + word : word;

                        // Si la ligne devient trop longue ou on a atteint le max de lignes
                        if (testLine.length > maxCharsPerLine && currentLine !== '' && lines.length < maxLines - 1) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }

                    // Ajouter la dernière ligne
                    if (currentLine) lines.push(currentLine);

                    // Limiter au nombre maximum de lignes
                    const finalLines = lines.slice(0, maxLines);
                    const startY = -(finalLines.length - 1) * lineHeight / 2;

                    finalLines.forEach((line, i) => {
                        text.append('tspan')
                            .attr('x', 0)
                            .attr('dy', i === 0 ? `${startY}em` : `${lineHeight}em`)
                            .text(line);
                    });
                } else {
                    text.text(displayText);
                }
            });        // Informations supplémentaires (nombre de chansons)
        // bubbles.append('text')
        //     .attr('text-anchor', 'middle')
        //     .attr('dy', '1.5em')
        //     .style('font-size', '10px')
        //     .style('fill', '#666')
        //     .style('pointer-events', 'none')
        //     .text(d => `${d.songCount} chansons`);

        // Indication des sous-enfants disponibles
        // bubbles.filter(d => d.childCount > 0)
        //     .append('text')
        //     .attr('text-anchor', 'middle')
        //     .attr('dy', '2.8em')
        //     .style('font-size', '9px')
        //     .style('fill', '#007bff')
        //     .style('font-weight', 'bold')
        //     .style('pointer-events', 'none')
        //     .text(d => `${d.childCount} sous-genres`);

        // Événements de clic pour navigation
        bubbles.on('click', (event, d) => {
            if (d.type === 'genre') {
                // Naviguer vers le genre (qu'il ait des enfants ou des chansons)
                console.log(`Navigation vers le genre: "${d.name}" (${d.songCount} chansons)`);
                this.navigateToChild(d);
                this.renderBubbles(group, width, height);
            } else if (d.type === 'song') {
                console.log(`Chanson sélectionnée: "${d.displayName}"`);
                this.showSongDetails(d);
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
            // Contraindre les cercles dans les limites du SVG
            children.forEach(d => {
                const radius = getRadius(d);
                d.x = Math.max(radius, Math.min(width - radius, d.x));
                d.y = Math.max(radius + 40, Math.min(height - radius, d.y)); // +40 pour éviter le titre
            });

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
                const artistName = song.artist_name || 'Artiste inconnu';
                console.log(`${i + 1}. ${artistName} - ${song.track_name}`);
            });
            if (genreNode.songs.length > 5) {
                console.log(`... et ${genreNode.songs.length - 5} autres`);
            }
        }
        console.log('========================');
    }

    /**
     * Affiche les détails d'une chanson
     * @param {any} songNode - Le nœud de chanson
     */
    showSongDetails(songNode) {
        console.log('=== DÉTAILS DE LA CHANSON ===');
        console.log(`Titre: ${songNode.name}`);
        console.log(`Artiste: ${songNode.artist}`);

        if (songNode.songData) {
            const song = songNode.songData;
            console.log('Informations supplémentaires:');
            console.log(`ID Spotify: ${song.track_id}`);
            // Afficher toutes les propriétés disponibles de la chanson
            Object.keys(song).forEach(key => {
                if (key !== 'track_name' && key !== 'track_id' && key !== 'artist_name') {
                    console.log(`${key}: ${song[key]}`);
                }
            });
        }
        console.log('=============================');
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