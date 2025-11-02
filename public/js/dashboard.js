// ============================================================================
// DASHBOARD.JS - Mini preview du scatter plot
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard SPOTIMIX chargé');

    // Créer un mini scatter preview dans le panel--d
    createScatterPreview();

    // Créer un mini heatmap preview dans le panel--a
    createHeatmapPreview();

    // Gérer le filtre de genre (optionnel pour l'instant)
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
        genreSelect.addEventListener('change', (e) => {
            console.log('Genre sélectionné:', e.target.value);
            // TODO: Filtrer les données selon le genre
        });
    }
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

    console.log('✅ Preview scatter créé');
}

/**
 * Crée un mini preview de la heatmap dans le dashboard
 */
function createHeatmapPreview() {
    const previewContainer = document.getElementById('preview-heatmap');
    if (!previewContainer) return;

    // Dimensions du preview
    const width = previewContainer.clientWidth || 500;
    const height = previewContainer.clientHeight || 250;
    const margin = { top: 10, right: 60, bottom: 35, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Créer le SVG
    const svg = d3.select(previewContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Données fictives pour le preview (8 artistes × 10 années)
    const artists = ['Artist 1', 'Artist 2', 'Artist 3', 'Artist 4', 'Artist 5', 'Artist 6', 'Artist 7', 'Artist 8'];
    const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
    
    const previewData = [];
    artists.forEach(artist => {
        years.forEach(year => {
            previewData.push({
                artist,
                year,
                popularity: Math.random() * 100
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

    // Récupérer les couleurs depuis CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const colors = {
        noData: rootStyles.getPropertyValue('--heatmap-no-data').trim(),
        range0: rootStyles.getPropertyValue('--heatmap-0-20').trim(),
        range1: rootStyles.getPropertyValue('--heatmap-20-40').trim(),
        range2: rootStyles.getPropertyValue('--heatmap-40-60').trim(),
        range3: rootStyles.getPropertyValue('--heatmap-60-80').trim(),
        range4: rootStyles.getPropertyValue('--heatmap-80-100').trim()
    };

    const colorScale = d3.scaleThreshold()
        .domain([1, 20, 40, 60, 80])
        .range([
            colors.noData,
            colors.range0,
            colors.range1,
            colors.range2,
            colors.range3,
            colors.range4
        ]);

    // Dessiner les cellules de la heatmap
    g.selectAll('.heatmap-cell')
        .data(previewData)
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.artist))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.popularity))
        .attr('stroke', '#1a1a1a')
        .attr('stroke-width', 0.5)
        .attr('rx', 1)
        .attr('opacity', 0)
        .transition()
        .duration(600)
        .delay((d, i) => i * 3)
        .attr('opacity', 1);

    // Axes
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em')
        .attr('transform', 'rotate(-45)')
        .style('fill', '#999')
        .style('font-size', '9px');

    g.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('fill', '#999')
        .style('font-size', '9px');

    // Styling des axes
    g.selectAll('path, line')
        .style('stroke', '#535353');

    // Labels
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 30)
        .style('text-anchor', 'middle')
        .style('fill', '#999')
        .style('font-size', '10px')
        .text('Année');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -innerHeight / 2)
        .style('text-anchor', 'middle')
        .style('fill', '#999')
        .style('font-size', '10px')
        .text('Artiste');

    // Mini légende
    const legendData = [
        { color: colors.range4, label: '80+' },
        { color: colors.range3, label: '60-80' },
        { color: colors.range2, label: '40-60' },
        { color: colors.range1, label: '20-40' },
        { color: colors.range0, label: '0-20' }
    ];

    const legend = g.append('g')
        .attr('transform', `translate(${innerWidth + 10}, 0)`);

    legendData.forEach((item, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 18})`);

        legendRow.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', item.color)
            .attr('stroke', '#1a1a1a')
            .attr('stroke-width', 0.5)
            .attr('rx', 1);

        legendRow.append('text')
            .attr('x', 16)
            .attr('y', 10)
            .style('fill', '#999')
            .style('font-size', '8px')
            .text(item.label);
    });

    console.log('✅ Preview heatmap créé');
}
