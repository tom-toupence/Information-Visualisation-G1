// ============================================================================
// SCATTER APP - Application principale
// Orchestre la pipeline : Processor → Mapper → Chart
// ============================================================================

// Instances globales
const processor = new ScatterDataProcessor();
const mapper = new ScatterDataMapper();
let currentChart = null;

/**
 * Rend le scatter plot pour une année donnée
 * @param {number} year - Année à afficher
 */
async function renderScatter(year) {
    const loading = document.getElementById('loading');
    const container = document.getElementById('scatter-viz');
    
    // Afficher le loading
    loading.style.display = 'block';
    container.innerHTML = '';

    try {
        // ÉTAPE 1 : Charger et traiter les données
        console.log('🔄 Étape 1 : ScatterProcessor...');
        const rawData = await processor.processScatterData(year, 1000);
        
        if (rawData.length === 0) {
            container.innerHTML = '<p class="error">❌ Aucune donnée disponible pour cette année</p>';
            loading.style.display = 'none';
            return;
        }

        // ÉTAPE 2 : Mapper les données pour la visualisation
        console.log('🔄 Étape 2 : ScatterMapper...');
        const mappedData = mapper.mapForVisualization(rawData);

        // ÉTAPE 3 : Créer et afficher le graphique
        console.log('🔄 Étape 3 : ScatterChart...');
        currentChart = new ScatterChart('scatter-viz', {
            width: 900,
            height: 600
        });
        
        currentChart.visualize(mappedData);

        // Masquer le loading
        loading.style.display = 'none';

        console.log('✅ Pipeline terminée !');

    } catch (error) {
        console.error('❌ Erreur:', error);
        container.innerHTML = '<p class="error">❌ Erreur lors du chargement des données</p>';
        loading.style.display = 'none';
    }
}

// ============================================================================
// INITIALISATION
// ============================================================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation du Scatter Plot...');
    console.log('📦 Pipeline : ScatterProcessor → ScatterMapper → ScatterChart');

    // Charger l'année par défaut
    const yearSelect = document.getElementById('year-select');
    renderScatter(parseInt(yearSelect.value));

    // Écouter les changements d'année
    yearSelect.addEventListener('change', (e) => {
        const year = parseInt(e.target.value);
        console.log(`\n📅 Changement d'année: ${year}`);
        renderScatter(year);
    });
});
