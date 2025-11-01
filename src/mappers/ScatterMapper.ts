import * as d3 from 'd3';
import { ScatterData } from '../types/index.js';

export interface MappedScatterData {
    id: string;
    x: number;  // danceability
    y: number;  // energy  
    size: number; // tempo (taille du cercle)
    color: string; // popularity (couleur)
    label: string; // track info
    metadata: {
        track_name: string;
        artist_name: string;
        genre: string;
        popularity: number;
        danceability: number;
        energy: number;
        valence?: number;
        tempo?: number;
    };
}

export class ScatterMapper {
    
    /**
     * Mappe les données scatter pour la visualisation D3
     * @param scatterData Données brutes du ScatterProcessor
     * @returns Données mappées pour D3
     */
    mapForVisualization(scatterData: ScatterData[]): MappedScatterData[] {
        const colorScale = this.createPopularityColorScale();
        const sizeScale = this.createTempoSizeScale(scatterData);
        
        return scatterData.map((item, index) => ({
            id: `track-${index}`,
            x: item.danceability, // Garder entre 0-1 pour D3
            y: item.energy,        // Garder entre 0-1 pour D3
            size: sizeScale(item.tempo ?? 120), // Taille basée sur tempo
            color: colorScale(item.popularity), // Couleur basée sur popularité
            label: `${item.track_name ?? ''} - ${item.artist_name ?? ''}`,
            metadata: {
                track_name: item.track_name ?? '',
                artist_name: item.artist_name ?? '',
                genre: item.genre ?? '',
                popularity: item.popularity,
                danceability: item.danceability,
                energy: item.energy,
                valence: item.valence,
                tempo: item.tempo
            }
        }));
    }

    /**
     * Crée une échelle de couleurs basée sur la popularité
     * Dégradé : bleu foncé (faible) -> violet -> vert -> jaune (haute) - Viridis
     */
    createPopularityColorScale(): (popularity: number) => string {
        return d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateViridis) as any;
    }

    /**
     * Crée une échelle de taille basée sur le tempo
     * @param data Données pour calculer le domaine du tempo
     */
    private createTempoSizeScale(data: ScatterData[]): (tempo: number) => number {
        const tempos = data.map(d => d.tempo ?? 120);
        const maxTempo = Math.max(...tempos);
        
        return d3.scaleSqrt()
            .domain([0, maxTempo])
            .range([2, 12]) as any;
    }

    /**
     * Génère les données pour la légende de popularité
     */
    generatePopularityLegend(): Array<{ value: number; color: string }> {
        const colorScale = this.createPopularityColorScale();
        const legendSteps = [0, 25, 50, 75, 100];
        
        return legendSteps.map(value => ({
            value,
            color: colorScale(value)
        }));
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