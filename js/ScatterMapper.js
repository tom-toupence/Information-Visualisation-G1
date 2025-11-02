// ============================================================================
// DATA MAPPER - Mapping des données pour la visualisation
// ============================================================================

class ScatterDataMapper {
    
    /**
     * Mappe les données pour la visualisation D3
     * @param {Array} scatterData - Données brutes du processor
     * @returns {Array} Données mappées avec propriétés visuelles
     */
    mapForVisualization(scatterData) {
        const colorScale = this.createPopularityColorScale();
        const sizeScale = this.createTempoSizeScale(scatterData);
        
        return scatterData.map((item, index) => ({
            id: `track-${index}`,
            x: item.danceability,
            y: item.energy,
            size: sizeScale(item.tempo || 120),
            color: colorScale(item.popularity),
            metadata: {
                track_name: item.track_name || '',
                artist_name: item.artist_name || '',
                genre: item.genre || '',
                year: item.year,
                popularity: item.popularity,
                danceability: item.danceability,
                energy: item.energy,
                valence: item.valence,
                tempo: item.tempo,
                // Nouvelles données pour le camembert
                acousticness: item.acousticness,
                instrumentalness: item.instrumentalness,
                liveness: item.liveness,
                speechiness: item.speechiness,
                key: item.key,
                mode: item.mode,
                loudness: item.loudness
            }
        }));
    }

    /**
     * Crée une échelle de couleur Viridis pour la popularité
     * @returns {Function} Fonction d3 scale
     */
    createPopularityColorScale() {
        return d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateViridis);
    }

    /**
     * Crée une échelle de taille pour le tempo
     * @param {Array} data - Données pour calculer le domaine
     * @returns {Function} Fonction d3 scale
     */
    createTempoSizeScale(data) {
        const tempos = data.map(d => d.tempo || 120);
        const maxTempo = Math.max(...tempos);
        
        return d3.scaleSqrt()
            .domain([0, maxTempo])
            .range([2, 12]);
    }

    /**
     * Génère les données pour la légende de popularité
     * @returns {Array} Tableau de valeurs et couleurs
     */
    generatePopularityLegend() {
        const colorScale = this.createPopularityColorScale();
        const legendSteps = [0, 25, 50, 75, 100];
        
        return legendSteps.map(value => ({
            value,
            color: colorScale(value)
        }));
    }
}
