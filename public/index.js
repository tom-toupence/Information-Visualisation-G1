"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = __importStar(require("d3"));
class Visualization {
    constructor(containerId, width = 400, height = 300) {
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
    init() {
        this.createSimpleChart();
    }
    createSimpleChart() {
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const width = +this.svg.attr('width') - margin.left - margin.right;
        const height = +this.svg.attr('height') - margin.top - margin.bottom;
        const g = this.svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        // Échelles
        const xScale = d3.scaleBand()
            .domain(this.data.map((d) => d.name))
            .range([0, width])
            .padding(0.1);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, (d) => d.value) || 0])
            .range([height, 0]);
        // Barres
        g.selectAll('.bar')
            .data(this.data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => xScale(d.name) || 0)
            .attr('y', (d) => yScale(d.value))
            .attr('width', xScale.bandwidth())
            .attr('height', (d) => height - yScale(d.value))
            .attr('fill', 'steelblue');
        // Axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));
        g.append('g')
            .call(d3.axisLeft(yScale));
    }
    updateData(newData) {
        this.data = newData;
        this.svg.selectAll('*').remove();
        this.init();
    }
}
if (typeof window !== 'undefined') {
    window.Visualization = Visualization;
}
exports.default = Visualization;
//# sourceMappingURL=index.js.map