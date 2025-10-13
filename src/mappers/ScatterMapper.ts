import { ScatterData } from '../types';

export interface MappedScatterData {
    id: string;
    x: number;  // danceability
    y: number;  // energy  
    size: number; // popularity
    color: string; // genre
    label: string; // track info
    metadata: {
        track_name: string;
        artist_name: string;
        genre: string;
        popularity: number;
        danceability: number;
        energy: number;
    };
}

export class ScatterMapper {
    
    /**
     * Mappe les données scatter pour la visualisation D3
     * @param scatterData Données brutes du ScatterProcessor
     * @returns Données mappées pour D3
     */
    mapForVisualization(scatterData: ScatterData[]): MappedScatterData[] {
        const colorScale = this.createColorScale(scatterData);
        
        return scatterData.map((item, index) => ({
            id: `track-${index}`,
            x: item.danceability * 100, // Convertir en 0-100 pour plus de lisibilité
            y: item.energy * 100,
            size: this.mapPopularityToSize(item.popularity),
            color: colorScale(item.genre ?? ''),
            label: `${item.track_name ?? ''} - ${item.artist_name ?? ''}`,
            metadata: {
                track_name: item.track_name ?? '',
                artist_name: item.artist_name ?? '',
                genre: item.genre ?? '',
                popularity: item.popularity,
                danceability: item.danceability,
                energy: item.energy
            }
        }));
    }

    /**
     * Crée une échelle de couleurs pour les genres
     */
    private createColorScale(data: ScatterData[]): (genre: string) => string {
        const genres = [...new Set(data.map(d => d.genre))];
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        const colorMap = new Map();
        genres.forEach((genre, index) => {
            colorMap.set(genre, colors[index % colors.length]);
        });
        
        return (genre: string) => colorMap.get(genre) || '#999999';
    }

    /**
     * Mappe la popularité à une taille de cercle
     */
    private mapPopularityToSize(popularity: number): number {
        // Popularité de 0-100 -> Taille de 3-15 pixels
        return Math.max(3, Math.min(15, (popularity / 100) * 12 + 3));
    }

    /**
     * Groupe les données par genre pour l'analyse
     */
    groupByGenre(data: MappedScatterData[]): Map<string, MappedScatterData[]> {
        const grouped = new Map<string, MappedScatterData[]>();
        
        data.forEach(item => {
            const genre = item.metadata.genre;
            if (!grouped.has(genre)) {
                grouped.set(genre, []);
            }
            grouped.get(genre)!.push(item);
        });
        
        return grouped;
    }

    /**
     * Calcule les statistiques par genre
     */
    getGenreStats(data: MappedScatterData[]): Array<{
        genre: string;
        count: number;
        avgDanceability: number;
        avgEnergy: number;
        avgPopularity: number;
    }> {
        const grouped = this.groupByGenre(data);
        const stats: Array<any> = [];

        grouped.forEach((tracks, genre) => {
            const count = tracks.length;
            const avgDanceability = tracks.reduce((sum, t) => sum + t.metadata.danceability, 0) / count;
            const avgEnergy = tracks.reduce((sum, t) => sum + t.metadata.energy, 0) / count;
            const avgPopularity = tracks.reduce((sum, t) => sum + t.metadata.popularity, 0) / count;

            stats.push({
                genre,
                count,
                avgDanceability: Math.round(avgDanceability * 1000) / 1000,
                avgEnergy: Math.round(avgEnergy * 1000) / 1000,
                avgPopularity: Math.round(avgPopularity * 10) / 10
            });
        });

        return stats.sort((a, b) => b.count - a.count);
    }
}