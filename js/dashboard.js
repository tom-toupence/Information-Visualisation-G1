// Charger les données de preview
let previewData = null;

async function loadPreviewData() {
    try {
        const response = await fetch('assets/preview_data.json');
        previewData = await response.json();
        console.log('📊 Données de preview chargées:', previewData);
    } catch (error) {
        console.warn('⚠️ Erreur chargement preview_data.json, utilisation de données simulées');
        previewData = null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard SPOTIMIX chargé');

    // Charger les données de preview en parallèle
    loadPreviewData();

    // Charger les genres disponibles depuis music_genres_tree.json
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
        console.log('Chargement des genres disponibles...');
        try {
            // Charger directement le fichier JSON sans DataLoader
            const response = await fetch('assets/music_genres_tree.json');
            const genreTree = await response.json();
            
            const genres = [];
            function extractLeafGenres(node) {
                // Si le nœud n'a pas d'enfants, c'est un genre terminal (feuille)
                if (!node.children || node.children.length === 0) {
                    if (node.name) {
                        genres.push(node.name);
                    }
                } else {
                    // Sinon, parcourir récursivement les enfants
                    node.children.forEach(child => extractLeafGenres(child));
                }
            }
            extractLeafGenres(genreTree);
            
            // Trier et dédupliquer
            const uniqueGenres = [...new Set(genres)].sort();
            
            // Vider le sélecteur et ajouter l'option "Tous"
            genreSelect.innerHTML = '<option value="">Tous les genres</option>';
            
            // Ajouter tous les genres triés
            uniqueGenres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
                genreSelect.appendChild(option);
            });

            // Restaurer la préférence de genre depuis LocalStorage
            const PREFS_KEY = 'spotimix_user_prefs';
            try {
                const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
                if (prefs.genre) {
                    genreSelect.value = prefs.genre;
                    console.log('Genre restauré depuis préférences:', prefs.genre);
                }
            } catch (error) {
                console.warn('Erreur restauration préférences:', error);
            }

            // Sauvegarder le genre quand il change
            genreSelect.addEventListener('change', (e) => {
                const selectedGenre = e.target.value;
                try {
                    const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
                    prefs.genre = selectedGenre;
                    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
                    console.log('💾 Genre sauvegardé:', selectedGenre || 'Tous les genres');
                } catch (error) {
                    console.warn('Erreur sauvegarde préférences:', error);
                }
            });
        } catch (error) {
            console.error('Erreur chargement genres:', error);
        }
    }

    // Créer les mini previews dans les panels
    createHeatmapPreview();
    createTimelinePreview();
    createGenresPreview();
    createScatterPreview();
});

/**
 * Crée un mini preview du scatter plot dans le dashboard
 */
function createScatterPreview() {
    const previewContainer = document.getElementById('preview-scatter');
    if (!previewContainer) return;

    // Dimensions du preview
    const width = previewContainer.clientWidth || 400;
    const height = previewContainer.clientHeight || 250;
    const margin = { top: 10, right: 10, bottom: 25, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Créer le SVG
    const svg = d3.select(previewContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Utiliser les vraies données ou simuler
    const scatterData = previewData?.tracks || Array.from({ length: 100 }, () => ({
        danceability: Math.random(),
        energy: Math.random(),
        popularity: Math.random() * 100
    }));

    // Échelles
    const xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);

    // Couleurs selon le CSS : gradient bleu (#6eb6ff) à rose (#ff6ad5)
    const colorScale = d3.scaleLinear()
        .domain([0, 50, 100])
        .range(['#6eb6ff', '#8e98c9', '#ff6ad5']);

    // Axes simples
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', '#999')
        .style('font-size', '10px');

    g.append('g')
        .call(yAxis)
        .selectAll('text')
        .style('fill', '#999')
        .style('font-size', '10px');

    g.selectAll('path, line')
        .style('stroke', '#535353');

    // Labels minimalistes
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 20)
        .style('text-anchor', 'middle')
        .style('fill', '#999')
        .style('font-size', '11px')
        .text('Danceability');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -25)
        .attr('x', -innerHeight / 2)
        .style('text-anchor', 'middle')
        .style('fill', '#999')
        .style('font-size', '11px')
        .text('Energy');

    // Points
    g.selectAll('.preview-dot')
        .data(scatterData)
        .enter()
        .append('circle')
        .attr('class', 'preview-dot')
        .attr('cx', d => xScale(d.danceability))
        .attr('cy', d => yScale(d.energy))
        .attr('r', 0)
        .attr('fill', d => colorScale(d.popularity))
        .attr('opacity', 0.6)
        .transition()
        .duration(800)
        .delay((d, i) => i * 5)
        .attr('r', 3);
}

