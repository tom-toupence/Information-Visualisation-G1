import * as d3 from 'd3';
import { BaseChart } from './BaseChart';
import { ChartConfig } from '../types';
import { HeatmapCell } from '../processor/HeatmapProcessor';

export interface HeatmapConfig extends ChartConfig {
    cellSize?: number;
    tooltipEnabled?: boolean;
    zoomEnabled?: boolean;
}

export class HeatmapChart extends BaseChart<HeatmapCell> {
    private xScale!: d3.ScaleBand<string>;
    private yScale!: d3.ScaleBand<string>;
    private colorScale!: d3.ScaleThreshold<number, string>;
    private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    private years: number[] = [];
    private artists: string[] = [];
    private heatmapConfig: HeatmapConfig;
    private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;

    constructor(containerId: string, config: Partial<HeatmapConfig> = {}) {
        super(containerId, {
            width: 1200,
            height: 600,
            margin: { top: 60, right: 120, bottom: 60, left: 200 },
            animation: true,
            ...config
        });

        this.heatmapConfig = {
            cellSize: 30,
            tooltipEnabled: true,
            zoomEnabled: true,
            ...this.config
        };

        this.createTooltip();
        if (this.heatmapConfig.zoomEnabled) {
            this.setupZoom();
        }
    }

    private createTooltip(): void {
        // Supprimer le tooltip existant s'il existe
        d3.select('#heatmap-tooltip').remove();

        this.tooltip = d3.select('body')
            .append('div')
            .attr('id', 'heatmap-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0, 0, 0, 0.9)')
            .style('color', '#fff')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('max-width', '300px')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');
    }

    private setupZoom(): void {
        this.zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
    }

    protected createScales(): void {
        // Extraire les années et artistes uniques
        this.years = Array.from(new Set(this.data.map(d => d.year))).sort((a, b) => a - b);
        this.artists = Array.from(new Set(this.data.map(d => d.artist)));

        // Échelle X pour les années
        this.xScale = d3.scaleBand()
            .domain(this.years.map(String))
            .range([0, this.getInnerWidth()])
            .padding(0.05);

        // Échelle Y pour les artistes
        this.yScale = d3.scaleBand()
            .domain(this.artists)
            .range([0, this.getInnerHeight()])
            .padding(0.05);

        // Récupérer les couleurs depuis les variables CSS
        const rootStyles = getComputedStyle(document.documentElement);
        const colors = {
            noData: rootStyles.getPropertyValue('--heatmap-no-data').trim(),
            range0: rootStyles.getPropertyValue('--heatmap-0-20').trim(),
            range1: rootStyles.getPropertyValue('--heatmap-20-40').trim(),
            range2: rootStyles.getPropertyValue('--heatmap-40-60').trim(),
            range3: rootStyles.getPropertyValue('--heatmap-60-80').trim(),
            range4: rootStyles.getPropertyValue('--heatmap-80-100').trim()
        };

        // Échelle de couleurs basée sur la popularité
        this.colorScale = d3.scaleThreshold<number, string>()
            .domain([0, 20, 40, 60, 80, 100])
            .range([
                colors.noData,   // Pas de données
                colors.range0,   // 0-20
                colors.range1,   // 20-40
                colors.range2,   // 40-60
                colors.range3,   // 60-80
                colors.range4    // 80-100
            ]);
    }

    protected drawChart(): void {
        // Créer les cellules de la heatmap
        const cells = this.g.selectAll<SVGRectElement, HeatmapCell>('.heatmap-cell')
            .data(this.data, d => `${d.artist}-${d.year}`);

        // Enter
        const cellsEnter = cells.enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => this.xScale(String(d.year)) || 0)
            .attr('y', d => this.yScale(d.artist) || 0)
            .attr('width', this.xScale.bandwidth())
            .attr('height', this.yScale.bandwidth())
            .attr('fill', '#2c3e50')
            .attr('stroke', '#1a1a1a')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .attr('rx', 2)
            .attr('ry', 2);

        // Merge enter + update
        const cellsUpdate = cellsEnter.merge(cells);

        // Transition de couleur
        if (this.config.animation) {
            cellsUpdate.transition()
                .duration(750)
                .attr('fill', d => this.colorScale(d.avg_popularity))
                .attr('x', d => this.xScale(String(d.year)) || 0)
                .attr('y', d => this.yScale(d.artist) || 0)
                .attr('width', this.xScale.bandwidth())
                .attr('height', this.yScale.bandwidth());
        } else {
            cellsUpdate
                .attr('fill', d => this.colorScale(d.avg_popularity))
                .attr('x', d => this.xScale(String(d.year)) || 0)
                .attr('y', d => this.yScale(d.artist) || 0)
                .attr('width', this.xScale.bandwidth())
                .attr('height', this.yScale.bandwidth());
        }

