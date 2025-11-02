/**
 * DataLoader - Gestion centralisée du chargement des données Spotify
 * Pattern Singleton avec cache mémoire uniquement (dataset trop gros pour Storage)
 * Les préférences utilisateur sont stockées dans LocalStorage
 */
class DataLoader {
    constructor() {
        /** @type {Map<string, any>} Cache mémoire pour les données */
        this.cache = new Map();
        /** @type {string} Chemin du CSV */
        this.dataPath = 'data/spotify_data.csv';
        /** @type {string} Chemin du JSON des genres */
        this.genresTreePath = 'data/music_genres_tree.json';
        /** @type {string} Clé pour les préférences utilisateur */
        this.prefsKey = 'spotimix_user_prefs';
        /** @type {boolean} Flag pour éviter les chargements multiples */
        this.isLoading = false;
        /** @type {Promise} Promise de chargement en cours */
        this.loadingPromise = null;
    }

    /**
     * Récupère l'instance singleton de DataLoader
     * @returns {DataLoader} L'instance unique de DataLoader
     */
    static getInstance() {
        if (!DataLoader.instance) {
            DataLoader.instance = new DataLoader();
        }
        return DataLoader.instance;
    }

    /**
     * Charge les données Spotify (cache mémoire uniquement)
     * @returns {Promise<SpotifyTrack[]>} Les données Spotify parsées
     */
    async loadSpotifyData() {
        const cacheKey = 'spotify_data';

        // 1. Si les données sont en cache mémoire, les retourner immédiatement
        if (this.cache.has(cacheKey)) {
            console.log('Using memory cache');
            return this.cache.get(cacheKey);
        }

        // 2. Si un chargement est déjà en cours, attendre sa fin
        if (this.isLoading && this.loadingPromise) {
            console.log('Waiting for ongoing load...');
            return this.loadingPromise;
        }

        // 3. Démarrer le chargement du CSV
        this.isLoading = true;
        console.log('Loading Spotify data from CSV (this may take a few seconds)...');
        
        this.loadingPromise = (async () => {
            try {
                const rawData = await d3.csv(this.dataPath);
                const spotifyTracks = this.parseSpotifyData(rawData);
                
                // Sauvegarder UNIQUEMENT dans le cache mémoire
                this.cache.set(cacheKey, spotifyTracks);
                
                console.log(`Loaded ${spotifyTracks.length} tracks (${(JSON.stringify(spotifyTracks).length / 1024 / 1024).toFixed(2)} MB in memory)`);
                return spotifyTracks;
            } finally {
                this.isLoading = false;
                this.loadingPromise = null;
            }
        })();

        return this.loadingPromise;
    }

