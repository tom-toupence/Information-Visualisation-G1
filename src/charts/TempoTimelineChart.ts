import * as d3 from 'd3';
import { BaseChart } from './BaseChart';
import { ChartConfig, SpotifyTrack } from '../types';

/**
 * Chart Timeline Tempo - Timeline horizontale pour explorer les tempos
 * Zoom adaptatif basé sur la popularité des morceaux
 */
export class TempoTimelineChart extends BaseChart<SpotifyTrack> {
    private tempoScale!: d3.ScaleLinear<number, number>;
    private currentTempo: number = 120; // Tempo de référence
    private viewportMin: number = 110; // Début de la fenêtre visible
    private viewportMax: number = 130; // Fin de la fenêtre visible
    private zoomLevel: number = 1; // 1 = zoom par défaut, plus grand = plus zoomé
    private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    private timelineHeight: number = 80; // Hauteur de la timeline centrale

    constructor(containerId: string, config: Partial<ChartConfig> = {}) {
        super(containerId, {
            height: 150, // Plus petit, timeline horizontale
            ...config
        });
        this.createTooltip();
        this.setupInteractions();
    }

    private createTooltip(): void {
        // Supprimer le tooltip existant s'il y en a un
        d3.select('body').select('.tempo-tooltip').remove();
        
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tempo-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '6px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '1000');
    }

