/**
 * @typedef {import('../types/index.d.ts').SpotifyTrack} SpotifyTrack
 * @typedef {import('../types/index.d.ts').GenreIndex} GenreIndex
 * @typedef {import('../types/index.d.ts').GenreTreeNode} GenreTreeNode
 * @typedef {import('../types/index.d.ts').SongInfo} SongInfo
 */

/**
 * DataLoader unifié - Classe singleton pour charger et gérer toutes les données Spotify
 * Combine les fonctionnalités des deux anciens DataLoader
 */
export class DataLoader {
    constructor() {
        /** @type {Map<string, any>} */
        this.cache = new Map();
        
        /** @type {string} */
        this.genreTreeFileName = 'assets/indexByGenreSongs.json';
        
        // Préchargement des données Spotify
        this.loadSpotifyData().then(() => {
            console.log('📦 DataLoader initialisé avec préchargement des données');
        });
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
     * Charge les données Spotify depuis le fichier CSV
     * @param {string} csvPath - Chemin vers le fichier CSV (optionnel)
     * @returns {Promise<SpotifyTrack[]>} Les données Spotify parsées
     */
    async loadSpotifyData(csvPath = 'assets/spotify_data.csv') {
        const cacheKey = 'spotify_data';

        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            console.log('📦 Données Spotify chargées depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement des données Spotify...');
            const rawData = await d3.csv(csvPath);
            const spotifyTracks = this.parseSpotifyData(rawData);
            
            // Mettre en cache
            this.cache.set(cacheKey, spotifyTracks);
            console.log(`✅ ${spotifyTracks.length} pistes Spotify chargées avec succès`);
            
            return spotifyTracks;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données Spotify:', error);
            console.warn('🔄 Utilisation des données par défaut');
            return this.getDefaultData();
        }
    }

    /**
     * Charge l'arbre de genres depuis le fichier JSON basique
     * @returns {Promise<GenreTreeNode>} L'arbre de genres
     * @throws {Error} Si le format des données est invalide
     */
    async loadGenreTree() {
        const cacheKey = 'genre_tree';

        if (this.cache.has(cacheKey)) {
            console.log('📦 Arbre de genres chargé depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement de l\'arbre de genres...');
            const tree = await d3.json('assets/music_genres_tree.json');

            if (!tree || typeof tree !== 'object' || typeof tree.name !== 'string') {
                throw new Error('Format invalide pour l\'arbre de genres');
            }

            this.cache.set(cacheKey, tree);
            console.log('✅ Arbre de genres chargé avec succès');
            return tree;
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'arbre de genres:', error);
            throw error;
        }
    }

    /**
     * Charge l'arbre de genres enrichi avec les chansons et métriques
     * @returns {Promise<GenreTreeNode>} L'arbre de genres enrichi
     * @throws {Error} Si le format des données est invalide
     */
    async loadGenreTreeWithSongs() {
        const cacheKey = 'genre_tree_with_songs';

        if (this.cache.has(cacheKey)) {
            console.log('📦 Arbre enrichi chargé depuis le cache');
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🔄 Chargement de l\'arbre de genres enrichi...');
            const enriched = await d3.json(this.genreTreeFileName);

            if (!this.validateEnrichedTree(enriched)) {
                throw new Error('Format invalide pour l\'arbre de genres enrichi');
            }

            this.cache.set(cacheKey, enriched);
            console.log('✅ Arbre de genres enrichi chargé avec succès');
            return enriched;
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'arbre enrichi:', error);
            throw error;
        }
    }

    /**
     * Parse les données CSV brutes vers le format SpotifyTrack
     * @param {any[]} rawData - Données CSV brutes
     * @returns {SpotifyTrack[]} Données parsées
     */
    parseSpotifyData(rawData) {
        return rawData.map((row, index) => {
            try {
                return {
                    artist_name: row.artist_name || '',
                    track_name: row.track_name || '',
                    track_id: row.track_id || '',
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
                    track_genre: row.track_genre || 'unknown',
                    year: this.parseInt(row.year, null)
                };
            } catch (error) {
                console.warn(`⚠️ Erreur parsing ligne ${index}:`, error);
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
     * @param {GenreTreeNode} node - Nœud de l'arbre
     * @returns {{totalTracks: number, totalGenres: number, avgTracksPerGenre: number}}
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
     * @returns {SpotifyTrack[]} Données de test
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
     * Vide le cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache vidé');
    }

    /**
     * Récupère la taille du cache
     * @returns {number} Nombre d'éléments en cache
     */
    getCacheSize() {
        return this.cache.size;
    }
}