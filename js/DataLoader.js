/**
 * DataLoader - Gestion centralisée du chargement des données Spotify
 * Pattern Singleton avec cache mémoire uniquement (dataset trop gros pour Storage)
 * Les préférences utilisateur sont stockées dans LocalStorage
 */
class DataLoader {
    constructor() {
        // Cache mémoire pour les données
        this.cache = new Map();
        // Chemin du CSV (dans assets/)
        this.dataPath = 'assets/spotify_data.csv';
        // Chemin du JSON des genres (dans assets/)
        this.genresTreePath = 'assets/music_genres_tree.json';
        // Chemin de l'index enrichi avec chansons
        this.genreTreeFileName = 'assets/indexByGenreSongs.json';
        // Clé pour les préférences utilisateur
        this.prefsKey = 'spotimix_user_prefs';
        // Flag pour éviter les chargements multiples
        this.isLoading = false;
        // Promise de chargement en cours
        this.loadingPromise = null;
        
        // Préchargement automatique des données au démarrage
        this.loadSpotifyData().then(() => {
            console.log('📦 DataLoader initialisé avec préchargement des données');
        }).catch(error => {
            console.warn('⚠️ Préchargement échoué, chargement à la demande:', error.message);
        });
    }

    /**
     * Récupère l'instance singleton de DataLoader
     */
    static getInstance() {
        if (!DataLoader.instance) {
            DataLoader.instance = new DataLoader();
        }
        return DataLoader.instance;
    }

