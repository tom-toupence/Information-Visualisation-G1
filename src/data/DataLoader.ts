import * as d3 from 'd3';
import { SpotifyTrack } from '../types';

export class DataLoader {
    private cache: Map<string, any> = new Map();
    private static instance: DataLoader;

    // Singleton pattern
    static getInstance(): DataLoader {
        if (!DataLoader.instance) {
            DataLoader.instance = new DataLoader();
        }
        return DataLoader.instance;
    }

    // Chargement des données Spotify depuis CSV
    async loadSpotifyData(): Promise<SpotifyTrack[]> {
        const cacheKey = 'spotify_data';

        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            console.log('📦 Données chargées depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement des données Spotify...');

            let rawData;
            
            // Différencier environnement Node.js vs navigateur
            if (typeof window === 'undefined') {
                // Node.js - lire le fichier avec fs
                console.log('📂 Environnement Node.js détecté');
                rawData = await this.loadCSVFromFileSystem();
            } else {
                // Navigateur - utiliser d3.csv normal
                console.log('🌐 Environnement navigateur détecté');
                rawData = await d3.csv('spotify_data.csv');
            }
            
            const spotifyTracks = this.parseSpotifyData(rawData);

            // Mettre en cache
            this.cache.set(cacheKey, spotifyTracks);

            console.log(`✅ ${spotifyTracks.length} pistes chargées avec succès`);
            return spotifyTracks;

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);

            // Retourner des données par défaut en cas d'erreur
            return this.getDefaultData();
        }
    }

    // Parsing des données CSV vers SpotifyTrack
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
                console.warn(`⚠️ Erreur parsing ligne ${index + 1}:`, error);
                return null;
            }
        }).filter((track): track is SpotifyTrack => track !== null);
    }

    // Chargement CSV depuis le système de fichiers (Node.js)
    private async loadCSVFromFileSystem(): Promise<any[]> {
        try {
            const fs = await import('fs');
            const path = await import('path');
            
            const csvPath = path.join(process.cwd(), 'public', 'spotify_data.csv');
            console.log(`📁 Lecture du fichier: ${csvPath}`);
            
            // Vérifier si le fichier existe
            if (!fs.existsSync(csvPath)) {
                throw new Error(`Fichier non trouvé: ${csvPath}`);
            }
            
            // Lire le fichier
            const csvContent = fs.readFileSync(csvPath, 'utf-8');
            
            // Parser avec d3.csvParse
            const parsedData = d3.csvParse(csvContent);

            console.log(`📊 ${parsedData.length} lignes chargées du CSV`);

            return parsedData;

        } catch (error) {
            console.error('❌ Erreur lecture fichier CSV:', error);
            throw error;
        }
    }

    // Helper pour parser les nombres avec fallback
    private parseNumber(value: any, defaultValue: number): number {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    // Validation des données
    private validateTrack(track: any): boolean {
        const requiredFields = ['artist_name', 'track_name', 'popularity', 'year', 'genre'];
        return requiredFields.every(field => track[field] !== undefined && track[field] !== '');
    }

    // Données par défaut pour développement/fallback
    private getDefaultData(): SpotifyTrack[] {
        return [
            {
                artist_name: "Jason Mraz",
                track_name: "I Won't Give Up",
                track_id: "53QF56cjZA9RTuuMZDrSA6",
                popularity: 68,
                year: 2012,
                genre: "acoustic",
                danceability: 0.483,
                energy: 0.303,
                key: 4,
                loudness: -10.058,
                mode: 1,
                speechiness: 0.0429,
                acousticness: 0.694,
                instrumentalness: 0.0,
                liveness: 0.115,
                valence: 0.139,
                tempo: 133.406,
                duration_ms: 240166,
                time_signature: 3
            },
            {
                artist_name: "Ed Sheeran",
                track_name: "Shape of You",
                track_id: "7qiZfU4dY1lWllzX7mPBI3",
                popularity: 93,
                year: 2017,
                genre: "pop",
                danceability: 0.825,
                energy: 0.652,
                key: 1,
                loudness: -3.183,
                mode: 0,
                speechiness: 0.0802,
                acousticness: 0.581,
                instrumentalness: 0.0,
                liveness: 0.0931,
                valence: 0.931,
                tempo: 95.977,
                duration_ms: 233713,
                time_signature: 4
            }
        ];
    }

    // Méthodes utilitaires pour les tests
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

    // Nettoyage du cache
    clearCache(): void {
        this.cache.clear();
        console.log('🗑️ Cache vidé');
    }
}