/**
 * Crée un mini preview de la heatmap dans le dashboard
 */
function createHeatmapPreview() {
    const previewContainer = document.getElementById('preview-heatmap');
    if (!previewContainer) return;

    // Dimensions du preview
    const width = previewContainer.clientWidth || 400;
    const height = previewContainer.clientHeight || 250;
    const margin = { top: 10, right: 10, bottom: 25, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Créer le SVG
    const svg = d3.select(previewContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Utiliser les vraies données d'artistes ou simuler
    const artistsData = previewData?.artists?.slice(0, 5) || 
        Array.from({ length: 5 }, (_, i) => ({ 
            name: `Artist ${i + 1}`, 
            avg_popularity: Math.random() * 100,
            years: [2019, 2020, 2021] 
        }));
    
    const artists = artistsData.map(a => a.name);
    const years = ['2019', '2020', '2021', '2022', '2023'];
    const heatmapData = [];
    
    // Générer les données de la heatmap
    artistsData.forEach(artist => {
        years.forEach(year => {
            const hasYear = artist.years.includes(parseInt(year));
            heatmapData.push({
                artist: artist.name,
                year: year,
                popularity: hasYear ? artist.avg_popularity : Math.random() * 30
            });
        });
    });

    // Échelles
    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, innerWidth])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(artists)
        .range([0, innerHeight])
        .padding(0.05);

    // Gradient de couleurs selon le CSS : violet (#3F4C6B) à rose (#FF3FBF)
    const colorScale = d3.scaleThreshold()
        .domain([20, 40, 60, 80])
        .range(['#3F4C6B', '#5A5EA0', '#865FBF', '#C157B8', '#FF3FBF']);

    // Axes simples
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', '#999')
        .style('font-size', '10px');

    g.append('g')
        .call(yAxis)
        .selectAll('text')
        .style('fill', '#999')
        .style('font-size', '10px');

    g.selectAll('path, line')
        .style('stroke', '#535353');

    // Cellules de la heatmap
    g.selectAll('.heatmap-cell')
        .data(heatmapData)
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.artist))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.popularity))
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 10)
        .attr('opacity', 0.8);
}

/**
 * Crée un mini preview de la timeline des BPM dans le dashboard
 */