    private setupInteractions(): void {
        // Gestion du zoom avec la molette
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 10]) // Min/Max zoom
            .on('zoom', (event) => {
                this.handleZoom(event);
            });

        this.svg.call(zoom);

        // Gestion du scroll horizontal avec les flèches
        d3.select('body').on('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                this.pan(-5);
            } else if (event.key === 'ArrowRight') {
                this.pan(5);
            }
        });
    }

    private handleZoom(event: d3.D3ZoomEvent<SVGSVGElement, unknown>): void {
        const transform = event.transform;
        this.zoomLevel = transform.k;
        
        // Recalculer la fenêtre visible
        const currentRange = this.viewportMax - this.viewportMin;
        const newRange = (20 / this.zoomLevel); // Plus on zoome, plus la plage est petite
        
        const center = (this.viewportMin + this.viewportMax) / 2;
        this.viewportMin = center - newRange / 2;
        this.viewportMax = center + newRange / 2;
        
        this.updateChart();
    }

    private pan(deltaTempo: number): void {
        this.viewportMin += deltaTempo;
        this.viewportMax += deltaTempo;
        
        // Contraintes
        if (this.viewportMin < 60) {
            this.viewportMax += 60 - this.viewportMin;
            this.viewportMin = 60;
        }
        if (this.viewportMax > 200) {
            this.viewportMin -= this.viewportMax - 200;
            this.viewportMax = 200;
        }
        
        this.updateChart();
    }

    public setCurrentTempo(tempo: number): this {
        this.currentTempo = tempo;
        // Centrer la vue sur le nouveau tempo
        const range = this.viewportMax - this.viewportMin;
        this.viewportMin = tempo - range / 2;
        this.viewportMax = tempo + range / 2;
        return this;
    }

    protected createScales(): void {
        // Échelle pour la fenêtre visible
        this.tempoScale = d3.scaleLinear()
            .domain([this.viewportMin, this.viewportMax])
            .range([0, this.getInnerWidth()]);
    }

    protected drawChart(): void {
        // Obtenir les morceaux à afficher selon le zoom
        const tracksToShow = this.getTracksForCurrentView();

        // Nettoyer
        this.g.selectAll('*').remove();

        // Ligne de base de la timeline
        this.g.append('line')
            .attr('class', 'timeline-base')
            .attr('x1', 0)
            .attr('x2', this.getInnerWidth())
            .attr('y1', this.timelineHeight)
            .attr('y2', this.timelineHeight)
            .attr('stroke', '#ddd')
            .attr('stroke-width', 3);

        // Ligne de référence pour le tempo actuel (si visible)
        if (this.currentTempo >= this.viewportMin && this.currentTempo <= this.viewportMax) {
            this.g.append('line')
                .attr('class', 'tempo-reference-line')
                .attr('x1', this.tempoScale(this.currentTempo))
                .attr('x2', this.tempoScale(this.currentTempo))
                .attr('y1', 20)
                .attr('y2', this.getInnerHeight() - 20)
                .attr('stroke', '#ff6b6b')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '5,5');
        }

        // Grouper les morceaux par position pour éviter les superpositions
        const tracksByPosition = this.arrangeTracksOnTimeline(tracksToShow);

        // Créer les groupes de morceaux
        const trackGroups = this.g.selectAll('.track-group')
            .data(tracksByPosition)
            .enter()
            .append('g')
            .attr('class', 'track-group')
            .attr('transform', d => `translate(${this.tempoScale(d.tempo)}, 0)`);

        // Ajouter les points sur la timeline
        trackGroups.each((d, i, nodes) => {
            const group = d3.select(nodes[i]);
            
            d.tracks.forEach((track, index) => {
                const y = this.timelineHeight + (index - d.tracks.length/2) * 25;
                
                // Point principal
                group.append('circle')
                    .attr('class', 'tempo-point')
                    .attr('cx', 0)
                    .attr('cy', y)
                    .attr('r', Math.max(4, track.popularity / 15))
                    .attr('fill', this.getGenreColor(track.genre))
                    .attr('stroke', '#white')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .datum(track)
                    .on('click', this.onElementClick.bind(this))
                    .on('mouseover', this.onElementHover.bind(this))
                    .on('mouseout', this.onElementLeave.bind(this));

                // Ligne de connexion à la timeline
                group.append('line')
                    .attr('x1', 0)
                    .attr('x2', 0)
                    .attr('y1', this.timelineHeight)
                    .attr('y2', y)
                    .attr('stroke', this.getGenreColor(track.genre))
                    .attr('stroke-width', 1)
                    .attr('opacity', 0.6);

                // Label si assez zoomé
                if (this.zoomLevel > 2) {
                    group.append('text')
                        .attr('class', 'track-label')
                        .attr('x', 0)
                        .attr('y', y - 8)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '10px')
                        .attr('fill', '#333')
                        .text(`${track.artist_name} - ${track.track_name}`)
                        .style('pointer-events', 'none');
                }
            });
        });
    }

    protected drawAxes(): void {
        // Axe X uniquement (Tempo) - en bas
        this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.getInnerHeight() - 10})`)
            .call(d3.axisBottom(this.tempoScale)
                .tickFormat(d => `${d} BPM`)
                .tickSize(-this.getInnerHeight() + 20)
            )
            .selectAll('.tick line')
            .attr('stroke', '#f0f0f0')
            .attr('stroke-width', 1);

        // Label de l'axe
        this.g.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.getInnerWidth() / 2)
            .attr('y', this.getInnerHeight() + 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#666')
            .text(`Tempo (BPM) - Zoom: ${this.zoomLevel.toFixed(1)}x`);
    }

    // Méthodes utilitaires pour la timeline

    private getTracksForCurrentView(): SpotifyTrack[] {
        // Filtrer par plage de tempo visible
        const visibleTracks = this.data.filter(track => 
            track.tempo >= this.viewportMin && track.tempo <= this.viewportMax
        );

        // Calculer le seuil de popularité selon le zoom
        const pixelsPerBPM = this.getInnerWidth() / (this.viewportMax - this.viewportMin);
        const popularityThreshold = Math.max(30, 80 - (pixelsPerBPM * 2));

        // Filtrer et trier par popularité
        return visibleTracks
            .filter(track => track.popularity >= popularityThreshold)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, Math.floor(pixelsPerBPM * (this.viewportMax - this.viewportMin) / 5)); // Limite selon l'espace
    }

    private arrangeTracksOnTimeline(tracks: SpotifyTrack[]): Array<{ tempo: number; tracks: SpotifyTrack[] }> {
        // Grouper les morceaux par tempo (arrondi à 0.5 BPM près)
        const grouped = new Map<number, SpotifyTrack[]>();
        
        tracks.forEach(track => {
            const roundedTempo = Math.round(track.tempo * 2) / 2; // Arrondi à 0.5 près
            if (!grouped.has(roundedTempo)) {
                grouped.set(roundedTempo, []);
            }
            grouped.get(roundedTempo)!.push(track);
        });

        // Convertir en array avec tri par popularité dans chaque groupe
        return Array.from(grouped.entries()).map(([tempo, tracks]) => ({
            tempo,
            tracks: tracks.sort((a, b) => b.popularity - a.popularity)
        }));
    }

    protected updateChart(): void {
        this.createScales();
        this.drawChart();
        this.drawAxes();
    }

    private getGenreColor(genre: string): string {
        const colors: { [key: string]: string } = {
            'pop': '#ff6b6b',
            'rock': '#4ecdc4',
            'hip-hop': '#45b7d1',
            'rap': '#96ceb4',
            'electro': '#feca57',
            'electronic': '#feca57',
            'acoustic': '#ff9ff3',
            'funk': '#54a0ff',
            'r&b': '#5f27cd',
            'indie': '#00d2d3',
            'country': '#ff9f43',
            'jazz': '#10ac84',
            'blues': '#2e86de',
            'classical': '#a55eea'
        };
        return colors[genre.toLowerCase()] || '#ddd';
    }

    protected onElementHover(event: MouseEvent, d: SpotifyTrack): void {
        // Agrandir le point
        d3.select(event.currentTarget as SVGCircleElement)
            .transition()
            .duration(200)
            .attr('r', Math.max(8, d.popularity / 12))
            .attr('stroke-width', 3);

        // Afficher le tooltip
        this.tooltip
            .style('opacity', 1)
            .html(`
                <strong>${d.track_name}</strong><br/>
                <span style="color: #1db954;">${d.artist_name}</span><br/>
                <span style="color: #ff6b6b;">🎵 ${Math.round(d.tempo)} BPM</span><br/>
                ⭐ Popularité: ${d.popularity}%<br/>
                🎶 Genre: ${d.genre}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    protected onElementLeave(event: MouseEvent, d: SpotifyTrack): void {
        // Remettre la taille normale
        d3.select(event.currentTarget as SVGCircleElement)
            .transition()
            .duration(200)
            .attr('r', Math.max(4, d.popularity / 15))
            .attr('stroke-width', 2);

        // Cacher le tooltip
        this.tooltip.style('opacity', 0);
    }

    protected onElementClick(event: MouseEvent, d: SpotifyTrack): void {
        console.log('🎵 Morceau sélectionné pour transition:', d);
        
        // Mettre à jour le tempo de référence
        this.setCurrentTempo(d.tempo);
        
        // Effet visuel de sélection
        d3.select(event.currentTarget as SVGCircleElement)
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 4);
            
        setTimeout(() => {
            this.updateChart();
        }, 300);
    }

    // Méthodes publiques pour contrôler la navigation

    public zoomIn(): void {
        this.zoomLevel = Math.min(10, this.zoomLevel * 1.5);
        const currentRange = this.viewportMax - this.viewportMin;
        const newRange = currentRange / 1.5;
        const center = (this.viewportMin + this.viewportMax) / 2;
        
        this.viewportMin = center - newRange / 2;
        this.viewportMax = center + newRange / 2;
        this.updateChart();
    }

    public zoomOut(): void {
        this.zoomLevel = Math.max(0.5, this.zoomLevel / 1.5);
        const currentRange = this.viewportMax - this.viewportMin;
        const newRange = currentRange * 1.5;
        const center = (this.viewportMin + this.viewportMax) / 2;
        
        this.viewportMin = Math.max(60, center - newRange / 2);
        this.viewportMax = Math.min(200, center + newRange / 2);
        this.updateChart();
    }

    public scrollLeft(): void {
        this.pan(-5);
    }

    public scrollRight(): void {
        this.pan(5);
    }

    public jumpToTempo(tempo: number): void {
        const range = this.viewportMax - this.viewportMin;
        this.viewportMin = Math.max(60, tempo - range / 2);
        this.viewportMax = Math.min(200, tempo + range / 2);
        this.updateChart();
    }

    public getViewportInfo() {
        return {
            min: this.viewportMin,
            max: this.viewportMax,
            zoom: this.zoomLevel,
            currentTempo: this.currentTempo,
            tracksVisible: this.getTracksForCurrentView().length
        };
    }

    public destroy(): void {
        this.tooltip.remove();
        super.destroy();
    }
}