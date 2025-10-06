import * as d3 from 'd3';
import { ChartConfig, ChartMargin } from '../types';

export abstract class BaseChart<T = any> {
    protected svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    protected g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    protected data: T[];
    protected config: ChartConfig;
    protected margin: ChartMargin;

    constructor(containerId: string, config: Partial<ChartConfig> = {}) {
        this.config = {
            width: 400,
            height: 300,
            margin: { top: 20, right: 30, bottom: 40, left: 40 },
            color: 'steelblue',
            animation: true,
            ...config
        };

        this.margin = this.config.margin;
        this.data = [];

        // Créer le conteneur SVG
        this.svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', this.config.width)
            .attr('height', this.config.height);

        // Groupe principal avec marges
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    }

    // Méthodes à implémenter par les classes filles
    protected abstract createScales(): void;
    protected abstract drawChart(): void;
    protected abstract drawAxes(): void;
    protected abstract updateChart(): void;

    // Méthodes utilitaires
    protected getInnerWidth(): number {
        return this.config.width - this.margin.left - this.margin.right;
    }

    protected getInnerHeight(): number {
        return this.config.height - this.margin.top - this.margin.bottom;
    }

    // API publique
    public setData(data: T[]): this {
        this.data = data;
        return this;
    }

    public render(): this {
        this.createScales();
        this.drawChart();
        this.drawAxes();
        return this;
    }

    public update(newData: T[]): this {
        this.data = newData;
        this.updateChart();
        return this;
    }

    public resize(width: number, height: number): this {
        this.config.width = width;
        this.config.height = height;

        this.svg
            .attr('width', width)
            .attr('height', height);

        this.g.attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        this.render();
        return this;
    }

    public destroy(): void {
        this.svg.remove();
    }

    // Méthodes d'événements
    protected onElementClick(event: MouseEvent, d: T): void {
        console.log('Element clicked:', d);
    }

    protected onElementHover(event: MouseEvent, d: T): void {
        // Override dans les classes filles
    }

    protected onElementLeave(event: MouseEvent, d: T): void {
        // Override dans les classes filles
    }
}

// Exemple d'implémentation: BarChart simple pour les genres
export class GenreBarChart extends BaseChart<{ genre: string, count: number }> {
    private xScale!: d3.ScaleBand<string>;
    private yScale!: d3.ScaleLinear<number, number>;

    protected createScales(): void {
        this.xScale = d3.scaleBand()
            .domain(this.data.map(d => d.genre))
            .range([0, this.getInnerWidth()])
            .padding(0.1);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.count) || 0])
            .nice()
            .range([this.getInnerHeight(), 0]);
    }

    protected drawChart(): void {
        const bars = this.g.selectAll<SVGRectElement, { genre: string, count: number }>('.bar')
            .data(this.data, d => d.genre);

        // Enter
        const barsEnter = bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.genre) || 0)
            .attr('y', this.getInnerHeight())
            .attr('width', this.xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', this.config.color || 'steelblue')
            .style('cursor', 'pointer');

        // Update + Enter
        const barsUpdate = barsEnter.merge(bars);

        if (this.config.animation) {
            barsUpdate.transition()
                .duration(750)
                .attr('x', d => this.xScale(d.genre) || 0)
                .attr('y', d => this.yScale(d.count))
                .attr('width', this.xScale.bandwidth())
                .attr('height', d => this.getInnerHeight() - this.yScale(d.count));
        } else {
            barsUpdate
                .attr('x', d => this.xScale(d.genre) || 0)
                .attr('y', d => this.yScale(d.count))
                .attr('width', this.xScale.bandwidth())
                .attr('height', d => this.getInnerHeight() - this.yScale(d.count));
        }

        // Events
        barsUpdate
            .on('click', this.onElementClick.bind(this))
            .on('mouseover', this.onElementHover.bind(this))
            .on('mouseout', this.onElementLeave.bind(this));

        // Exit
        bars.exit()
            .transition()
            .duration(500)
            .attr('height', 0)
            .attr('y', this.getInnerHeight())
            .remove();
    }

    protected drawAxes(): void {
        // X Axis
        this.g.select('.x-axis').remove();
        this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.getInnerHeight()})`)
            .call(d3.axisBottom(this.xScale));

        // Y Axis
        this.g.select('.y-axis').remove();
        this.g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(this.yScale));
    }

    protected updateChart(): void {
        this.createScales();
        this.drawChart();
        this.drawAxes();
    }

    protected onElementHover(event: MouseEvent, d: { genre: string, count: number }): void {
        d3.select(event.currentTarget as SVGRectElement)
            .attr('fill', '#ff6b6b');

        // Ici on pourrait ajouter un tooltip
        console.log(`Genre: ${d.genre}, Count: ${d.count}`);
    }

    protected onElementLeave(event: MouseEvent, d: { genre: string, count: number }): void {
        d3.select(event.currentTarget as SVGRectElement)
            .attr('fill', this.config.color || 'steelblue');
    }
}