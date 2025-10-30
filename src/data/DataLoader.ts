import * as d3 from 'd3';
import { SpotifyTrack, GenreIndex, GenreTreeNode } from '../types';

export class DataLoader {
    private cache: Map<string, any> = new Map();
    private static instance: DataLoader;
    private readonly genreTreeFileName = 'indexByGenreSongs.json';


    static getInstance(): DataLoader {
        if (!DataLoader.instance) {
            DataLoader.instance = new DataLoader();
        }
        return DataLoader.instance;
    }

    async loadSpotifyData(): Promise<SpotifyTrack[]> {
        const cacheKey = 'spotify_data';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const rawData = await d3.csv('spotify_data.csv');
        const spotifyTracks = this.parseSpotifyData(rawData);

        this.cache.set(cacheKey, spotifyTracks);
        return spotifyTracks;
    }

    async loadGenreTree(): Promise<GenreTreeNode> {
        const cacheKey = 'genre_tree';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const tree = await d3.json('music_genres_tree.json') as GenreTreeNode;

        if (!tree || typeof tree !== 'object' || typeof (tree as any).name !== 'string') {
            throw new Error('Invalid data format for genre tree');
        }

        this.cache.set(cacheKey, tree);
        return tree;
    }

    async loadGenreTreeWithSongs(): Promise<GenreTreeNode> {
        const cacheKey = 'genre_tree_with_songs';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let enriched: any;
        if (typeof window !== 'undefined') {
            enriched = await d3.json(this.genreTreeFileName) as GenreTreeNode;
        } else {
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'public', this.genreTreeFileName);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            enriched = JSON.parse(fileContent);
        }

        if (!this.validateEnrichedTree(enriched)) {
            throw new Error('Invalid data format for enriched genre tree');
        }

        this.cache.set(cacheKey, enriched);
        return enriched;
    }

    private validateEnrichedTree(node: any): node is GenreTreeNode {
        if (!node || typeof node !== 'object' || typeof node.name !== 'string') return false;
        if (!Array.isArray(node.songs)) return false;
        if (node.children) {
            if (!Array.isArray(node.children)) return false;
            for (const child of node.children) {
                if (!this.validateEnrichedTree(child)) return false;
            }
        }
        return true;
    }

    private parseSpotifyData(rawData: any[]): SpotifyTrack[] {
        return rawData.map((row, index) => {
            try {
                return {
                    artist_name: row.artist_name || '',
                    track_name: row.track_name || '',
                    track_id: row.track_id || '',
                    popularity: this.parseNumber(row.popularity, 0),
                    year: this.parseNumber(row.year, 2000),
                    genre: row.genre || 'unknown',
                    danceability: this.parseNumber(row.danceability, 0),
                    energy: this.parseNumber(row.energy, 0),
                    key: this.parseNumber(row.key, 0),
                    loudness: this.parseNumber(row.loudness, 0),
                    mode: this.parseNumber(row.mode, 0),
                    speechiness: this.parseNumber(row.speechiness, 0),
                    acousticness: this.parseNumber(row.acousticness, 0),
                    instrumentalness: this.parseNumber(row.instrumentalness, 0),
                    liveness: this.parseNumber(row.liveness, 0),
                    valence: this.parseNumber(row.valence, 0),
                    tempo: this.parseNumber(row.tempo, 120),
                    duration_ms: this.parseNumber(row.duration_ms, 180000),
                    time_signature: this.parseNumber(row.time_signature, 4)
                };
            } catch (error) {
                return null;
            }
        }).filter((track): track is SpotifyTrack => track !== null);
    }

    private parseNumber(value: any, defaultValue: number): number {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    generateRandomSpotifyData(count: number = 10): SpotifyTrack[] {
        const genres = ['pop', 'rock', 'hip-hop', 'acoustic', 'funk'];
        const artists = ['Artist A', 'Artist B', 'Artist C', 'Artist D', 'Artist E'];

        return Array.from({ length: count }, (_, i) => ({
            artist_name: artists[i % artists.length],
            track_name: `Track ${i + 1}`,
            track_id: `track_${i}`,
            popularity: Math.floor(Math.random() * 100),
            year: 2010 + Math.floor(Math.random() * 14),
            genre: genres[Math.floor(Math.random() * genres.length)],
            danceability: Math.random(),
            energy: Math.random(),
            key: Math.floor(Math.random() * 12),
            loudness: -20 + Math.random() * 15,
            mode: Math.round(Math.random()),
            speechiness: Math.random() * 0.5,
            acousticness: Math.random(),
            instrumentalness: Math.random() * 0.1,
            liveness: Math.random() * 0.3,
            valence: Math.random(),
            tempo: 60 + Math.random() * 140,
            duration_ms: 120000 + Math.random() * 300000,
            time_signature: 3 + Math.floor(Math.random() * 3)
        }));
    }

    async loadGenreIndex(): Promise<GenreIndex> {
        const cacheKey = 'genre_index';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const genreIndex = await d3.json(this.genreTreeFileName) as GenreIndex;

        if (!this.validateGenreIndex(genreIndex)) {
            throw new Error('Invalid data format for genre index');
        }

        this.cache.set(cacheKey, genreIndex);
        return genreIndex;
    }

    private validateGenreIndex(genreIndex: any): genreIndex is GenreIndex {
        if (!genreIndex || typeof genreIndex !== 'object') {
            return false;
        }

        for (const [genre, songs] of Object.entries(genreIndex)) {
            if (!Array.isArray(songs)) {
                return false;
            }

            for (let i = 0; i < Math.min(3, songs.length); i++) {
                const song = (songs as any[])[i];
                if (!song || typeof song.track_name !== 'string' || typeof song.track_id !== 'string') {
                    return false;
                }
            }
        }

        return true;
    }

    async getSongsByGenre(genre: string): Promise<{ track_name: string; track_id: string }[]> {
        const genreIndex = await this.loadGenreIndex();
        return genreIndex[genre] || [];
    }

    async getAvailableGenres(): Promise<string[]> {
        const genreIndex = await this.loadGenreIndex();
        return Object.keys(genreIndex).sort();
    }

    async getGenreIndexStats(): Promise<{ genreCount: number; totalSongs: number; avgSongsPerGenre: number }> {
        const genreIndex = await this.loadGenreIndex();
        const genreCount = Object.keys(genreIndex).length;
        const totalSongs = Object.values(genreIndex).reduce((sum, songs) => sum + songs.length, 0);
        const avgSongsPerGenre = genreCount > 0 ? Math.round(totalSongs / genreCount) : 0;

        return {
            genreCount,
            totalSongs,
            avgSongsPerGenre
        };
    }

    clearCache(): void {
        this.cache.clear();
    }
}