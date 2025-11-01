/**
 * Application Scatter Chart
 * Utilise directement les classes compilées TypeScript
 */

import * as d3 from 'd3';
import { ScatterProcessor } from './data/ScatterProcessor.js';
import { ScatterMapper } from './mappers/ScatterMapper.js';
import { ScatterChart } from './charts/ScatterChart.js';

// Instances globales (créées une seule fois)
const processor = new ScatterProcessor();
const mapper = new ScatterMapper();
let chart = null; // Créé lors du premier rendu

// Pipeline d'exécution
async function renderScatter(selectedYear) {
    const subtitle = d3.select('.scatter-subtitle');
    
    try {
        console.log(`🚀 Pipeline Scatter (année ${selectedYear})`);
        subtitle.text(`Chargement...`);
        
        // Vider complètement le container avant de recréer
        d3.select('#scatter-viz').html('');
        
        // Étape 1: ScatterProcessor
        const processedData = await processor.processScatterData(undefined, parseInt(selectedYear), 1000);
        
        // Étape 2: ScatterMapper
        const mappedData = mapper.mapForVisualization(processedData);
        
        // Étape 3: ScatterChart (créer une nouvelle instance à chaque fois pour reset complet)
        chart = new ScatterChart('scatter-viz', {
            width: 1200,
            height: 550,
            xLabel: 'Danceability →',
            yLabel: '← Energy'
        });
        
        chart.visualize(mappedData);
        chart.addPopularityLegend();
        
        subtitle.text(`${processedData.length} chansons les plus populaires de ${selectedYear}`);
        console.log(`✅ Pipeline terminée`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        d3.select('#scatter-viz').html(`
            <div class="error">
                <h3>⚠️ Erreur de chargement</h3>
                <p>${error.message}</p>
            </div>
        `);
        subtitle.text('Erreur');
    }
}

// Initialisation
const yearSelect = document.getElementById('year-select');
renderScatter(yearSelect.value);

// Changement d'année
yearSelect.addEventListener('change', function() {
    console.log(`📅 Changement année: ${this.value}`);
    renderScatter(this.value);
});
