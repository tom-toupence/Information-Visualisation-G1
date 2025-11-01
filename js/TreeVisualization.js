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

        // Configuration des métriques (version minimale)
        /** @type {string} */
        this.colorMetric = 'none'; // 'none', 'danceability', 'energy', 'popularity'
        /** @type {string} */
        this.sizeMetric = 'count'; // 'count', 'avg_popularity'

        // Configuration du nombre de titres à afficher
        /** @type {number} */
        this.songsLimit = 10; // Nombre max de titres à afficher

        // Callback pour notifier les changements de navigation
        /** @type {Function|null} */
        this.onNavigationChange = null;
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
        
        // Notifier le changement si callback défini (pour mettre à jour la visibilité des contrôles)
        if (this.onNavigationChange) {
            this.onNavigationChange();
        }

        console.log('Visualisation en bulles créée dans', containerSelector);
    }

    /**
     * Rafraîchit la vue actuelle sans réinitialiser la navigation
     * @param {string} containerSelector - Sélecteur CSS du conteneur
     */
    refreshCurrentView(containerSelector) {
        const container = d3.select(containerSelector);

        if (container.empty()) {
            console.error(`Conteneur non trouvé: ${containerSelector}`);
            return;
        }

        // Récupérer le groupe principal existant
        const svg = container.select('svg');
        if (svg.empty()) {
            console.error('SVG non trouvé, utilisez createVisualization() d\'abord');
            return;
        }

        const mainGroup = svg.select('g');

        // Recalculer les dimensions (au cas où la fenêtre aurait été redimensionnée)
        const node = /** @type {HTMLElement} */ (container.node());
        const bbox = (node && node.getBoundingClientRect) ? node.getBoundingClientRect() : { width: window.innerWidth * 0.6, height: window.innerHeight * 0.6 };
        const width = Math.max(400, Math.min(800, bbox.width || window.innerWidth * 0.6));
        const height = Math.max(300, Math.min(600, bbox.height || window.innerHeight * 0.6));
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        // Rerendre les bulles avec la navigation actuelle préservée
        this.renderBubbles(mainGroup, width - margin.left - margin.right, height - margin.top - margin.bottom);

        // Notifier le changement si callback défini (pour mettre à jour la visibilité des contrôles)
        if (this.onNavigationChange) {
            this.onNavigationChange();
        }

        console.log('Vue actuelle rafraîchie');
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
            .style('fill', '#ffffffff')
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
            const songs = this.currentNode.songs.slice(0, this.songsLimit).map(song => ({
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

        // Utiliser la nouvelle logique de taille basée sur les métriques
        const getRadius = (d) => {
            return this.getSizeByMetric(d);
        };

        // Utiliser la nouvelle logique de couleur basée sur les métriques
        const getColor = (d, i) => {
            return this.getColorByMetric(d, i);
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

        // Notifier le changement de navigation si callback défini
        if (this.onNavigationChange) {
            this.onNavigationChange();
        }
    }

    /**
     * Revient au niveau précédent
     */
    goBack() {
        if (this.navigationHistory.length > 1) {
            this.navigationHistory.pop();
            this.currentNode = this.navigationHistory[this.navigationHistory.length - 1];
            console.log(`Retour vers: ${this.currentNode.name}`);

            // Notifier le changement de navigation si callback défini
            if (this.onNavigationChange) {
                this.onNavigationChange();
            }
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
     * Affiche les détails d'une chanson dans le panneau latéral
     * @param {any} songNode - Le nœud de chanson
     */
    async showSongDetails(songNode) {
        if (!songNode.songData) {
            console.warn('Aucune donnée disponible pour cette chanson');
            return;
        }

        // Créer le panneau s'il n'existe pas
        this.createInfoPanel();

        // Afficher un indicateur de chargement dans le panneau
        this.showLoadingInfo();

        try {
            // Récupérer les propriétés complètes via DataLoader
            const fullTrackData = await this.dataLoader.getProps(songNode.songData.track_id);

            // Utiliser les données complètes si disponibles, sinon les données de base
            const song = fullTrackData || songNode.songData;

            // Afficher les informations dans le panneau
            this.displaySongInfo(song, !!fullTrackData);
        } catch (error) {
            console.error('Erreur lors du chargement des détails de la chanson:', error);
            // Fallback sur les données de base
            this.displaySongInfo(songNode.songData, false);
        }
    }

    /**
     * Crée le panneau d'informations à droite si il n'existe pas
     * @private
     */
    createInfoPanel() {
        // Vérifier si le panneau existe déjà
        if (document.getElementById('song-info-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'song-info-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: calc(100vh - 40px);
            background: rgba(45, 52, 64, 0.95);
            border: 1px solid rgba(128, 139, 150, 0.3);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            z-index: 1000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow-y: auto;
            color: #eceff4;
        `;

        document.body.appendChild(panel);
    }

    /**
     * Affiche un indicateur de chargement dans le panneau
     * @private
     */
    showLoadingInfo() {
        const panel = document.getElementById('song-info-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 16px; color: #eceff4; margin-bottom: 10px;">Chargement des détails...</div>
                <div style="font-size: 14px; color: #d8dee9;">Veuillez patienter</div>
            </div>
        `;
    }

    /**
     * Affiche les détails de la chanson dans le panneau latéral
     * @param {any} song - Les données de la chanson
     * @param {boolean} isComplete - Si les données sont complètes ou partielles
     * @private
     */
    displaySongInfo(song, isComplete) {

        const panel = document.getElementById('song-info-panel');
        if (!panel) return;

        // Vider le panneau
        panel.innerHTML = '';

        // En-tête avec titre et bouton de fermeture
        const header = document.createElement('div');
        header.style.cssText = `
            background: rgba(59, 66, 82, 0.8);
            padding: 15px;
            border-bottom: 1px solid rgba(128, 139, 150, 0.2);
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const headerTitle = document.createElement('h3');
        headerTitle.textContent = 'Détails de la chanson';
        headerTitle.style.cssText = `
            margin: 0;
            color: #eceff4;
            font-size: 16px;
            font-weight: 500;
        `;



        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: rgba(191, 97, 106, 0.2);
            border: 1px solid rgba(191, 97, 106, 0.3);
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            color: #bf616a;
            padding: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(191, 97, 106, 0.4)';
            closeButton.style.color = '#eceff4';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'rgba(191, 97, 106, 0.2)';
            closeButton.style.color = '#bf616a';
        };
        closeButton.onclick = () => this.hideInfoPanel();

        header.appendChild(headerTitle);
        header.appendChild(closeButton);

        // Contenu principal
        const content = document.createElement('div');
        content.style.padding = '15px';

        // Informations principales (titre et artiste en premier)
        const mainInfo = document.createElement('div');
        mainInfo.innerHTML = `
            <div style="margin-bottom: 15px; padding: 12px; background: rgba(136, 192, 208, 0.15); border-radius: 8px; border-left: 4px solid #88c0d0;">
                <div style="color: #eceff4; font-size: 16px; font-weight: 600; margin-bottom: 5px;">${song.track_name || 'Titre inconnu'}</div>
                <div style="color: #d8dee9; font-size: 14px;">${song.artist_name || 'Artiste inconnu'}</div>
            </div>
        `;

        content.appendChild(mainInfo);

        // Créer les sections d'informations organisées
        this.createInfoSections(content, song, isComplete);

        // Assembler le panneau
        panel.appendChild(header);
        panel.appendChild(content);

        console.log(`Informations affichées pour: "${song.track_name}" - ${song.artist_name}`);
    }

    /**
     * Cache le panneau d'informations
     * @private
     */
    hideInfoPanel() {
        const panel = document.getElementById('song-info-panel');
        if (panel) {
            panel.remove();
        }
    }

    /**
     * Crée les sections d'informations organisées
     * @param {HTMLElement} container - Le conteneur parent
     * @param {any} song - Les données de la chanson
     * @param {boolean} isComplete - Si les données sont complètes
     * @private
     */
    createInfoSections(container, song, isComplete) {
        // Section aperçu (toujours visible)
        const overviewFields = ['danceability', 'energy', 'speechiness', 'popularity', 'year'];
        if (overviewFields.some(key => song[key] !== undefined)) {
            this.createOverviewSection(container, overviewFields, song);
        }

        // Sections collapsibles
        const audioFeatures = ['valence', 'tempo', 'loudness', 'acousticness', 'instrumentalness', 'liveness'];
        const technicalInfo = ['key', 'mode', 'time_signature', 'duration_ms'];
        const generalInfo = ['genre', 'track_id'];

        if (audioFeatures.some(key => song[key] !== undefined)) {
            this.createCollapsibleSection(container, 'Caractéristiques Audio', audioFeatures, song, true);
        }

        if (technicalInfo.some(key => song[key] !== undefined)) {
            this.createCollapsibleSection(container, 'Informations Techniques', technicalInfo, song, false);
        }

        if (generalInfo.some(key => song[key] !== undefined)) {
            this.createCollapsibleSection(container, 'Informations Générales', generalInfo, song, false);
        }

        // Afficher les propriétés restantes s'il y en a
        const displayedKeys = ['track_name', 'artist_name', ...overviewFields, ...audioFeatures, ...technicalInfo, ...generalInfo];
        const remainingKeys = Object.keys(song).filter(key => !displayedKeys.includes(key));

        if (remainingKeys.length > 0) {
            this.createCollapsibleSection(container, 'Autres Propriétés', remainingKeys, song, false);
        }
    }

    /**
     * Crée la section aperçu (toujours visible)
     * @param {HTMLElement} container - Le conteneur parent
     * @param {string[]} keys - Les clés à afficher
     * @param {any} song - Les données de la chanson
     * @private
     */
    createOverviewSection(container, keys, song) {
        const availableKeys = keys.filter(key => song[key] !== undefined && song[key] !== null);

        if (availableKeys.length === 0) return;

        const section = document.createElement('div');
        section.style.cssText = `
            margin: 12px 0;
            padding: 12px;
            background: rgba(136, 192, 208, 0.2);
            border-radius: 8px;
            border-left: 4px solid #88c0d0;
        `;

        const sectionTitle = document.createElement('h3');
        sectionTitle.style.cssText = `
            color: #88c0d0;
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: 600;
        `;
        sectionTitle.textContent = 'Aperçu';

        const infoGrid = document.createElement('div');
        infoGrid.style.cssText = `
            display: grid;
            gap: 8px;
            font-size: 13px;
        `;

        availableKeys.forEach(key => {
            const infoItem = document.createElement('div');
            const rawValue = song[key];
            const isPercentageField = ['danceability', 'energy', 'speechiness'].includes(key);

            if (isPercentageField) {
                // Style pour les champs avec barre de progression
                infoItem.style.cssText = `
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(128, 139, 150, 0.2);
                `;

                const labelRow = document.createElement('div');
                labelRow.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                `;

                const keyElement = document.createElement('span');
                keyElement.textContent = this.formatPropertyName(key) + ':';
                keyElement.style.cssText = 'color: #d8dee9; font-weight: 500; font-size: 13px;';

                const percentage = Math.round(rawValue * 100);
                const valueElement = document.createElement('span');
                valueElement.textContent = percentage + '%';
                valueElement.style.cssText = 'color: #eceff4; font-weight: 600; font-size: 13px;';

                labelRow.appendChild(keyElement);
                labelRow.appendChild(valueElement);

                // Barre de progression
                const progressBar = document.createElement('div');
                progressBar.style.cssText = `
                    width: 100%;
                    height: 6px;
                    background: rgba(67, 76, 94, 0.6);
                    border-radius: 3px;
                    overflow: hidden;
                `;

                const progressFill = document.createElement('div');
                const progressColor = this.getProgressColor(percentage);
                progressFill.style.cssText = `
                    height: 100%;
                    width: ${percentage}%;
                    background: ${progressColor};
                    border-radius: 3px;
                    transition: width 0.3s ease, background 0.3s ease;
                `;

                progressBar.appendChild(progressFill);
                infoItem.appendChild(labelRow);
                infoItem.appendChild(progressBar);
            } else {
                // Style normal pour les autres champs
                infoItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    border-bottom: 1px solid rgba(128, 139, 150, 0.2);
                `;

                const keyElement = document.createElement('span');
                keyElement.textContent = this.formatPropertyName(key) + ':';
                keyElement.style.cssText = 'color: #d8dee9; font-weight: 500;';

                const valueElement = document.createElement('span');
                valueElement.textContent = rawValue;
                valueElement.style.cssText = 'color: #eceff4; font-weight: 400;';

                infoItem.appendChild(keyElement);
                infoItem.appendChild(valueElement);
            }

            infoGrid.appendChild(infoItem);
        });

        section.appendChild(sectionTitle);
        section.appendChild(infoGrid);
        container.appendChild(section);
    }

    /**
     * Crée une section d'informations collapsible
     * @param {HTMLElement} container - Le conteneur parent
     * @param {string} title - Le titre de la section
     * @param {string[]} keys - Les clés à afficher
     * @param {any} song - Les données de la chanson
     * @param {boolean} isPercentage - Si les valeurs doivent être affichées en pourcentage
     * @private
     */
    createCollapsibleSection(container, title, keys, song, isPercentage = false) {
        const availableKeys = keys.filter(key => song[key] !== undefined && song[key] !== null);

        if (availableKeys.length === 0) return;

        const section = document.createElement('div');
        section.style.cssText = `
            margin: 12px 0;
            background: rgba(67, 76, 94, 0.4);
            border-radius: 8px;
            border-left: 4px solid #5e81ac;
            overflow: hidden;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(67, 76, 94, 0.2);
            transition: background 0.2s ease;
        `;

        const sectionTitle = document.createElement('h3');
        sectionTitle.style.cssText = `
            color: #eceff4;
            margin: 0;
            font-size: 14px;
            font-weight: 600;
        `;
        sectionTitle.textContent = title;

        const toggleIcon = document.createElement('span');
        toggleIcon.style.cssText = `
            color: #81a1c1;
            font-size: 12px;
            font-weight: bold;
            transition: transform 0.2s ease;
        `;
        toggleIcon.textContent = '▼';

        const content = document.createElement('div');
        content.style.cssText = `
            padding: 0 12px 12px 12px;
            display: block;
        `;

        const infoGrid = document.createElement('div');
        infoGrid.style.cssText = `
            display: grid;
            gap: 8px;
            font-size: 13px;
        `;

        availableKeys.forEach(key => {
            const infoItem = document.createElement('div');
            infoItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid rgba(128, 139, 150, 0.2);
            `;

            const keyElement = document.createElement('span');
            keyElement.textContent = this.formatPropertyName(key) + ':';
            keyElement.style.cssText = 'color: #d8dee9; font-weight: 500;';

            const valueElement = document.createElement('span');
            const rawValue = song[key];
            let displayValue;

            if (isPercentage && typeof rawValue === 'number' && rawValue <= 1) {
                displayValue = Math.round(rawValue * 100) + '%';
            } else if (key === 'duration_ms') {
                displayValue = this.formatDuration(rawValue);
            } else if (key === 'key') {
                displayValue = this.formatMusicalKey(rawValue);
            } else if (key === 'mode') {
                displayValue = rawValue === 1 ? 'Majeur' : 'Mineur';
            } else {
                displayValue = rawValue;
            }

            valueElement.textContent = displayValue;
            valueElement.style.cssText = 'color: #eceff4; font-weight: 400;';

            infoItem.appendChild(keyElement);
            infoItem.appendChild(valueElement);
            infoGrid.appendChild(infoItem);
        });

        content.appendChild(infoGrid);

        // Événement de clic pour collapse/expand
        let isCollapsed = false;
        header.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                content.style.display = 'none';
                toggleIcon.style.transform = 'rotate(-90deg)';
                toggleIcon.textContent = '▶';
            } else {
                content.style.display = 'block';
                toggleIcon.style.transform = 'rotate(0deg)';
                toggleIcon.textContent = '▼';
            }
        });

        // Effet hover sur l'en-tête
        header.addEventListener('mouseenter', () => {
            header.style.background = 'rgba(67, 76, 94, 0.6)';
        });
        header.addEventListener('mouseleave', () => {
            header.style.background = 'rgba(67, 76, 94, 0.2)';
        });

        header.appendChild(sectionTitle);
        header.appendChild(toggleIcon);
        section.appendChild(header);
        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Crée une section d'informations
     * @param {HTMLElement} container - Le conteneur parent
     * @param {string} title - Le titre de la section
     * @param {string[]} keys - Les clés à afficher
     * @param {any} song - Les données de la chanson
     * @param {boolean} isPercentage - Si les valeurs doivent être affichées en pourcentage
     * @private
     */
    createInfoSection(container, title, keys, song, isPercentage = false) {
        const availableKeys = keys.filter(key => song[key] !== undefined && song[key] !== null);

        if (availableKeys.length === 0) return;

        const section = document.createElement('div');
        section.style.cssText = `
            margin: 12px 0;
            padding: 12px;
            background: rgba(67, 76, 94, 0.4);
            border-radius: 8px;
            border-left: 4px solid #5e81ac;
        `;

        const sectionTitle = document.createElement('h3');
        sectionTitle.style.cssText = `
            color: #eceff4;
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: 600;
        `;
        sectionTitle.textContent = title;

        const infoGrid = document.createElement('div');
        infoGrid.style.cssText = `
            display: grid;
            gap: 8px;
            font-size: 13px;
        `;

        availableKeys.forEach(key => {
            const infoItem = document.createElement('div');
            infoItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid rgba(128, 139, 150, 0.2);
            `;

            const keyElement = document.createElement('span');
            keyElement.textContent = this.formatPropertyName(key) + ':';
            keyElement.style.cssText = 'color: #d8dee9; font-weight: 500;';

            const valueElement = document.createElement('span');
            const rawValue = song[key];
            let displayValue;

            if (isPercentage && typeof rawValue === 'number' && rawValue <= 1) {
                displayValue = Math.round(rawValue * 100) + '%';
            } else if (key === 'duration_ms') {
                displayValue = this.formatDuration(rawValue);
            } else if (key === 'key') {
                displayValue = this.formatMusicalKey(rawValue);
            } else if (key === 'mode') {
                displayValue = rawValue === 1 ? 'Majeur' : 'Mineur';
            } else {
                displayValue = rawValue;
            }

            valueElement.textContent = displayValue;
            valueElement.style.cssText = 'color: #eceff4; font-weight: 400;';

            infoItem.appendChild(keyElement);
            infoItem.appendChild(valueElement);
            infoGrid.appendChild(infoItem);
        });

        section.appendChild(sectionTitle);
        section.appendChild(infoGrid);
        container.appendChild(section);
    }

    /**
     * Formate le nom d'une propriété pour l'affichage
     * @param {string} key - La clé à formater
     * @returns {string} Le nom formaté
     * @private
     */
    formatPropertyName(key) {
        const translations = {
            'danceability': 'Dansabilité',
            'energy': 'Énergie',
            'valence': 'Valence',
            'tempo': 'Tempo (BPM)',
            'loudness': 'Volume (dB)',
            'acousticness': 'Acoustique',
            'instrumentalness': 'Instrumental',
            'liveness': 'Live',
            'speechiness': 'Vocal',
            'popularity': 'Popularité',
            'year': 'Année',
            'genre': 'Genre',
            'track_id': 'ID Spotify',
            'key': 'Tonalité',
            'mode': 'Mode',
            'time_signature': 'Signature rythmique',
            'duration_ms': 'Durée'
        };

        return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Formate une durée en millisecondes
     * @param {number} ms - Durée en millisecondes
     * @returns {string} Durée formatée
     * @private
     */
    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Formate une clé musicale
     * @param {number} key - Clé musicale (0-11)
     * @returns {string} Nom de la clé
     * @private
     */
    formatMusicalKey(key) {
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return keys[key] || 'Inconnu';
    }

    /**
     * Calcule la couleur de la barre de progression en fonction du pourcentage
     * @param {number} percentage - Le pourcentage (0-100)
     * @returns {string} La couleur CSS (dégradé)
     * @private
     */
    getProgressColor(percentage) {
        // Normaliser le pourcentage entre 0 et 1
        const ratio = Math.max(0, Math.min(100, percentage)) / 100;

        // Couleurs de début (vert/bleu) et de fin (rouge)
        const startColor = { r: 136, g: 192, b: 208 }; // #88c0d0 (bleu clair)
        const midColor = { r: 235, g: 203, b: 139 };   // #ebcb8b (jaune)
        const endColor = { r: 191, g: 97, b: 106 };    // #bf616a (rouge)

        let color1, color2, localRatio;

        if (ratio <= 0.5) {
            // De bleu à jaune (0% à 50%)
            color1 = startColor;
            color2 = midColor;
            localRatio = ratio * 2; // Normaliser entre 0 et 1
        } else {
            // De jaune à rouge (50% à 100%)
            color1 = midColor;
            color2 = endColor;
            localRatio = (ratio - 0.5) * 2; // Normaliser entre 0 et 1
        }

        // Interpolation linéaire des composantes RGB
        const r = Math.round(color1.r + (color2.r - color1.r) * localRatio);
        const g = Math.round(color1.g + (color2.g - color1.g) * localRatio);
        const b = Math.round(color1.b + (color2.b - color1.b) * localRatio);

        // Créer un dégradé subtil pour plus de profondeur
        const lightColor = `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`;
        const darkColor = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;

        return `linear-gradient(90deg, ${lightColor}, ${darkColor})`;
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

    /**
     * Définit la métrique utilisée pour la couleur des bulles
     * @param {string} metric - 'none', 'danceability', 'energy', 'popularity'
     */
    setColorMetric(metric) {
        this.colorMetric = metric;
        console.log(`Métrique de couleur définie: ${metric}`);
    }

    /**
     * Définit la métrique utilisée pour la taille des bulles  
     * @param {string} metric - 'count', 'avg_popularity'
     */
    setSizeMetric(metric) {
        this.sizeMetric = metric;
        console.log(`Métrique de taille définie: ${metric}`);
    }

    /**
     * Définit le nombre maximum de titres à afficher
     * @param {number} limit - Nombre max de titres (5, 10, 20, 30)
     */
    setSongsLimit(limit) {
        this.songsLimit = limit;
        console.log(`Limite de titres définie: ${limit}`);
    }

    /**
     * Détermine si on affiche actuellement des titres (et pas des genres)
     * @returns {boolean} True si on affiche des titres
     */
    isDisplayingSongs() {
        if (!this.currentNode) return false;

        // On affiche des titres si c'est une feuille avec des chansons
        return (!this.currentNode.children || this.currentNode.children.length === 0) &&
            (this.currentNode.songs && this.currentNode.songs.length > 0);
    }

    /**
     * Calcule la couleur d'une bulle selon la métrique choisie
     * @param {any} d - Les données du nœud
     * @param {number} i - L'index du nœud
     * @returns {string} La couleur
     */
    getColorByMetric(d, i) {
        if (d.type === 'song') {
            return '#ff6b6b'; // Couleur fixe pour les chansons
        }

        if (this.colorMetric === 'none') {
            // Couleur par défaut (palette)
            const genreColorScale = d3.scaleOrdinal(d3.schemeSet3);
            return genreColorScale(i.toString());
        }

        // Utiliser la métrique pour la couleur
        if (d.metrics && d.metrics[`avg_${this.colorMetric}`] !== undefined) {
            const value = d.metrics[`avg_${this.colorMetric}`];

            // Échelles de couleur selon la métrique
            if (this.colorMetric === 'danceability') {
                const colorScale = d3.scaleSequential(d3.interpolateBlues)
                    .domain([0, 1]);
                return colorScale(value);
            } else if (this.colorMetric === 'energy') {
                const colorScale = d3.scaleSequential(d3.interpolateOranges)
                    .domain([0, 1]);
                return colorScale(value);
            } else if (this.colorMetric === 'popularity') {
                const colorScale = d3.scaleSequential(d3.interpolatePurples)
                    .domain([0, 100]);
                return colorScale(value);
            }
        }

        // Fallback
        const genreColorScale = d3.scaleOrdinal(d3.schemeSet3);
        return genreColorScale(i.toString());
    }

    /**
     * Calcule la taille d'une bulle selon la métrique choisie
     * @param {any} d - Les données du nœud
     * @returns {number} Le rayon
     */
    getSizeByMetric(d) {
        if (d.type === 'song') {
            return 50; // Taille fixe pour les chansons
        }

        if (this.sizeMetric === 'count') {
            // Logique existante basée sur le nombre de chansons
            const maxSongs = Math.max(...this.getCurrentChildren().filter(node => node.type === 'genre').map(node => node.songCount), 1);
            const radiusScale = d3.scaleSqrt().domain([0, maxSongs]).range([25, 70]);
            return radiusScale(d.songCount);
        } else if (this.sizeMetric === 'avg_popularity' && d.metrics) {
            // Taille basée sur la popularité moyenne
            const popularityScale = d3.scaleSqrt().domain([0, 100]).range([25, 70]);
            return popularityScale(d.metrics.avg_popularity || 0);
        }

        // Fallback
        return 50;
    }

    /**
     * Obtient les enfants actuels (pour les calculs de taille)
     * @returns {Array} Les enfants actuels
     */
    getCurrentChildren() {
        // Version simplifiée - retourne les enfants du niveau racine
        if (this.genreTree && this.genreTree.children) {
            return this.genreTree.children.map(child => ({
                type: 'genre',
                songCount: child.songs ? child.songs.length : 0,
                metrics: child.metrics
            }));
        }
        return [];
    }
}