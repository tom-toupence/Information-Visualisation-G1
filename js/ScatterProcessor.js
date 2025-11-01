// ============================================================================
// DATA PROCESSOR - Chargement et traitement des données
// ============================================================================

class ScatterDataProcessor {
    constructor() {
        this.cachedData = null;
    }

    /**
     * Charge et traite les données CSV pour une année donnée
     * @param {number} filterYear - Année à filtrer (par défaut 2023)
     * @param {number} topN - Nombre de pistes à garder (par défaut 1000)
     * @returns {Promise<Array>} Tableau de données traitées
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
            const cleaned = this.cleanScatterData(filtered);

            console.log(`✅ ${cleaned.length} pistes chargées pour ${filterYear}`);
            return cleaned;

        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            return [];
        }
    }

    /**
     * Nettoie les données scatter (supprime les valeurs invalides)
     * @param {Array} data - Données à nettoyer
     * @returns {Array} Données nettoyées
     */
    cleanScatterData(data) {
        return data.filter(item => {
            return !isNaN(item.danceability) && 
                   !isNaN(item.popularity) && 
                   !isNaN(item.energy) &&
                   item.danceability >= 0 && item.danceability <= 1 &&
                   item.popularity >= 0 && item.popularity <= 100 &&
                   item.energy >= 0 && item.energy <= 1;
        });
    }
}
