// ============================================================================
// SCATTER PLOT - TOUT EN UN FICHIER
// Conversion de ScatterProcessor + ScatterMapper + ScatterChart en JS pur
// ============================================================================

// ============================================================================
// 1. DATA PROCESSOR
// ============================================================================
class ScatterDataProcessor {
    constructor() {
        this.cachedData = null;
    }

    /**
     * Charge et traite les données CSV pour une année donnée
     */
    async processScatterData(filterYear = 2023, topN = 1000) {
        try {
            console.log(`📊 Chargement des données pour l'année ${filterYear}...`);
            
            // Charger le CSV
            const data = await d3.csv('data/spotify_data.csv', d => ({
                track_name: d.track_name,
                artist_name: d['artist(s)_name'],
                genre: d.track_genre,
                year: +d.year,
                popularity: +d.popularity,
                danceability: +d.danceability,
                energy: +d.energy,
                valence: +d.valence,
                tempo: +d.tempo
            }));

            // Filtrer par année
            let filtered = data.filter(track => track.year === filterYear);

            // Trier par popularité et garder les top N
            filtered = filtered
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, topN);

            // Nettoyer (supprimer valeurs invalides)
            const cleaned = filtered.filter(item => {
                return !isNaN(item.danceability) && 
                       !isNaN(item.popularity) && 
                       !isNaN(item.energy) &&
                       item.danceability >= 0 && item.danceability <= 1 &&
                       item.popularity >= 0 && item.popularity <= 100 &&
                       item.energy >= 0 && item.energy <= 1;
            });

            console.log(`✅ ${cleaned.length} pistes chargées pour ${filterYear}`);
            return cleaned;

        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            return [];
        }
    }
}

// ============================================================================
// 2. DATA MAPPER
// ============================================================================
class ScatterDataMapper {
    
    /**
     * Mappe les données pour la visualisation D3
     */
    mapForVisualization(scatterData) {
        const colorScale = this.createPopularityColorScale();
        const sizeScale = this.createTempoSizeScale(scatterData);
        
        return scatterData.map((item, index) => ({
            id: `track-${index}`,
            x: item.danceability,
            y: item.energy,
            size: sizeScale(item.tempo || 120),
            color: colorScale(item.popularity),
            metadata: {
                track_name: item.track_name || '',
                artist_name: item.artist_name || '',
                genre: item.genre || '',
                popularity: item.popularity,
                danceability: item.danceability,
                energy: item.energy,
                valence: item.valence,
                tempo: item.tempo
            }
        }));
    }

    /**
     * Échelle de couleur Viridis pour la popularité
     */
    createPopularityColorScale() {
        return d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateViridis);
    }

    /**
     * Échelle de taille pour le tempo
     */
    createTempoSizeScale(data) {
        const tempos = data.map(d => d.tempo || 120);
        const maxTempo = Math.max(...tempos);
        
        return d3.scaleSqrt()
            .domain([0, maxTempo])
            .range([2, 12]);
    }
}

