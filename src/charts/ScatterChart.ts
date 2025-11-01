import * as d3 from 'd3';
import { MappedScatterData } from '../mappers/ScatterMapper.js';
import { SpotifyTrack } from '../types/index.js';

export class ScatterChart {
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private width: number;
    private height: number;
    private margin = { top: 20, right: 20, bottom: 40, left: 40 };
    private containerId: string;
    private data: MappedScatterData[] = [];
    private options: any;

    constructor(containerId: string, options: {width?: number, height?: number, xLabel?: string, yLabel?: string} = {}) {
        this.containerId = containerId;
        this.options = options;
        const width = options.width || 800;
        const height = options.height || 600;
        
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        // Créer le SVG
        this.svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    }

    // Méthode pour définir les données (compatible avec le Dashboard)
    setData(rawData: Array<{x: number, y: number, label: string, genre: string}>): this {
        // Convertir les données au format MappedScatterData
        this.data = rawData.map((track, i) => ({
            id: `${track.label}-${i}`,
            label: track.label,
            x: track.x * 100, // Convertir en pourcentage si nécessaire
            y: track.y * 100, // Convertir en pourcentage si nécessaire
            size: 5,
            color: this.getGenreColor(track.genre),
            metadata: {
                track_name: track.label,
                artist_name: '', // Ajoutez si disponible
                genre: track.genre,
                popularity: 0, // Ajoutez si disponible
                danceability: track.y,
                energy: track.x
            }
        }));
        return this;
    }

    // Méthode render (compatible avec le Dashboard)
    render(): this {
        this.visualize(this.data);
        return this;
    }

    // Méthode update (compatible avec le Dashboard)
    update(rawData: Array<{x: number, y: number, label: string, genre: string}>): this {
        this.setData(rawData);
        this.render();
        return this;
    }

    // Fonction pour obtenir une couleur par genre
    private getGenreColor(genre: string): string {
        const colors = {
            'pop': '#ff6b6b',
            'rock': '#4ecdc4', 
            'hip hop': '#45b7d1',
            'jazz': '#96ceb4',
            'classical': '#ffeaa7',
            'electronic': '#dda0dd',
            'country': '#98d8c8',
            'r&b': '#fdcb6e'
        };
        return colors[genre.toLowerCase() as keyof typeof colors] || '#95a5a6';
    }

