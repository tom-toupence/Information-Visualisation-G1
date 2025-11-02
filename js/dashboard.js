document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard SPOTIMIX chargé');

    // Charger les genres disponibles depuis music_genres_tree.json
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect && window.dataLoader) {
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

    // Créer un mini scatter preview dans le panel--a
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

    // Générer des données aléatoires pour le preview
    const previewData = Array.from({ length: 100 }, () => ({
        x: Math.random(),
        y: Math.random(),
        popularity: Math.random() * 100
    }));

    // Échelles
    const xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);

    const colorScale = d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateViridis);

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
        .data(previewData)
        .enter()
        .append('circle')
        .attr('class', 'preview-dot')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 0)
        .attr('fill', d => colorScale(d.popularity))
        .attr('opacity', 0.6)
        .transition()
        .duration(800)
        .delay((d, i) => i * 5)
        .attr('r', 3);
}