function createTimelinePreview() {
    const previewContainer = document.getElementById('preview-timeline');
    if (!previewContainer) return;

    // Dimensions du preview
    const width = previewContainer.clientWidth || 400;
    const height = previewContainer.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Créer le SVG
    const svg = d3.select(previewContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Utiliser les vraies données ou simuler des tracks avec BPM
    let tracksData;
    if (previewData?.tracks) {
        // Utiliser les vraies données et générer des tempos cohérents
        tracksData = previewData.tracks.map(track => ({
            ...track,
            // Générer un tempo basé sur le genre et l'énergie
            tempo: generateTempoFromTrack(track)
        }));
    } else {
        // Fallback : générer des données simulées
        tracksData = Array.from({ length: 50 }, () => ({
            tempo: 60 + Math.random() * 140, // BPM entre 60 et 200
            popularity: Math.random() * 100,
            genre: ['pop', 'rock', 'electronic', 'hip-hop', 'jazz'][Math.floor(Math.random() * 5)]
        }));
    }

    // Fonction pour générer un tempo cohérent basé sur le genre et l'énergie
    function generateTempoFromTrack(track) {
        const genreTempoRanges = {
            'pop': { min: 100, max: 140 },
            'rock': { min: 110, max: 160 },
            'hip-hop': { min: 80, max: 120 },
            'electronic': { min: 120, max: 150 },
            'jazz': { min: 80, max: 140 },
            'reggaeton': { min: 90, max: 110 }
        };
        
        const range = genreTempoRanges[track.genre] || { min: 90, max: 140 };
        const energy = track.energy || 0.5;
        
        // Le tempo est influencé par l'énergie dans la plage du genre
        const tempoRange = range.max - range.min;
        const baseTempo = range.min + (energy * tempoRange);
        
        // Utiliser une variation basée sur la popularité (déterministe)
        const popularityVariation = ((track.popularity || 50) % 20) - 10;
        return Math.round(baseTempo + popularityVariation);
    }

    // Configuration similaire à la timeline principale
    const currentCenterTempo = 120;
    const tempoRange = 30;
    const centerBoxWidth = innerWidth * 0.6;
    const centerBoxStart = (innerWidth - centerBoxWidth) / 2;
    
    // Échelles
    const xScale = d3.scaleLinear()
        .domain([currentCenterTempo - tempoRange, currentCenterTempo + tempoRange])
        .range([centerBoxStart, centerBoxStart + centerBoxWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);

    // Couleurs de genres cohérentes avec la timeline principale
    const genreColors = {
        'pop': '#6eb6ff',
        'rock': '#ff7f0e', 
        'hip-hop': '#2ca02c',
        'electronic': '#d62728',
        'jazz': '#8c564b',
        'reggaeton': '#9467bd'
    };
    
    const getGenreColor = (genre) => genreColors[genre] || '#999999';
    
    const sizeScale = d3.scaleSqrt().domain([0, 100]).range([3, 8]);

    // === PARTIE CENTRALE ENCADRÉE ===
    
    // Clipping path pour limiter les points à la boîte centrale
    const clipBoxX = centerBoxStart - 5;
    const clipBoxY = innerHeight * 0.1;
    const clipBoxHeight = innerHeight * 0.8;
    
    g.append('defs').append('clipPath')
        .attr('id', 'preview-center-box-clip')
        .append('rect')
        .attr('x', clipBoxX)
        .attr('y', clipBoxY)
        .attr('width', centerBoxWidth + 10)
        .attr('height', clipBoxHeight);
    
    // Encadrement gris de la partie centrale
    g.append('rect')
        .attr('class', 'center-box')
        .attr('x', clipBoxX)
        .attr('y', clipBoxY)
        .attr('width', centerBoxWidth + 10)
        .attr('height', clipBoxHeight)
        .style('fill', 'none')
        .style('stroke', '#666')
        .style('stroke-width', 1);

    // === AXE PRINCIPAL ===
    
    const axisHeight = innerHeight - 10;
    
    // Ligne principale de l'axe
    g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', axisHeight)
        .attr('y2', axisHeight)
        .style('stroke', '#a7a7a7')
        .style('stroke-width', 1);

    // Lignes verticales pour les BPM dans la partie centrale
    // Seulement quelques lignes de référence principales
    const referenceTempos = [94, 103, 112, 120, 129, 137, 146];
    
    referenceTempos.forEach(tempo => {
        g.append('line')
            .attr('x1', xScale(tempo))
            .attr('x2', xScale(tempo))
            .attr('y1', 0)
            .attr('y2', axisHeight)
            .style('stroke', tempo === currentCenterTempo ? '#7972a8' : '#666')
            .style('stroke-width', tempo === currentCenterTempo ? 2 : 1)
            .style('opacity', tempo === currentCenterTempo ? 0.8 : 0.3);
    });

    // Ticks avec labels (tous les 10 BPM)
    referenceTempos.filter(t => t % 10 === 0).forEach(tempo => {
        g.append('text')
            .attr('x', xScale(tempo))
            .attr('y', axisHeight + 15)
            .style('fill', '#b3b3b3')
            .style('font-size', '10px')
            .style('text-anchor', 'middle')
            .text(tempo);
    });

    // === LIGNE HORIZONTALE CENTRALE ===
    
    // Ligne horizontale fine au centre du graphique
    const centerY = innerHeight / 2;
    g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', centerY)
        .attr('y2', centerY)
        .style('stroke', '#666')
        .style('stroke-width', 1)
        .style('opacity', 0.4);

    // === AXES ÉTENDUS SUR LES CÔTÉS ===
    
    // Grouper les tracks par BPM entier pour toutes les données
    const tracksByBPM = d3.group(tracksData, d => Math.round(d.tempo));
    const maxTracks = Math.max(...Array.from(tracksByBPM.values()).map(tracks => tracks.length), 1);

    // Échelles pour les côtés
    const leftScale = d3.scaleLinear()
        .domain([currentCenterTempo - 30, currentCenterTempo - 4])
        .range([5, centerBoxStart - 10]);

    const rightScale = d3.scaleLinear()
        .domain([currentCenterTempo + 4, currentCenterTempo + 30])
        .range([centerBoxStart + centerBoxWidth + 10, innerWidth - 5]);

    // Ticks côté gauche
    const leftTicks = [];
    for (let bpm = currentCenterTempo - 30; bpm <= currentCenterTempo - 4; bpm += 2) {
        leftTicks.push(bpm);
    }
    
    // Ticks côté droit
    const rightTicks = [];
    for (let bpm = currentCenterTempo + 4; bpm <= currentCenterTempo + 30; bpm += 2) {
        rightTicks.push(bpm);
    }

    // Barres côté gauche
    leftTicks.forEach(bpm => {
        const x = leftScale(bpm);
        const tracksAtBPM = tracksByBPM.get(bpm) || [];
        const trackCount = tracksAtBPM.length;
        
        // Ligne fine grise d'arrière-plan
        g.append('line')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', 0)
            .attr('y2', axisHeight)
            .style('stroke', '#666')
            .style('stroke-width', 0.5)
            .style('opacity', 0.3);
        
        if (trackCount > 0) {
            const lineHeight = (trackCount / maxTracks) * (innerHeight * 0.6);
            const centerY = innerHeight / 2;
            
            // Trouver le genre dominant
            const genreCounts = {};
            tracksAtBPM.forEach(track => {
                genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
            });
            const dominantGenre = Object.keys(genreCounts).reduce((a, b) => 
                genreCounts[a] > genreCounts[b] ? a : b
            );
            
            // Barre colorée proportionnelle
            g.append('line')
                .attr('x1', x)
                .attr('x2', x)
                .attr('y1', centerY - lineHeight / 2)
                .attr('y2', centerY + lineHeight / 2)
                .style('stroke', getGenreColor(dominantGenre))
                .style('stroke-width', Math.max(2, Math.min(6, 2 + (trackCount / maxTracks) * 4)))
                .style('opacity', 0.8)
                .style('stroke-linecap', 'round');
        }
        
        // Petits traits sur l'axe
        g.append('line')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', axisHeight - 3)
            .attr('y2', axisHeight + 3)
            .style('stroke', '#666')
            .style('stroke-width', 1);
        
        // Labels (1 fois sur 4)
        if (bpm % 8 === 0) {
            g.append('text')
                .attr('x', x)
                .attr('y', axisHeight + 15)
                .style('fill', '#b3b3b3')
                .style('font-size', '9px')
                .style('text-anchor', 'middle')
                .text(bpm);
        }
    });

    // Barres côté droit
    rightTicks.forEach(bpm => {
        const x = rightScale(bpm);
        const tracksAtBPM = tracksByBPM.get(bpm) || [];
        const trackCount = tracksAtBPM.length;
        
        // Ligne fine grise d'arrière-plan
        g.append('line')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', 0)
            .attr('y2', axisHeight)
            .style('stroke', '#666')
            .style('stroke-width', 0.5)
            .style('opacity', 0.3);
        
        if (trackCount > 0) {
            const lineHeight = (trackCount / maxTracks) * (innerHeight * 0.6);
            const centerY = innerHeight / 2;
            
            // Trouver le genre dominant
            const genreCounts = {};
            tracksAtBPM.forEach(track => {
                genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
            });
            const dominantGenre = Object.keys(genreCounts).reduce((a, b) => 
                genreCounts[a] > genreCounts[b] ? a : b
            );
            
            // Barre colorée proportionnelle
            g.append('line')
                .attr('x1', x)
                .attr('x2', x)
                .attr('y1', centerY - lineHeight / 2)
                .attr('y2', centerY + lineHeight / 2)
                .style('stroke', getGenreColor(dominantGenre))
                .style('stroke-width', Math.max(2, Math.min(6, 2 + (trackCount / maxTracks) * 4)))
                .style('opacity', 0.6)
                .style('stroke-linecap', 'round');
        }
        
        // Petits traits sur l'axe
        g.append('line')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', axisHeight - 3)
            .attr('y2', axisHeight + 3)
            .style('stroke', '#666')
            .style('stroke-width', 1);
        
        // Labels (1 fois sur 4)
        if (bpm % 8 === 0) {
            g.append('text')
                .attr('x', x)
                .attr('y', axisHeight + 15)
                .style('fill', '#b3b3b3')
                .style('font-size', '9px')
                .style('text-anchor', 'middle')
                .text(bpm);
        }
    });

    // === POINTS DANS LA ZONE CENTRALE ===
    
    // Filtrer les tracks visibles dans la zone centrale
    const visibleTracks = tracksData.filter(d => 
        d.tempo >= currentCenterTempo - tempoRange &&
        d.tempo <= currentCenterTempo + tempoRange
    );

    // Créer 7 colonnes fixes dans la zone centrale
    const numberOfColumns = 7;
    const columnWidth = centerBoxWidth / numberOfColumns;
    const columns = [];
    
    // Initialiser les 7 colonnes
    for (let i = 0; i < numberOfColumns; i++) {
        columns.push({
            x: centerBoxStart + (i * columnWidth) + (columnWidth / 2), // Centre de la colonne
            tracks: []
        });
    }
    
    // Distribuer les tracks dans les colonnes en fonction de leur BPM
    // Grouper par BPM arrondi d'abord
    const centralTracksByBPM = d3.group(visibleTracks, d => Math.round(d.tempo));
    
    // Pour chaque BPM, distribuer les tracks dans les 7 colonnes
    centralTracksByBPM.forEach((tracks, bpm) => {
        tracks.forEach((track, index) => {
            // Distribuer de façon stable basée sur le BPM et l'index
            const columnIndex = (Math.round(bpm) + index) % numberOfColumns;
            columns[columnIndex].tracks.push(track);
        });
    });
    
    // Positionner les tracks dans chaque colonne
    columns.forEach(column => {
        column.tracks.forEach((track, index) => {
            track.xPosition = column.x;
            // Empiler verticalement dans la colonne avec un petit espacement
            const spacing = Math.min(clipBoxHeight / Math.max(column.tracks.length, 1), 15);
            const startY = clipBoxY + (clipBoxHeight - (column.tracks.length - 1) * spacing) / 2;
            track.yPosition = startY + (index * spacing);
        });
    });

    // Dessiner les points
    const circles = g.selectAll('.preview-track-circle')
        .data(visibleTracks)
        .enter().append('circle')
        .attr('class', 'preview-track-circle')
        .attr('cx', d => d.xPosition) // Utiliser la position X calculée (colonnes)
        .attr('cy', d => d.yPosition)
        .attr('r', d => sizeScale(d.popularity))
        .style('fill', d => getGenreColor(d.genre))
        .style('opacity', 0.7)
        .attr('clip-path', 'url(#preview-center-box-clip)');

    // Animation d'entrée
    circles
        .attr('r', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 10)
        .attr('r', d => sizeScale(d.popularity));

    // === LABELS DES AXES ===
    
    // Label axe horizontal
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 25)
        .style('text-anchor', 'middle')
        .style('fill', '#b3b3b3')
        .style('font-size', '11px')
        .text('Tempo (bpm)');
}

/**
 * Crée un mini preview de l'exploration par genres dans le dashboard
 */
function createGenresPreview() {
    const previewContainer = document.getElementById('preview-genres');
    if (!previewContainer) return;

    // Dimensions du preview
    const width = previewContainer.clientWidth || 400;
    const height = previewContainer.clientHeight || 250;

    // Créer le SVG
    const svg = d3.select(previewContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Utiliser les vraies données de genres ou simuler
    const genresData = previewData?.genres || [
        { name: 'Pop', track_count: 80, avg_popularity: 85 },
        { name: 'Rock', track_count: 60, avg_popularity: 70 },
        { name: 'Jazz', track_count: 40, avg_popularity: 55 },
        { name: 'Hip-Hop', track_count: 70, avg_popularity: 80 },
        { name: 'Electronic', track_count: 50, avg_popularity: 75 }
    ];

    // Positionner les bulles de manière équilibrée
    const genres = genresData.map((g, i) => ({
        name: g.name,
        value: g.avg_popularity || g.track_count,
        size: g.track_count,
        x: width * (0.2 + (i % 3) * 0.3),
        y: height * (0.3 + Math.floor(i / 3) * 0.4)
    }));

    // Couleurs selon le CSS : bleu, rose, mauve, vert
    const colorScale = d3.scaleOrdinal()
        .domain(genres.map(d => d.name))
        .range(['#6eb6ff', '#ff6ad5', '#8e98c9', '#5be7a9', '#6eb6ff']);

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(genres, d => d.value)])
        .range([20, 50]);

    // Créer les bulles
    const bubbles = svg.selectAll('.genre-bubble')
        .data(genres)
        .enter()
        .append('g')
        .attr('class', 'genre-bubble')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // Cercles
    bubbles.append('circle')
        .attr('r', 0)
        .attr('fill', d => colorScale(d.name))
        .attr('opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr('r', d => radiusScale(d.value));

    // Texte (nom du genre)
    bubbles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .style('fill', '#fff')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('opacity', 0)
        .text(d => d.name)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100 + 400)
        .style('opacity', 1);
}