    /**
     * Charge les données Spotify depuis le fichier CSV
     */
    async loadSpotifyData() {
        const cacheKey = 'spotify_data';

        // Vérifier le cache
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
     */
    parseSpotifyData(rawData) {
        return rawData.map((row, index) => {
            try {
                return {
                    artist_name: row.artist_name || '',
                    track_name: row.track_name || '',
                    track_id: row.track_id || `track_${index}`,
                    popularity: this.parseFloat(row.popularity, 0),
                    danceability: this.parseFloat(row.danceability, 0),
                    energy: this.parseFloat(row.energy, 0),
                    key: this.parseInt(row.key, 0),
                    loudness: this.parseFloat(row.loudness, 0),
                    mode: this.parseInt(row.mode, 0),
                    speechiness: this.parseFloat(row.speechiness, 0),
                    acousticness: this.parseFloat(row.acousticness, 0),
                    instrumentalness: this.parseFloat(row.instrumentalness, 0),
                    liveness: this.parseFloat(row.liveness, 0),
                    valence: this.parseFloat(row.valence, 0),
                    tempo: this.parseFloat(row.tempo, 120),
                    duration_ms: this.parseInt(row.duration_ms, 0),
                    time_signature: this.parseInt(row.time_signature, 4),
                    // Supporter les deux noms de colonnes pour le genre
                    genre: row.genre || row.track_genre || 'unknown',
                    track_genre: row.track_genre || row.genre || 'unknown',
                    year: this.parseInt(row.year, null)
                };
            } catch (error) {
                console.warn(`Error parsing row ${index}:`, error);
                return null;
            }
        }).filter(track => track !== null);
    }

    /**
     * Valide la structure de l'arbre de genres enrichi avec métriques
     * @param {any} tree - L'objet à valider
     * @returns {boolean} true si valide
     */
    validateEnrichedTree(tree) {
        if (!tree || typeof tree !== 'object') {
            return false;
        }

        if (typeof tree.name !== 'string') {
            return false;
        }

        // Vérifier les métriques si présentes
        if (tree.metrics && typeof tree.metrics !== 'object') {
            return false;
        }

        // Vérifier les chansons si présentes
        if (tree.songs && !Array.isArray(tree.songs)) {
            return false;
        }

        // Validation récursive des enfants
        if (tree.children && Array.isArray(tree.children)) {
            return tree.children.every(child => this.validateEnrichedTree(child));
        }

        return true;
    }

    /**
     * Récupère toutes les propriétés numériques disponibles des pistes
     * @returns {Promise<string[]>} Liste des propriétés numériques
     */
    async getProps() {
        const data = await this.loadSpotifyData();
        if (data.length === 0) return [];

        const sample = data[0];
        return Object.keys(sample).filter(key => 
            typeof sample[key] === 'number' && 
            !['key', 'mode', 'time_signature', 'year', 'duration_ms'].includes(key)
        );
    }

    /**
     * Récupère les propriétés d'un titre par son ID
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
     */
    async loadGenresTree() {
        const cacheKey = 'genres_tree';

        // Vérifier le cache mémoire
        if (this.cache.has(cacheKey)) {
            console.log('📦 Arbre de genres chargé depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement de l\'arbre de genres...');
            const response = await fetch(this.genresTreePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const genresTree = await response.json();
            
            if (!genresTree || typeof genresTree !== 'object' || typeof genresTree.name !== 'string') {
                throw new Error('Format invalide pour l\'arbre de genres');
            }

            this.cache.set(cacheKey, genresTree);
            console.log('✅ Arbre de genres chargé avec succès');
            return genresTree;
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'arbre de genres:', error);
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
     */
    async getAvailableGenres() {
        const genresTree = await this.loadGenresTree();
        const allGenres = this.extractGenresFromTree(genresTree);
        return allGenres.sort();
    }

    /**
     * Charge l'arbre de genres enrichi avec les chansons et métriques
     */
    async loadGenreTreeWithSongs() {
        const cacheKey = 'genre_tree_with_songs';

        if (this.cache.has(cacheKey)) {
            console.log('📦 Arbre enrichi chargé depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement de l\'arbre de genres enrichi...');
            const response = await fetch(this.genreTreeFileName);
            const enriched = await response.json();

            this.cache.set(cacheKey, enriched);
            console.log('✅ Arbre de genres enrichi chargé avec succès');
            return enriched;
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'arbre enrichi:', error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques des données
     */
    async getStats() {
        const spotifyData = await this.loadSpotifyData();
        const genres = new Set(spotifyData.map(track => track.genre || track.track_genre));
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
    /**
     * Récupère tous les genres uniques
     * @returns {Promise<string[]>} Liste des genres
     */
    async getGenres() {
        const data = await this.loadSpotifyData();
        const genres = new Set(data.map(track => track.track_genre).filter(Boolean));
        return Array.from(genres).sort();
    }

    /**
     * Récupère les statistiques de l'index des genres
     * @returns {Promise<{totalTracks: number, totalGenres: number, avgTracksPerGenre: number}>}
     */
    async getGenreIndexStats() {
        try {
            const enrichedTree = await this.loadGenreTreeWithSongs();
            const stats = this.calculateTreeStats(enrichedTree);
            console.log('📊 Statistiques de l\'arbre enrichi:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Erreur lors du calcul des statistiques:', error);
            return { totalTracks: 0, totalGenres: 0, avgTracksPerGenre: 0 };
        }
    }

    /**
     * Calcule récursivement les statistiques de l'arbre
     */
    calculateTreeStats(node) {
        let totalTracks = 0;
        let totalGenres = 0;

        // Compter les chansons du nœud actuel
        if (node.songs && Array.isArray(node.songs)) {
            totalTracks += node.songs.length;
        }

        // Si c'est une feuille (pas d'enfants), compter comme genre
        if (!node.children || node.children.length === 0) {
            totalGenres += 1;
        } else {
            // Parcourir récursivement les enfants
            for (const child of node.children) {
                const childStats = this.calculateTreeStats(child);
                totalTracks += childStats.totalTracks;
                totalGenres += childStats.totalGenres;
            }
        }

        return {
            totalTracks,
            totalGenres,
            avgTracksPerGenre: totalGenres > 0 ? totalTracks / totalGenres : 0
        };
    }

    /**
     * Données par défaut en cas d'erreur de chargement
     */
    getDefaultData() {
        return [
            {
                artist_name: 'Test Artist 1',
                track_name: 'Test Track 1',
                track_id: 'test1',
                popularity: 75,
                danceability: 0.8,
                energy: 0.7,
                key: 5,
                loudness: -5,
                mode: 1,
                speechiness: 0.1,
                acousticness: 0.2,
                instrumentalness: 0.0,
                liveness: 0.1,
                valence: 0.8,
                tempo: 120,
                duration_ms: 180000,
                time_signature: 4,
                track_genre: 'pop',
                year: 2023
            },
            {
                artist_name: 'Test Artist 2',
                track_name: 'Test Track 2',
                track_id: 'test2',
                popularity: 65,
                danceability: 0.6,
                energy: 0.9,
                key: 2,
                loudness: -3,
                mode: 0,
                speechiness: 0.05,
                acousticness: 0.1,
                instrumentalness: 0.2,
                liveness: 0.3,
                valence: 0.6,
                tempo: 140,
                duration_ms: 200000,
                time_signature: 4,
                track_genre: 'rock',
                year: 2022
            }
        ];
    }

    /**
     * Parse sécurisé des nombres flottants
     * @param {any} value - Valeur à parser
     * @param {number} defaultValue - Valeur par défaut
     * @returns {number} Nombre parsé
     */
    parseFloat(value, defaultValue) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Parse sécurisé des entiers
     * @param {any} value - Valeur à parser
     * @param {number|null} defaultValue - Valeur par défaut
     * @returns {number|null} Entier parsé
     */
    parseInt(value, defaultValue) {
        const parsed = parseInt(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Vide le cache mémoire
     */
    clearCache() {
        this.cache.clear();
        this.isLoading = false;
        this.loadingPromise = null;
        console.log('🗑️ Cache mémoire vidé');
    }

    /**
     * Vide les préférences utilisateur
     */
    clearPreferences() {
        localStorage.removeItem(this.prefsKey);
        console.log('🗑️ Préférences utilisateur effacées');
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

    /**
     * Récupère la taille du cache
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// Export pour les modules ES6 ET exposition globale
export { DataLoader };

// Créer et exposer l'instance singleton globalement
if (typeof window !== 'undefined') {
    window.dataLoader = DataLoader.getInstance();
}
