import * as d3 from 'd3';
import { MappedScatterData } from '../mappers/ScatterMapper';

export class ScatterVisualizer {
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private width: number;
    private height: number;
    private margin = { top: 20, right: 20, bottom: 40, left: 40 };

    constructor(containerId: string, width: number = 800, height: number = 600) {
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        // Créer le SVG
        this.svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    }

    /**
     * Visualise les données scatter
     */
    visualize(data: MappedScatterData[]): void {
        // Nettoyer le SVG
        this.svg.selectAll('*').remove();

        // Créer le groupe principal
        const g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Créer les échelles
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.width]);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height, 0]);

        // Créer les axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        // Ajouter l'axe X
        g.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(xAxis);

        // Ajouter l'axe Y
        g.append('g')
            .call(yAxis);

        // Labels des axes
        g.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height + 35})`)
            .style('text-anchor', 'middle')
            .text('Danceability (%)');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Energy (%)');

        // Créer les cercles
        const circles = g.selectAll('.scatter-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'scatter-dot')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', d => d.size)
            .attr('fill', d => d.color)
            .attr('opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        // Ajouter l'interactivité
        this.addInteractivity(circles);

        console.log(`📊 Visualisation créée avec ${data.length} points`);
    }

    /**
     * Ajoute l'interactivité (hover, tooltip)
     */
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
                    <strong>${d.metadata.track_name}</strong><br/>
                    ${d.metadata.artist_name}<br/>
                    Genre: ${d.metadata.genre}<br/>
                    Popularity: ${d.metadata.popularity}<br/>
                    Danceability: ${(d.metadata.danceability * 100).toFixed(1)}%<br/>
                    Energy: ${(d.metadata.energy * 100).toFixed(1)}%
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
     * Ajoute une légende pour les genres
     */
    addLegend(data: MappedScatterData[]): void {
        const genres = [...new Set(data.map(d => d.metadata.genre))];
        const legendData = genres.map(genre => ({
            genre,
            color: data.find(d => d.metadata.genre === genre)?.color || '#999'
        }));

        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width + this.margin.left - 150}, ${this.margin.top})`);

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData.slice(0, 10)) // Limiter à 10 genres max
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);

        legendItems.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 6)
            .attr('fill', d => d.color);

        legendItems.append('text')
            .attr('x', 12)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(d => d.genre);
    }
}