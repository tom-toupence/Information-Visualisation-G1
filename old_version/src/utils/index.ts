import * as d3 from 'd3';
import { SpotifyTrack, GenreData, YearData } from '../types';

export class DataUtils {
    // Agrégation par genre
    static aggregateByGenre(tracks: SpotifyTrack[]): GenreData[] {
        const grouped = d3.group(tracks, d => d.genre);

        return Array.from(grouped, ([genre, tracks]) => ({
            genre,
            count: tracks.length,
            avgPopularity: d3.mean(tracks, d => d.popularity) || 0,
            avgEnergy: d3.mean(tracks, d => d.energy) || 0,
            avgDanceability: d3.mean(tracks, d => d.danceability) || 0
        }));
    }

    // Agrégation par année
    static aggregateByYear(tracks: SpotifyTrack[]): YearData[] {
        const grouped = d3.group(tracks, d => d.year);

        return Array.from(grouped, ([year, tracks]) => ({
            year,
            count: tracks.length,
            avgPopularity: d3.mean(tracks, d => d.popularity) || 0
        })).sort((a, b) => a.year - b.year);
    }

    // Filtrage des données
    static filterTracks(tracks: SpotifyTrack[], filters: {
        genres?: string[];
        yearRange?: [number, number];
        popularityRange?: [number, number];
    }): SpotifyTrack[] {
        return tracks.filter(track => {
            if (filters.genres && filters.genres.length > 0) {
                if (!filters.genres.includes(track.genre)) return false;
            }

            if (filters.yearRange) {
                const [minYear, maxYear] = filters.yearRange;
                if (track.year < minYear || track.year > maxYear) return false;
            }

            if (filters.popularityRange) {
                const [minPop, maxPop] = filters.popularityRange;
                if (track.popularity < minPop || track.popularity > maxPop) return false;
            }

            return true;
        });
    }

    // Obtenir les genres uniques
    static getUniqueGenres(tracks: SpotifyTrack[]): string[] {
        return Array.from(new Set(tracks.map(t => t.genre))).sort();
    }

    // Obtenir la plage d'années
    static getYearRange(tracks: SpotifyTrack[]): [number, number] {
        const years = tracks.map(t => t.year);
        return [Math.min(...years), Math.max(...years)];
    }
}

export class ColorUtils {
    // Palette de couleurs pour les genres
    static getGenreColorScale(genres: string[]): d3.ScaleOrdinal<string, string> {
        return d3.scaleOrdinal(d3.schemeCategory10)
            .domain(genres);
    }

    // Couleurs pour les années (gradient)
    static getYearColorScale(yearRange: [number, number]): d3.ScaleSequential<string> {
        return d3.scaleSequential(d3.interpolateViridis)
            .domain(yearRange);
    }
}

export class FormatUtils {
    // Formatage des nombres
    static formatNumber(value: number): string {
        return d3.format('.1f')(value);
    }

    // Formatage de la durée
    static formatDuration(durationMs: number): string {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Formatage du pourcentage
    static formatPercentage(value: number): string {
        return d3.format('.1%')(value);
    }
}