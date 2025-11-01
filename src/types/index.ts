// Types pour les données Spotify
export interface SpotifyTrack {
    artist_name: string;
    track_name: string;
    track_id: string;
    popularity: number;
    year: number;
    genre: string;
    danceability: number;
    energy: number;
    key: number;
    loudness: number;
    mode: number;
    speechiness: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;
    duration_ms: number;
    time_signature: number;
}

// Types pour les configurations de graphiques
export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartConfig {
    width: number;
    height: number;
    margin: ChartMargin;
    color?: string;
    animation?: boolean;
}

// Types pour les données agrégées
export interface GenreData {
    genre: string;
    count: number;
    avgPopularity: number;
    avgEnergy: number;
    avgDanceability: number;
}

export interface YearData {
    year: number;
    count: number;
    avgPopularity: number;
}

// Types pour les filtres
export interface FilterOptions {
    genres?: string[];
    yearRange?: [number, number];
    popularityRange?: [number, number];
    energyRange?: [number, number];
    tempoRange?: [number, number];
}

// Types pour les données de tempo
export interface TempoTrackData {
    track: SpotifyTrack;
    tempoDifference: number;
    isPopular: boolean;
}