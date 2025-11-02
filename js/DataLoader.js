/**
 * DataLoader - Classe pour charger et gérer les données Spotify
 * Singleton avec système de cache
 */
class DataLoader {
    constructor() {
        this.cache = new Map();
    }

    // Singleton pattern
    static getInstance() {
        if (!DataLoader.instance) {
            DataLoader.instance = new DataLoader();
        }
        return DataLoader.instance;
    }

    // Chargement des données Spotify depuis CSV
    async loadSpotifyData(csvPath = '../spotify_data.csv') {
        const cacheKey = 'spotify_data';
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            console.log('📦 Données chargées depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement des données Spotify...');
            const rawData = await d3.csv(csvPath);
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
    parseSpotifyData(rawData) {
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
        }).filter(track => track !== null);
    }

    // Helper pour parser les nombres avec fallback
    parseNumber(value, defaultValue) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    // Validation des données
    validateTrack(track) {
        const requiredFields = ['artist_name', 'track_name', 'popularity', 'year', 'genre'];
        return requiredFields.every(field => 
            track[field] !== undefined && track[field] !== ''
        );
    }

    // Données par défaut pour développement/fallback
    getDefaultData() {
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
    generateRandomSpotifyData(count = 10) {
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
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache vidé');
    }
}

// Export pour utilisation en module ou globalement
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