    visualize(data: MappedScatterData[]): void {
        this.svg.selectAll('*').remove();
        this.data = data;

        // Créer le groupe principal
        const g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Créer les échelles (0-1 pour danceability et energy)
        const xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.height, 0])
            .nice();

        // Créer les axes avec style
        const xAxis = d3.axisBottom(xScale).ticks(10);
        const yAxis = d3.axisLeft(yScale).ticks(10);

        // Ajouter l'axe X
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(xAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2');

        // Ajouter l'axe Y
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2');
        
        // Style des lignes d'axes
        g.selectAll('.x-axis path, .y-axis path, .x-axis line, .y-axis line')
            .style('stroke', '#535353');

        // Labels des axes avec meilleure visibilité
        g.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height + 35})`)
            .style('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text(this.options.xLabel || 'Danceability →');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 5)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text(this.options.yLabel || '← Energy');

        // Créer les cercles (gris par défaut, colorés au brush)
        const circles = g.selectAll('.scatter-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'scatter-dot')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 0)
            .attr('fill', '#666') // Gris par défaut
            .attr('opacity', 0)
            .attr('stroke', '#444')
            .attr('stroke-width', 0.5)
            .attr('data-color', d => d.color); // Stocker la couleur pour le brush

        // Animation d'apparition
        circles.transition()
            .duration(500)
            .delay((d, i) => Math.min(i * 0.5, 100))
            .attr('r', d => d.size)
            .attr('opacity', 0.4);

        // Ajouter l'interactivité (hover)
        this.addInteractivity(circles);

        // Ajouter le brush
        this.addBrush(g, circles, xScale, yScale, data);

        console.log(`📊 Visualisation créée avec ${data.length} points`);
    }

    // Tooltip et interactions
    private addInteractivity(circles: d3.Selection<SVGCircleElement, MappedScatterData, SVGGElement, unknown>): void {
        // Créer le tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'scatter-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        circles
            .on('mouseover', (event, d) => {
                // Agrandir le cercle
                d3.select(event.currentTarget)
                    .transition()
                    .duration(100)
                    .attr('r', d.size * 1.5)
                    .attr('opacity', 1);

                // Afficher le tooltip
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
                // Remettre la taille normale
                d3.select(event.currentTarget)
                    .transition()
                    .duration(100)
                    .attr('r', d.size)
                    .attr('opacity', 0.7);

                // Cacher le tooltip
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    /**
     * Ajoute une légende pour la popularité (dégradé de couleur)
     */
    addPopularityLegend(): void {
        // Supprimer la légende existante
        this.svg.selectAll('.popularity-legend').remove();
        
        const legendWidth = 20;
        const legendHeight = 200;
        const legendX = this.width + this.margin.left + 40;
        const legendY = this.margin.top + 50;
        
        // Créer le dégradé
        const defs = this.svg.select('defs').empty() ? this.svg.append('defs') : this.svg.select('defs');
        
        defs.select('#popularity-gradient').remove();
        
        const linearGradient = defs.append('linearGradient')
            .attr('id', 'popularity-gradient')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');

        // Ajouter les stops du dégradé (Viridis)
        const steps = [0, 25, 50, 75, 100];
        steps.forEach(step => {
            linearGradient.append('stop')
                .attr('offset', `${step}%`)
                .attr('stop-color', d3.interpolateViridis(step / 100));
        });

        const legend = this.svg.append('g')
            .attr('class', 'popularity-legend')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Titre de la légende
        legend.append('text')
            .attr('x', 0)
            .attr('y', -20)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', '#e2e2e2')
            .text('Popularité');

        // Rectangle avec le dégradé
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#popularity-gradient)')
            .style('stroke', '#555')
            .style('stroke-width', '1px');

        // Échelle pour les labels
        const legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickFormat(d => `${d}`);

        legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', `translate(${legendWidth}, 0)`)
            .call(legendAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2')
            .style('font-size', '11px');

        legend.select('.legend-axis .domain')
            .style('stroke', '#555');

        legend.select('.legend-axis').selectAll('.tick line')
            .style('stroke', '#555');
    }

    /**
     * Ajoute un brush pour la sélection interactive
     */
    private addBrush(
        g: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
        circles: d3.Selection<SVGCircleElement, MappedScatterData, SVGGElement, unknown>,
        xScale: d3.ScaleLinear<number, number>,
        yScale: d3.ScaleLinear<number, number>,
        data: MappedScatterData[]
    ): void {
        // Créer le panel de statistiques (caché par défaut)
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
            .extent([[0, 0], [this.width, this.height]])
            .on('start brush end', (event) => {
                const selection = event.selection;
                
                if (!selection) {
                    // Aucune sélection : remettre tous les points en gris
                    circles
                        .attr('fill', '#666')
                        .attr('opacity', 0.4)
                        .attr('stroke-width', 0.5);
                    
                    statsPanel.style('display', 'none');
                    return;
                }

                const [[x0, y0], [x1, y1]] = selection;
                
                // Sélectionner les points dans le brush
                let selectedData: MappedScatterData[] = [];
                
                circles.each(function(d) {
                    const cx = xScale(d.x);
                    const cy = yScale(d.y);
                    const isSelected = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
                    
                    if (isSelected) {
                        selectedData.push(d);
                        // Colorer selon la popularité + highlight
                        d3.select(this)
                            .attr('fill', d.color)
                            .attr('opacity', 0.9)
                            .attr('stroke', '#fff')
                            .attr('stroke-width', 1.5);
                    } else {
                        // Remettre en gris les points non sélectionnés
                        d3.select(this)
                            .attr('fill', '#666')
                            .attr('opacity', 0.2)
                            .attr('stroke-width', 0.5);
                    }
                });

                // Afficher les statistiques
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
     * Met à jour le panel de statistiques avec les données sélectionnées
     */
    private updateStatsPanel(
        panel: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
        selectedData: MappedScatterData[],
        totalCount: number
    ): void {
        const count = selectedData.length;
        const avgPopularity = d3.mean(selectedData, d => d.metadata.popularity) || 0;
        const avgEnergy = d3.mean(selectedData, d => d.metadata.energy) || 0;
        const avgDanceability = d3.mean(selectedData, d => d.metadata.danceability) || 0;
        const avgTempo = d3.mean(selectedData, d => d.metadata.tempo || 0) || 0;

        // Compter les artistes
        const artistCounts = new Map<string, number>();
        selectedData.forEach(d => {
            const artist = d.metadata.artist_name;
            artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
        });

        // Top 3 artistes
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