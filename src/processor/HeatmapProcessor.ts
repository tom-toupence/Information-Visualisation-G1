import { SpotifyTrack } from '../types';

export interface PopularSong {
    track_name: string;
    track_id: string;
    popularity: number;
}

export interface ArtistYearData {
    artist_name: string;
    year: number;
    popular_songs: PopularSong[];
    rank: number;
    avg_popularity: number;
    track_count: number;
}

export interface HeatmapCell {
    artist: string;
    year: number;
    rank: number;
    popular_songs: PopularSong[];
    avg_popularity: number;
    track_count: number;
}

export class HeatmapProcessor {
    
    /**
     * Calcule le rang basé sur la popularité maximale des chansons
     * rank 4 = au moins 1 chanson à popularity 100 - 80
     * rank 3 = au moins 1 chanson à popularity 80 - 60
     * rank 2 = au moins 1 chanson à popularity 60 - 40
     * rank 1 = au moins 1 chanson à popularity 40 - 20
     * rank 0 = sinon
     */
    private static calculateRank(maxPopularity: number): number {
        if (maxPopularity >= 80) return 4;
        if (maxPopularity >= 60) return 3;
        if (maxPopularity >= 40) return 2;
        if (maxPopularity >= 20) return 1;
        return 0;
    }

    /**
     * Traite les données pour créer une heatmap par artiste et année
     * @param tracks - Toutes les pistes Spotify
     * @param genre - Genre optionnel pour filtrer
     * @returns Données formatées pour la heatmap
     */
    public static processHeatmapData(
        tracks: SpotifyTrack[], 
        genre?: string
    ): HeatmapCell[] {
        // Filtrer par genre si spécifié
        let filteredTracks = tracks;
        if (genre && genre !== 'Choisir un genre') {
            filteredTracks = tracks.filter(
                track => track.genre.toLowerCase() === genre.toLowerCase()
            );
        }

        // Grouper par artist_name et year
        const groupedData = new Map<string, ArtistYearData>();

        filteredTracks.forEach(track => {
            const key = `${track.artist_name}|${track.year}`;
            
            if (!groupedData.has(key)) {
                groupedData.set(key, {
                    artist_name: track.artist_name,
                    year: track.year,
                    popular_songs: [],
                    rank: 0,
                    avg_popularity: 0,
                    track_count: 0
                });
            }

            const data = groupedData.get(key)!;
            data.popular_songs.push({
                track_name: track.track_name,
                track_id: track.track_id,
                popularity: track.popularity
            });
            data.track_count++;
        });

        // Traiter chaque groupe
        const heatmapCells: HeatmapCell[] = [];

        groupedData.forEach((data, key) => {
            // Trier les chansons par popularité (décroissant)
            data.popular_songs.sort((a, b) => b.popularity - a.popularity);
            
            // Garder seulement le top 5
            const top5Songs = data.popular_songs.slice(0, 5);
            
            // Calculer la popularité moyenne
            const avgPopularity = data.popular_songs.reduce(
                (sum, song) => sum + song.popularity, 0
            ) / data.popular_songs.length;

            // Calculer le rang basé sur la chanson la plus populaire
            const maxPopularity = data.popular_songs[0]?.popularity || 0;
            const rank = this.calculateRank(maxPopularity);

            heatmapCells.push({
                artist: data.artist_name,
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
     * Récupère la liste unique des artistes triés par popularité moyenne
     */
    public static getUniqueArtists(cells: HeatmapCell[]): string[] {
        const artistStats = new Map<string, { total: number, count: number }>();

        cells.forEach(cell => {
            if (!artistStats.has(cell.artist)) {
                artistStats.set(cell.artist, { total: 0, count: 0 });
            }
            const stats = artistStats.get(cell.artist)!;
            stats.total += cell.avg_popularity;
            stats.count++;
        });

        // Trier par popularité moyenne décroissante
        const sortedArtists = Array.from(artistStats.entries())
            .map(([artist, stats]) => ({
                artist,
                avgPopularity: stats.total / stats.count
            }))
            .sort((a, b) => b.avgPopularity - a.avgPopularity)
            .map(item => item.artist);

        return sortedArtists;
    }

    /**
     * Récupère la liste unique des années triées
     */
    public static getUniqueYears(cells: HeatmapCell[]): number[] {
        const years = new Set<number>();
        cells.forEach(cell => years.add(cell.year));
        return Array.from(years).sort((a, b) => a - b);
    }

    /**
     * Filtre les données de la heatmap par plage d'années
     */
    public static filterByYearRange(
        cells: HeatmapCell[], 
        yearRange: [number, number]
    ): HeatmapCell[] {
        return cells.filter(
            cell => cell.year >= yearRange[0] && cell.year <= yearRange[1]
        );
    }

    /**
     * Filtre pour ne garder que les N artistes les plus populaires
     */
    public static getTopArtists(
        cells: HeatmapCell[], 
        topN: number = 20
    ): HeatmapCell[] {
        const artists = this.getUniqueArtists(cells);
        const topArtists = new Set(artists.slice(0, topN));
        
        return cells.filter(cell => topArtists.has(cell.artist));
    }

    /**
     * Obtient les statistiques globales
     */
    public static getStatistics(cells: HeatmapCell[]): {
        totalArtists: number;
        totalYears: number;
        avgPopularity: number;
        rankDistribution: { [key: number]: number };
    } {
        const rankDistribution: { [key: number]: number } = {
            0: 0, 1: 0, 2: 0, 3: 0, 4: 0
        };

        let totalPopularity = 0;

        cells.forEach(cell => {
            rankDistribution[cell.rank]++;
            totalPopularity += cell.avg_popularity;
        });

        return {
            totalArtists: this.getUniqueArtists(cells).length,
            totalYears: this.getUniqueYears(cells).length,
            avgPopularity: Math.round(totalPopularity / cells.length),
            rankDistribution
        };
    }
}
