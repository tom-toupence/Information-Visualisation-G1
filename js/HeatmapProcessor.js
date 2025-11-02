/**
 * HeatmapProcessor - Traite les données pour la heatmap
 * Agrège les pistes par artiste et année, calcule la popularité moyenne
 */
class HeatmapProcessor {
    /**
     * Traite les données pour créer les cellules de la heatmap
     * @param {Array} tracks - Tableau de pistes avec artist_name, year, track_name, popularity
     * @param {string|null} genre - Genre à filtrer (optionnel)
     * @param {number|null} yearMin - Année minimale (optionnel)
     * @param {number|null} yearMax - Année maximale (optionnel)
     * @returns {Array} Tableau de cellules de heatmap
     */
    static processHeatmapData(tracks, genre = null, yearMin = null, yearMax = null) {
        // Filtrer par genre si spécifié
        let filteredTracks = tracks;
        if (genre && genre !== 'Choisir un genre') {
            filteredTracks = filteredTracks.filter(
                track => track.genre && track.genre.toLowerCase() === genre.toLowerCase()
            );
        }
        
        // Filtrer par plage d'années si spécifié
        if (yearMin !== null || yearMax !== null) {
            filteredTracks = filteredTracks.filter(track => {
                const trackYear = track.year;
                const meetsMin = yearMin === null || trackYear >= yearMin;
                const meetsMax = yearMax === null || trackYear <= yearMax;
                return meetsMin && meetsMax;
            });
        }

        // Grouper par artiste et année
        const groupedData = new Map();

        filteredTracks.forEach(track => {
            const key = `${track.artist_name}|${track.year}`;
            
            if (!groupedData.has(key)) {
                groupedData.set(key, {
                    artist: track.artist_name,
                    year: track.year,
                    songs: [],
                    track_count: 0
                });
            }

            const data = groupedData.get(key);
            data.songs.push({
                track_name: track.track_name,
                track_id: track.track_id,
                popularity: track.popularity
            });
            data.track_count++;
        });

        // Traiter chaque groupe
        const heatmapCells = [];

        groupedData.forEach((data) => {
            // Trier les chansons par popularité
            data.songs.sort((a, b) => b.popularity - a.popularity);
            
            // Garder le top 5
            const top5Songs = data.songs.slice(0, 5);
            
            // Calculer la popularité moyenne
            const avgPopularity = data.songs.reduce(
                (sum, song) => sum + song.popularity, 0
            ) / data.songs.length;

            // Calculer le rang basé sur la popularité maximale
            const maxPopularity = data.songs[0]?.popularity || 0;
            let rank = 0;
            if (maxPopularity >= 80) rank = 4;
            else if (maxPopularity >= 60) rank = 3;
            else if (maxPopularity >= 40) rank = 2;
            else if (maxPopularity >= 20) rank = 1;

            heatmapCells.push({
                artist: data.artist,
                year: data.year,
                rank: rank,
                popular_songs: top5Songs,
                avg_popularity: Math.round(avgPopularity),
                track_count: data.track_count
            });
        });

        return heatmapCells;
    }

    /**
     * Obtient les N artistes les plus populaires (par popularité cumulée)
     * @param {Array} cells - Cellules de heatmap
     * @param {number} topN - Nombre d'artistes à retourner
     * @returns {Array} Cellules filtrées pour les top artistes
     */
    static getTopArtists(cells, topN) {
        const artistStats = new Map();

        cells.forEach(cell => {
            if (!artistStats.has(cell.artist)) {
                artistStats.set(cell.artist, { total: 0, count: 0 });
            }
            const stats = artistStats.get(cell.artist);
            stats.total += cell.avg_popularity;
            stats.count++;
        });

        const sortedArtists = Array.from(artistStats.entries())
            .map(([artist, stats]) => ({
                artist,
                cumulativePopularity: stats.total  // Popularité cumulée au lieu de moyenne
            }))
            .sort((a, b) => b.cumulativePopularity - a.cumulativePopularity)
            .slice(0, topN)
            .map(item => item.artist);

        return cells.filter(cell => sortedArtists.includes(cell.artist));
    }

    /**
     * Obtient la liste des artistes uniques triés par popularité
     * @param {Array} cells - Cellules de heatmap
     * @returns {Array} Liste des noms d'artistes triés
     */
    static getUniqueArtists(cells) {
        const artistStats = new Map();

        cells.forEach(cell => {
            if (!artistStats.has(cell.artist)) {
                artistStats.set(cell.artist, { total: 0, count: 0 });
            }
            const stats = artistStats.get(cell.artist);
            stats.total += cell.avg_popularity;
            stats.count++;
        });

        return Array.from(artistStats.entries())
            .map(([artist, stats]) => ({
                artist,
                avgPopularity: stats.total / stats.count
            }))
            .sort((a, b) => b.avgPopularity - a.avgPopularity)
            .map(item => item.artist);
    }

    /**
     * Calcule la plage d'années globale
     * @param {Array} tracks - Tableau de pistes
     * @returns {Object} {min: number, max: number}
     */
    static getYearRange(tracks) {
        const globalMinYear = tracks.reduce(
            (min, t) => !isNaN(t.year) && t.year < min ? t.year : min, 
            Infinity
        );
        const globalMaxYear = tracks.reduce(
            (max, t) => !isNaN(t.year) && t.year > max ? t.year : max, 
            -Infinity
        );
        
        return { min: globalMinYear, max: globalMaxYear };
    }

    /**
     * Extrait les genres uniques
     * @param {Array} tracks - Tableau de pistes
     * @returns {Array} Liste des genres triés
     */
    static getUniqueGenres(tracks) {
        return [...new Set(tracks.map(track => track.genre))]
            .filter(genre => genre && genre !== 'unknown')
            .sort((a, b) => a.localeCompare(b));
    }

    /**
     * Extrait les années uniques
     * @param {Array} tracks - Tableau de pistes
     * @returns {Array} Liste des années triées
     */
    static getUniqueYears(tracks) {
        return [...new Set(tracks.map(track => track.year))]
            .filter(year => !isNaN(year))
            .sort((a, b) => a - b);
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeatmapProcessor;
}