        // Events
        cellsUpdate
            .on('mouseover', (event, d) => this.onCellHover(event, d))
            .on('mouseout', (event, d) => this.onCellLeave(event, d))
            .on('click', (event, d) => this.onCellClick(event, d));

        // Exit
        cells.exit()
            .transition()
            .duration(500)
            .attr('opacity', 0)
            .remove();

        // Ajouter une légende
        this.drawLegend();
    }

    protected drawAxes(): void {
        // Axe X (années)
        this.g.select('.x-axis').remove();
        this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.getInnerHeight()})`)
            .call(d3.axisBottom(this.xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-0.8em')
            .attr('dy', '0.15em')
            .attr('transform', 'rotate(-45)')
            .style('fill', '#e2e2e2')
            .style('font-size', '11px');

        // Styling de l'axe X
        this.g.select('.x-axis')
            .select('.domain')
            .style('stroke', '#535353');

        this.g.select('.x-axis')
            .selectAll('.tick line')
            .style('stroke', '#535353');

        // Axe Y (artistes)
        this.g.select('.y-axis').remove();
        this.g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(this.yScale))
            .selectAll('text')
            .style('fill', '#e2e2e2')
            .style('font-size', '11px')
            .style('cursor', 'pointer')
            .on('click', (event, artist) => {
                console.log('Artiste sélectionné:', artist);
                // Possibilité d'ajouter un filtre ou zoom sur cet artiste
            });

        // Styling de l'axe Y
        this.g.select('.y-axis')
            .select('.domain')
            .style('stroke', '#535353');

        this.g.select('.y-axis')
            .selectAll('.tick line')
            .style('stroke', '#535353');

        // Titre
        this.g.select('.chart-title').remove();
        this.g.append('text')
            .attr('class', 'chart-title')
            .attr('x', this.getInnerWidth() / 2)
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Popularité des artistes par année');

        // Label axe X
        this.g.select('.x-label').remove();
        this.g.append('text')
            .attr('class', 'x-label')
            .attr('x', this.getInnerWidth() / 2)
            .attr('y', this.getInnerHeight() + 50)
            .attr('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '12px')
            .text('Année');

        // Label axe Y
        this.g.select('.y-label').remove();
        this.g.append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.getInnerHeight() / 2)
            .attr('y', -140)
            .attr('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '12px')
            .text('Artiste');
    }

    private drawLegend(): void {
        const legendWidth = 100;
        const legendHeight = 200;
        const legendX = this.getInnerWidth() + 20;
        const legendY = 0;

        // Supprimer la légende existante
        this.g.select('.legend').remove();

        const legend = this.g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Titre de la légende
        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('fill', '#e2e2e2')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Popularité');

        // Récupérer les couleurs depuis CSS
        const rootStyles = getComputedStyle(document.documentElement);
        
        // Définir les données de la légende avec les couleurs CSS
        const legendData = [
            { color: rootStyles.getPropertyValue('--heatmap-80-100').trim(), label: '80-100' },
            { color: rootStyles.getPropertyValue('--heatmap-60-80').trim(), label: '60-80' },
            { color: rootStyles.getPropertyValue('--heatmap-40-60').trim(), label: '40-60' },
            { color: rootStyles.getPropertyValue('--heatmap-20-40').trim(), label: '20-40' },
            { color: rootStyles.getPropertyValue('--heatmap-0-20').trim(), label: '0-20' },
            { color: rootStyles.getPropertyValue('--heatmap-no-data').trim(), label: 'Pas de données' }
        ];

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 35 + 20})`);

        legendItems.append('rect')
            .attr('width', 25)
            .attr('height', 25)
            .attr('fill', d => d.color)
            .attr('stroke', '#1a1a1a')
            .attr('stroke-width', 1)
            .attr('rx', 2);

        legendItems.append('text')
            .attr('x', 32)
            .attr('y', 17)
            .style('fill', '#e2e2e2')
            .style('font-size', '10px')
            .text(d => d.label);
    }

    protected updateChart(): void {
        this.createScales();
        this.drawChart();
        this.drawAxes();
    }

    private onCellHover(event: MouseEvent, d: HeatmapCell): void {
        // Mettre en surbrillance la cellule
        d3.select(event.currentTarget as SVGRectElement)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        // Afficher le tooltip
        if (this.heatmapConfig.tooltipEnabled) {
            const topSongs = d.popular_songs
                .slice(0, 5)
                .map((song, i) => 
                    `${i + 1}. ${song.track_name} (${song.popularity})`
                )
                .join('<br/>');

            const tooltipContent = `
                <div style="font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #555; padding-bottom: 6px;">
                    ${d.artist} - ${d.year}
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>Rang:</strong> ${d.rank} / 4
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>Popularité moyenne:</strong> ${d.avg_popularity}
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>Nombre de chansons:</strong> ${d.track_count}
                </div>
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #555;">
                    <strong>Top chansons:</strong><br/>
                    <div style="margin-top: 4px; font-size: 11px;">
                        ${topSongs}
                    </div>
                </div>
            `;

            this.tooltip
                .html(tooltipContent)
                .style('visibility', 'visible')
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`);
        }
    }

    private onCellLeave(event: MouseEvent, d: HeatmapCell): void {
        // Retirer la surbrillance
        d3.select(event.currentTarget as SVGRectElement)
            .attr('stroke', '#1a1a1a')
            .attr('stroke-width', 1);

        // Cacher le tooltip
        this.tooltip.style('visibility', 'hidden');
    }

    private onCellClick(event: MouseEvent, d: HeatmapCell): void {
        console.log('Cellule cliquée:', d);
        
        // Afficher un modal ou un panneau détaillé avec les chansons
        this.showDetailedView(d);
    }

    private showDetailedView(data: HeatmapCell): void {
        // Créer un modal pour afficher les détails
        d3.select('#detail-modal').remove();

        const modal = d3.select('body')
            .append('div')
            .attr('id', 'detail-modal')
            .style('position', 'fixed')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('background-color', 'var(--bg-light, #353a50)')
            .style('padding', '30px')
            .style('border-radius', '15px')
            .style('box-shadow', '0 10px 40px rgba(0,0,0,0.5)')
            .style('z-index', '2000')
            .style('max-width', '500px')
            .style('max-height', '80vh')
            .style('overflow-y', 'auto')
            .style('color', 'var(--text, #e2e2e2)');

        // Titre
        modal.append('h2')
            .style('margin-top', '0')
            .style('color', 'var(--accent-1, #6eb6ff)')
            .text(`${data.artist} - ${data.year}`);

        // Statistiques
        modal.append('div')
            .style('margin-bottom', '20px')
            .html(`
                <p><strong>Rang de popularité:</strong> ${data.rank} / 4</p>
                <p><strong>Popularité moyenne:</strong> ${data.avg_popularity}</p>
                <p><strong>Nombre total de chansons:</strong> ${data.track_count}</p>
            `);

        // Liste des chansons populaires
        modal.append('h3')
            .style('color', 'var(--accent-2, #ff6ad5)')
            .text('Top chansons:');

        const songsList = modal.append('ol')
            .style('padding-left', '20px');

        data.popular_songs.forEach(song => {
            songsList.append('li')
                .style('margin-bottom', '8px')
                .html(`
                    <strong>${song.track_name}</strong>
                    <br/>
                    <span style="color: var(--accent-4, #5be7a9); font-size: 12px;">
                        Popularité: ${song.popularity}
                    </span>
                `);
        });

        // Bouton de fermeture
        modal.append('button')
            .style('margin-top', '20px')
            .style('padding', '10px 20px')
            .style('background-color', 'var(--violet, #7972a8)')
            .style('color', '#fff')
            .style('border', 'none')
            .style('border-radius', '8px')
            .style('cursor', 'pointer')
            .style('font-size', '14px')
            .text('Fermer')
            .on('click', () => {
                modal.remove();
            });

        // Fond semi-transparent
        d3.select('body')
            .append('div')
            .attr('id', 'modal-backdrop')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('background-color', 'rgba(0, 0, 0, 0.7)')
            .style('z-index', '1999')
            .on('click', () => {
                modal.remove();
                d3.select('#modal-backdrop').remove();
            });
    }

    public destroy(): void {
        this.tooltip.remove();
        d3.select('#detail-modal').remove();
        d3.select('#modal-backdrop').remove();
        super.destroy();
    }

    public resetZoom(): void {
        if (this.heatmapConfig.zoomEnabled && this.zoom) {
            this.svg.transition()
                .duration(750)
                .call(this.zoom.transform, d3.zoomIdentity);
        }
    }
}