    /**
     * Parse les données brutes Spotify en objets typés
     * @param {any[]} rawData - Les données brutes du CSV
     * @returns {SpotifyTrack[]} Les données parsées et validées
     * @private
     */
    parseSpotifyData(rawData) {
        return rawData.map((row, index) => {
            try {
                return {
                    artist_name: row.artist_name || '',
                    track_name: row.track_name || '',
                    track_id: row.track_id || `track_${index}`,
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
                console.warn(`Error parsing row ${index}:`, error);
                return null;
            }
        }).filter(track => track !== null);
    }

    /**
     * Parse une valeur en nombre avec une valeur par défaut
     * @param {any} value - La valeur à parser
     * @param {number} defaultValue - La valeur par défaut
     * @returns {number} Le nombre parsé ou la valeur par défaut
     * @private
     */
    parseNumber(value, defaultValue) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Récupère les propriétés d'un titre par son ID
     * @param {string} id - L'ID du titre à rechercher
     * @returns {Promise<SpotifyTrack|null>} Les propriétés du titre ou null si non trouvé
     */
    async getTrackById(id) {
        try {
            const spotifyData = await this.loadSpotifyData();
            const foundTrack = spotifyData.find(track => track.track_id === id);
            return foundTrack || null;
        } catch (error) {
            console.error(`Error finding track with ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Charge l'arbre des genres depuis le JSON
     * @returns {Promise<Object>} L'arbre des genres
     */
    async loadGenresTree() {
        // Vérifier le cache mémoire
        if (this.cache.has('genres_tree')) {
            return this.cache.get('genres_tree');
        }

        try {
            const response = await fetch(this.genresTreePath);
            const genresTree = await response.json();
            this.cache.set('genres_tree', genresTree);
            return genresTree;
        } catch (error) {
            console.error('Error loading genres tree:', error);
            return { name: 'Music Genres', children: [] };
        }
    }

    /**
     * Extrait tous les genres de l'arbre hiérarchique
     * @param {Object} node - Nœud de l'arbre
     * @param {string[]} genres - Tableau pour accumuler les genres
     * @returns {string[]} Liste de tous les genres
     */
    extractGenresFromTree(node, genres = []) {
        // Si le nœud a un nom et pas d'enfants, c'est un genre final
        if (node.name && !node.children) {
            genres.push(node.name);
        }
        
        // Parcourir récursivement les enfants
        if (node.children) {
            node.children.forEach(child => {
                this.extractGenresFromTree(child, genres);
            });
        }
        
        return genres;
    }

    /**
     * Récupère la liste des genres disponibles depuis music_genres_tree.json
     * @returns {Promise<string[]>} Les genres disponibles triés alphabétiquement
     */
    async getAvailableGenres() {
        const genresTree = await this.loadGenresTree();
        const allGenres = this.extractGenresFromTree(genresTree);
        return allGenres.sort();
    }

    /**
     * Récupère les statistiques des données
     * @returns {Promise<{totalTracks: number, genreCount: number, yearRange: {min: number, max: number}}>}
     */
    async getStats() {
        const spotifyData = await this.loadSpotifyData();
        const genres = new Set(spotifyData.map(track => track.genre));
        const years = spotifyData.map(track => track.year).filter(y => y > 0);
        
        return {
            totalTracks: spotifyData.length,
            genreCount: genres.size,
            yearRange: {
                min: Math.min(...years),
                max: Math.max(...years)
            }
        };
    }

    /**
     * Sauvegarde les préférences utilisateur (genre, année)
     * @param {Object} prefs - Les préférences à sauvegarder
     */
    saveUserPreferences(prefs) {
        try {
            const current = this.getUserPreferences();
            const updated = { ...current, ...prefs };
            localStorage.setItem(this.prefsKey, JSON.stringify(updated));
            console.log('User preferences saved:', updated);
        } catch (error) {
            console.warn('Error saving preferences:', error);
        }
    }

    /**
     * Récupère les préférences utilisateur
     * @returns {Object} Les préférences (genre, year, etc.)
     */
    getUserPreferences() {
        try {
            const stored = localStorage.getItem(this.prefsKey);
            if (!stored) {
                return {
                    year: 2023,
                    genre: '',
                    topN: 1000
                };
            }
            return JSON.parse(stored);
        } catch (error) {
            console.warn('Error loading preferences:', error);
            return {
                year: 2023,
                genre: '',
                topN: 1000
            };
        }
    }

    /**
     * Vide le cache mémoire
     */
    clearCache() {
        this.cache.clear();
        this.isLoading = false;
        this.loadingPromise = null;
        console.log('Memory cache cleared');
    }

    /**
     * Vide les préférences utilisateur
     */
    clearPreferences() {
        localStorage.removeItem(this.prefsKey);
        console.log('User preferences cleared');
    }

    /**
     * Affiche les statistiques du cache (mémoire uniquement)
     */
    getCacheInfo() {
        const hasData = this.cache.has('spotify_data');
        const dataSize = hasData ? this.cache.get('spotify_data').length : 0;
        
        return {
            hasMemoryCache: hasData,
            trackCount: dataSize,
            isLoading: this.isLoading,
            preferences: this.getUserPreferences()
        };
    }
}

// Créer et exposer l'instance singleton globalement
window.dataLoader = DataLoader.getInstance();
