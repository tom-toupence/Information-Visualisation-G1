import * as d3 from 'd3';

interface DataPoint {
    name: string;
    value: number;
}

class Visualization {
    private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private data: DataPoint[];

    constructor(containerId: string, width: number = 400, height: number = 300) {
        this.svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        this.data = [
            { name: 'A', value: 30 },
            { name: 'B', value: 80 },
            { name: 'C', value: 45 },
            { name: 'D', value: 60 },
            { name: 'E', value: 20 }
        ];

        this.init();
    }

    private init(): void {
        this.createSimpleChart();
    }

    private createSimpleChart(): void {
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const width = +this.svg.attr('width') - margin.left - margin.right;
        const height = +this.svg.attr('height') - margin.top - margin.bottom;

        const g = this.svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Échelles
        const xScale = d3.scaleBand()
            .domain(this.data.map((d: DataPoint) => d.name))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, (d: DataPoint) => d.value) || 0])
            .range([height, 0]);

        // Barres
        g.selectAll('.bar')
            .data(this.data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', (d: DataPoint) => xScale(d.name) || 0)
            .attr('y', (d: DataPoint) => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', (d: DataPoint) => height - yScale(d.value))
            .attr('fill', 'steelblue');

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g')
            .call(d3.axisLeft(yScale));
    }

    public updateData(newData: DataPoint[]): void {
        this.data = newData;
        this.svg.selectAll('*').remove();
        this.init();
    }
}

if (typeof window !== 'undefined') {
    (window as any).Visualization = Visualization;
}

export default Visualization;