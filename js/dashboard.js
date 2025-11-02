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
    // Attendre que window.dataLoader soit disponible
    while (!window.dataLoader) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('Dashboard SPOTIMIX chargé');

    // Charger les données de preview en parallèle
    loadPreviewData();

    // Charger les genres disponibles depuis music_genres_tree.json
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
        console.log('Chargement des genres disponibles...');
        try {
            const genres = await window.dataLoader.getAvailableGenres();
            console.log(`${genres.length} genres chargés depuis music_genres_tree.json`);
            
            // Vider le sélecteur et ajouter l'option "Tous"
            genreSelect.innerHTML = '<option value="">Tous les genres</option>';
            
            // Ajouter tous les genres triés
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
                genreSelect.appendChild(option);
            });

            // Restaurer la préférence sauvegardée
            const prefs = window.dataLoader.getUserPreferences();
            if (prefs.genre) {
                genreSelect.value = prefs.genre;
            }
        } catch (error) {
            console.error('Erreur chargement genres:', error);
        }

        // Gérer le changement de genre
        genreSelect.addEventListener('change', (e) => {
            const selectedGenre = e.target.value;
            console.log('Genre sélectionné:', selectedGenre);
            
            // Sauvegarder la préférence
            if (window.dataLoader) {
                window.dataLoader.saveUserPreferences({ genre: selectedGenre });
            }
        });
    }

    // Créer les mini previews dans les panels
    createHeatmapPreview();
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
