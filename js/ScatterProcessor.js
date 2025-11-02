class ScatterDataProcessor {
    constructor() {
        // DataLoader sera accessible via window.dataLoader (chargé avant)
        this.dataLoader = window.dataLoader;
    }

    /**
     * Traite et filtre les données pour une année et un genre donnés
     * @param {number} filterYear - Année à filtrer (par défaut 2023)
     * @param {number} topN - Nombre de pistes à garder (par défaut 1000)
     * @param {string} filterGenre - Genre à filtrer (optionnel)
     * @returns {Promise<Array>} Tableau de données traitées
     */
    async processScatterData(filterYear = 2023, topN = 1000, filterGenre = '') {
        try {
            const genreText = filterGenre ? ` et genre "${filterGenre}"` : '';
            console.log(`Traitement des données pour l'année ${filterYear}${genreText}...`);
            
            // Charger les données via DataLoader
            const allData = await this.dataLoader.loadSpotifyData();

            // Filtrer par année
            let filtered = allData.filter(track => track.year === filterYear);

            // Filtrer par genre si spécifié
            if (filterGenre) {
                const beforeFilter = filtered.length;
                filtered = filtered.filter(track => 
                    track.genre && track.genre.toLowerCase().includes(filterGenre.toLowerCase())
                );
                console.log(`Filtrage genre "${filterGenre}": ${beforeFilter} → ${filtered.length} pistes`);
            }

            // Trier par popularité et garder les top N
            filtered = filtered
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, topN);
            
            // Log des premiers genres pour debug
            if (filtered.length > 0) {
                const genres = [...new Set(filtered.slice(0, 5).map(d => d.genre))];
                console.log('Genres présents (échantillon):', genres.join(', '));
            }

            // Nettoyer (supprimer valeurs invalides)
            const cleaned = this.cleanScatterData(filtered);

            console.log(`${cleaned.length} pistes traitées pour ${filterYear}${genreText}`);
            return cleaned;

        } catch (error) {
            console.error('Erreur traitement données:', error);
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