// ============================================================================
// 3. SCATTER CHART
// ============================================================================
class ScatterChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.width = options.width || 900;
        this.height = options.height || 600;
        this.margin = { top: 20, right: 20, bottom: 60, left: 60 };
        this.data = [];
        
        // Dimensions du graphique
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    }

    /**
     * Affiche le scatter plot
     */
    visualize(data) {
        this.data = data;
        
        // Supprimer le SVG existant
        d3.select(`#${this.containerId}`).select('svg').remove();

        // Créer le SVG
        const svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Groupe principal
        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Échelles
        const xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.innerWidth])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.innerHeight, 0])
            .nice();

        // Axes
        const xAxis = d3.axisBottom(xScale).ticks(10);
        const yAxis = d3.axisLeft(yScale).ticks(10);

        // Axe X
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2');

        // Axe Y
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2');
        
        // Style des lignes d'axes
        g.selectAll('.x-axis path, .y-axis path, .x-axis line, .y-axis line')
            .style('stroke', '#535353');

        // Labels
        g.append('text')
            .attr('transform', `translate(${this.innerWidth / 2}, ${this.innerHeight + 45})`)
            .style('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('Danceability →');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 10)
            .attr('x', 0 - (this.innerHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('← Energy');

        // Créer les cercles (gris par défaut)
        const circles = g.selectAll('.scatter-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'scatter-dot')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 0)
            .attr('fill', '#666')
            .attr('opacity', 0)
            .attr('stroke', '#444')
            .attr('stroke-width', 0.5)
            .attr('data-color', d => d.color);

        // Animation d'apparition
        circles.transition()
            .duration(500)
            .delay((d, i) => Math.min(i * 0.5, 100))
            .attr('r', d => d.size)
            .attr('opacity', 0.4);

        // Ajouter interactivité
        this.addTooltip(circles);
        this.addBrush(g, circles, xScale, yScale, data);

        console.log(`📊 Visualisation créée avec ${data.length} points`);
    }

    /**
     * Ajoute le tooltip au survol
     */
    addTooltip(circles) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'scatter-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '6px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '10000');

        circles
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget)
                    .transition()
                    .duration(100)
                    .attr('r', d.size * 1.5)
                    .attr('opacity', 1);

                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);

                tooltip.html(`
                    <div style="font-weight: 600; margin-bottom: 6px; color: ${d.color};">
                        ${d.metadata.track_name}
                    </div>
                    <div style="font-size: 11px; color: #ccc; margin-bottom: 8px;">
                        ${d.metadata.artist_name}
                    </div>
                    <div style="font-size: 11px; line-height: 1.6;">
                        <div>🎵 Popularité: <strong>${d.metadata.popularity}</strong>/100</div>
                        <div>💃 Danceability: <strong>${(d.metadata.danceability * 100).toFixed(0)}%</strong></div>
                        <div>⚡ Energy: <strong>${(d.metadata.energy * 100).toFixed(0)}%</strong></div>
                        ${d.metadata.valence !== undefined ? `<div>🎭 Valence: <strong>${(d.metadata.valence * 100).toFixed(0)}%</strong></div>` : ''}
                        ${d.metadata.tempo !== undefined ? `<div>⏱️ Tempo: <strong>${d.metadata.tempo.toFixed(0)} BPM</strong></div>` : ''}
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget)
                    .transition()
                    .duration(100)
                    .attr('r', d.size)
                    .attr('opacity', 0.7);

                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    /**
     * Ajoute le brush pour la sélection interactive
     */
    addBrush(g, circles, xScale, yScale, data) {
        // Créer le panel de stats (caché par défaut)
        const statsPanel = d3.select('body').append('div')
            .attr('class', 'brush-stats-panel')
            .style('position', 'fixed')
            .style('top', '120px')
            .style('right', '20px')
            .style('background', 'rgba(43, 47, 66, 0.95)')
            .style('border', '1px solid #7972a8')
            .style('border-radius', '8px')
            .style('padding', '16px')
            .style('color', '#e2e2e2')
            .style('font-size', '13px')
            .style('min-width', '250px')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('display', 'none')
            .style('z-index', '1000');

        // Créer le brush
        const brush = d3.brush()
            .extent([[0, 0], [this.innerWidth, this.innerHeight]])
            .on('start brush end', (event) => {
                const selection = event.selection;
                
                if (!selection) {
                    // Pas de sélection : tout en gris
                    circles
                        .attr('fill', '#666')
                        .attr('opacity', 0.4)
                        .attr('stroke-width', 0.5);
                    
                    statsPanel.style('display', 'none');
                    return;
                }

                const [[x0, y0], [x1, y1]] = selection;
                const selectedData = [];
                
                circles.each(function(d) {
                    const cx = xScale(d.x);
                    const cy = yScale(d.y);
                    const isSelected = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
                    
                    if (isSelected) {
                        selectedData.push(d);
                        // Colorer selon popularité
                        d3.select(this)
                            .attr('fill', d.color)
                            .attr('opacity', 0.9)
                            .attr('stroke', '#fff')
                            .attr('stroke-width', 1.5);
                    } else {
                        // Gris pour non sélectionnés
                        d3.select(this)
                            .attr('fill', '#666')
                            .attr('opacity', 0.2)
                            .attr('stroke-width', 0.5);
                    }
                });

                // Afficher les stats
                if (selectedData.length > 0) {
                    this.updateStatsPanel(statsPanel, selectedData, data.length);
                }
            });

        // Ajouter le brush au graphique
        g.append('g')
            .attr('class', 'brush')
            .call(brush);

        // Style du brush
        g.select('.brush')
            .selectAll('.selection')
            .style('fill', 'rgba(121, 114, 168, 0.2)')
            .style('stroke', '#7972a8')
            .style('stroke-width', '2px');
    }

    /**
     * Met à jour le panneau de statistiques
     */
    updateStatsPanel(panel, selectedData, totalCount) {
        const count = selectedData.length;
        const avgPopularity = d3.mean(selectedData, d => d.metadata.popularity) || 0;
        const avgEnergy = d3.mean(selectedData, d => d.metadata.energy) || 0;
        const avgDanceability = d3.mean(selectedData, d => d.metadata.danceability) || 0;
        const avgTempo = d3.mean(selectedData, d => d.metadata.tempo || 0) || 0;

        // Top artistes
        const artistCounts = new Map();
        selectedData.forEach(d => {
            const artist = d.metadata.artist_name;
            artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
        });

        const topArtists = Array.from(artistCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        panel.html(`
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #555;">
                <div style="font-weight: 600; font-size: 14px; color: #7972a8; margin-bottom: 8px;">
                    📊 Sélection
                </div>
                <div style="font-size: 16px; font-weight: 600;">
                    ${count} / ${totalCount} chansons
                </div>
                <div style="font-size: 11px; color: #aaa;">
                    ${((count / totalCount) * 100).toFixed(1)}% du total
                </div>
            </div>
            
            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #555;">
                <div style="font-weight: 600; margin-bottom: 6px; color: #8e98c9;">Moyennes</div>
                <div style="line-height: 1.8;">
                    <div>🎵 Popularité: <strong>${avgPopularity.toFixed(1)}</strong>/100</div>
                    <div>⚡ Energy: <strong>${(avgEnergy * 100).toFixed(1)}%</strong></div>
                    <div>💃 Danceability: <strong>${(avgDanceability * 100).toFixed(1)}%</strong></div>
                    <div>⏱️ Tempo: <strong>${avgTempo.toFixed(0)} BPM</strong></div>
                </div>
            </div>
            
            ${topArtists.length > 0 ? `
                <div>
                    <div style="font-weight: 600; margin-bottom: 6px; color: #8e98c9;">Top Artistes</div>
                    <div style="line-height: 1.6; font-size: 12px;">
                        ${topArtists.map(([artist, count], i) => `
                            <div style="margin-bottom: 4px;">
                                <span style="color: #7972a8; font-weight: 600;">${i + 1}.</span>
                                <span style="color: #e2e2e2;">${artist}</span>
                                <span style="color: #aaa; font-size: 11px;">(${count})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `).style('display', 'block');
    }
}

// ============================================================================
// 4. APPLICATION PRINCIPALE
// ============================================================================

// Instances globales
const processor = new ScatterDataProcessor();
const mapper = new ScatterDataMapper();
let currentChart = null;

/**
 * Rend le scatter plot pour une année donnée
 */
async function renderScatter(year) {
    const loading = document.getElementById('loading');
    const container = document.getElementById('scatter-viz');
    
    // Afficher le loading
    loading.style.display = 'block';
    container.innerHTML = '';

    try {
        // 1. Charger et traiter les données
        const rawData = await processor.processScatterData(year, 1000);
        
        if (rawData.length === 0) {
            container.innerHTML = '<p class="error">❌ Aucune donnée disponible pour cette année</p>';
            loading.style.display = 'none';
            return;
        }

        // 2. Mapper les données
        const mappedData = mapper.mapForVisualization(rawData);

        // 3. Créer et afficher le graphique
        currentChart = new ScatterChart('scatter-viz', {
            width: 900,
            height: 600
        });
        
        currentChart.visualize(mappedData);

        // Masquer le loading
        loading.style.display = 'none';

    } catch (error) {
        console.error('❌ Erreur:', error);
        container.innerHTML = '<p class="error">❌ Erreur lors du chargement des données</p>';
        loading.style.display = 'none';
    }
}

// ============================================================================
// 5. INITIALISATION
// ============================================================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation du Scatter Plot...');

    // Charger l'année par défaut
    const yearSelect = document.getElementById('year-select');
    renderScatter(parseInt(yearSelect.value));

    // Écouter les changements d'année
    yearSelect.addEventListener('change', (e) => {
        const year = parseInt(e.target.value);
        console.log(`📅 Changement d'année: ${year}`);
        renderScatter(year);
    });
});
