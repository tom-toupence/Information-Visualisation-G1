/**
 * @typedef {import('../../types/index.d.ts').SpotifyTrack} SpotifyTrack
 * @typedef {import('../../types/index.d.ts').GenreIndex} GenreIndex
 * @typedef {import('../../types/index.d.ts').GenreTreeNode} GenreTreeNode
 * @typedef {import('../../types/index.d.ts').SongInfo} SongInfo
 */

// d3 est chargé globalement via script dans HTML


/**
 * Classe singleton pour charger et gérer les données Spotify
 */
export class DataLoader {
    constructor() {
        /** @type {Map<string, any>} */
        this.cache = new Map();
        /** @type {string} */
        this.genreTreeFileName = 'assets/indexByGenreSongs.json';
        this.loadSpotifyData().then(() => { })
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
     * @returns {Promise<SpotifyTrack[]>} Les données Spotify parsées
     */
    async loadSpotifyData() {
        const cacheKey = 'spotify_data';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const rawData = await d3.csv('assets/spotify_data.csv');
        const spotifyTracks = this.parseSpotifyData(rawData);

        this.cache.set(cacheKey, spotifyTracks);
        return spotifyTracks;
    }

    /**
     * Charge l'arbre de genres depuis le fichier JSON
     * @returns {Promise<GenreTreeNode>} L'arbre de genres
     * @throws {Error} Si le format des données est invalide
     */
    async loadGenreTree() {
        const cacheKey = 'genre_tree';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const tree = await d3.json('assets/music_genres_tree.json');

        // @ts-ignore
        if (!tree || typeof tree !== 'object' || typeof tree.name !== 'string') {
            throw new Error('Invalid data format for genre tree');
        }

        this.cache.set(cacheKey, tree);
        // @ts-ignore
        return tree;
    }

    /**
     * Charge l'arbre de genres enrichi avec les chansons
     * @returns {Promise<GenreTreeNode>} L'arbre de genres enrichi
     * @throws {Error} Si le format des données est invalide
     */
    async loadGenreTreeWithSongs() {
        const cacheKey = 'genre_tree_with_songs';

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const enriched = await d3.json(this.genreTreeFileName);

        if (!this.validateEnrichedTree(enriched)) {
            throw new Error('Invalid data format for enriched genre tree');
        }

        this.cache.set(cacheKey, enriched);
        // @ts-ignore
        return enriched;
    }

    /**
     * Valide la structure de l'arbre de genres enrichi avec métriques
     * @param {any} node - Le nœud à valider
     * @returns {boolean} True si la structure est valide
     * @private
     */
    validateEnrichedTree(node) {
        if (!node || typeof node !== 'object' || typeof node.name !== 'string') return false;
        if (!Array.isArray(node.songs)) return false;

        // Vérifier la présence des métriques
        if (node.metrics && typeof node.metrics === 'object') {
            const requiredMetrics = ['count', 'avg_danceability', 'avg_energy', 'avg_popularity'];
            for (const metric of requiredMetrics) {
                if (!(metric in node.metrics)) return false;
            }
        }

        if (node.children) {
            if (!Array.isArray(node.children)) return false;
            for (const child of node.children) {
                if (!this.validateEnrichedTree(child)) return false;
            }
        }
        return true;
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
     * Génère des données Spotify aléatoires pour les tests
     * @param {number} [count=10] - Le nombre de pistes à générer
     * @returns {SpotifyTrack[]} Les données générées
     */
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

    // SUPPRIMÉ: loadGenreIndex() et validateGenreIndex() - Plus nécessaires car on utilise directement l'arbre enrichi

    // SUPPRIMÉ: getSongsByGenre() - Plus nécessaire car on utilise directement l'arbre enrichi

    /**
     * Récupère les propriétés d'un titre par son ID
     * @param {string} id - L'ID du titre à rechercher
     * @returns {Promise<SpotifyTrack|null>} Les propriétés du titre ou null si non trouvé
     */
    async getProps(id) {
        try {
            // D'abord essayer dans les données Spotify complètes
            const spotifyData = await this.loadSpotifyData();
            const foundTrack = spotifyData.find(track => track.track_id === id);

            if (foundTrack) {
                return foundTrack;
            }

            // Si pas trouvé dans Spotify, chercher dans l'arbre de genres enrichi
            const genreTree = await this.loadGenreTreeWithSongs();
            const track = this.findTrackInTree(genreTree, id);

            return track;
        } catch (error) {
            console.error(`Erreur lors de la recherche du titre avec l'ID ${id}:`, error);
            return null;
        }
    }

    /**
     * Recherche récursive d'un titre dans l'arbre de genres
     * @param {any} node - Le nœud de l'arbre à explorer
     * @param {string} id - L'ID du titre à rechercher
     * @returns {any|null} Le titre trouvé ou null
     * @private
     */
    findTrackInTree(node, id) {
        // Chercher dans les chansons du nœud actuel
        if (node.songs && Array.isArray(node.songs)) {
            const foundSong = node.songs.find(song => song.track_id === id);
            if (foundSong) {
                return foundSong;
            }
        }

        // Chercher récursivement dans les enfants
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const result = this.findTrackInTree(child, id);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    /**
     * Récupère la liste des genres disponibles depuis l'arbre enrichi
     * @returns {Promise<string[]>} Les genres disponibles triés
     */
    async getAvailableGenres() {
        const enrichedTree = await this.loadGenreTreeWithSongs();
        const genres = [];
        this.collectGenresFromTree(enrichedTree, genres);
        return genres.sort();
    }

    /**
     * Récupère les statistiques depuis l'arbre enrichi
     * @returns {Promise<{genreCount: number, totalSongs: number, avgSongsPerGenre: number}>} Les statistiques
     */
    async getGenreIndexStats() {
        const enrichedTree = await this.loadGenreTreeWithSongs();
        const stats = { genreCount: 0, totalSongs: 0 };
        this.collectStatsFromTree(enrichedTree, stats);

        return {
            genreCount: stats.genreCount,
            totalSongs: stats.totalSongs,
            avgSongsPerGenre: stats.genreCount > 0 ? Math.round(stats.totalSongs / stats.genreCount) : 0
        };
    }

    /**
     * Collecte récursivement les genres depuis l'arbre
     * @param {any} node - Le nœud à explorer
     * @param {string[]} genres - Le tableau des genres à remplir
     * @private
     */
    collectGenresFromTree(node, genres) {
        if (node.songs && node.songs.length > 0) {
            genres.push(node.name);
        }
        if (node.children) {
            for (const child of node.children) {
                this.collectGenresFromTree(child, genres);
            }
        }
    }

    /**
     * Collecte récursivement les statistiques depuis l'arbre
     * @param {any} node - Le nœud à explorer
     * @param {any} stats - L'objet des statistiques à remplir
     * @private
     */
    collectStatsFromTree(node, stats) {
        if (node.songs && node.songs.length > 0) {
            stats.genreCount++;
            stats.totalSongs += node.songs.length;
        }
        if (node.children) {
            for (const child of node.children) {
                this.collectStatsFromTree(child, stats);
            }
        }
    }

    /**
     * Vide le cache des données
     */
    clearCache() {
        this.cache.clear();
    }
}

/** @type {DataLoader|null} */
DataLoader.instance = null;