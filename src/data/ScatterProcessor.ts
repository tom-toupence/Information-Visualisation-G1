import * as d3 from 'd3';
import { SpotifyTrack, ScatterData, FilterOptions } from '../types';
import { DataLoader } from './DataLoader';

export class ScatterProcessor {
    private dataLoader: DataLoader;

    constructor() {
        this.dataLoader = DataLoader.getInstance();
    }

    /**
     * Traite les données Spotify pour extraire les colonnes danceability, popularity, energy
     * @param options Options de filtrage optionnelles
     * @returns Tableau de données scatter
     */
    async processScatterData(options?: FilterOptions): Promise<ScatterData[]> {
        try {        
            // Charger les données complètes
            const spotifyTracks = await this.dataLoader.loadSpotifyData();
            
            // Appliquer les filtres si spécifiés
            let filteredTracks = spotifyTracks;
            if (options) {
                filteredTracks = this.applyFilters(spotifyTracks, options);
            }

            // Extraire les 3 colonnes principales + contexte optionnel
            const scatterData: ScatterData[] = filteredTracks.map(track => ({
                danceability: track.danceability,
                popularity: track.popularity,
                energy: track.energy,
                track_name: track.track_name,
                artist_name: track.artist_name,
                genre: track.genre
            }));

            // Nettoyer les données (supprimer les valeurs invalides)
            const cleanData = this.cleanScatterData(scatterData);

            console.log(`${cleanData.length} enregistrements traités pour scatter plot`);
            return cleanData;

        } catch (error) {
            console.error('Erreur lors du traitement des données scatter:', error);
            return [];
        }
    }

    /**
     * Génère un CSV contenant uniquement les 3 colonnes principales
     * @param includeContext Si true, inclut track_name, artist_name, genre
     * @returns String CSV
     */
    async generateScatterCSV(includeContext: boolean = false): Promise<string> {
        const scatterData = await this.processScatterData();
        
        if (scatterData.length === 0) {
            console.warn('⚠️ Aucune donnée à exporter');
            return '';
        }

        // Définir les colonnes à inclure
        const baseColumns = ['danceability', 'popularity', 'energy'];
        const contextColumns = ['track_name', 'artist_name', 'genre'];
        const columns = includeContext ? [...baseColumns, ...contextColumns] : baseColumns;

        // Créer l'en-tête CSV
        const csvHeader = columns.join(',');

        // Créer les lignes de données
        const csvRows = scatterData.map(row => {
            return columns.map(col => {
                const value = row[col as keyof ScatterData];
                // Échapper les guillemets dans les chaînes
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',');
        });

        const csvContent = [csvHeader, ...csvRows].join('\n');
        console.log(`📄 CSV généré avec ${scatterData.length} lignes et ${columns.length} colonnes`);
        
        return csvContent;
    }

    /**
     * Sauvegarde le CSV dans le dossier public
     * @param filename Nom du fichier (défaut: 'scatter_data.csv')
     * @param includeContext Si true, inclut les colonnes contextuelles
     */
    async saveScatterCSV(filename: string = 'scatter_data.csv', includeContext: boolean = false): Promise<void> {
        try {
            const csvContent = await this.generateScatterCSV(includeContext);
            
            if (!csvContent) {
                console.error('❌ Impossible de générer le CSV');
                return;
            }

            // En environnement navigateur, on peut télécharger le fichier
            this.downloadCSV(csvContent, filename);
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde du CSV:', error);
        }
    }

    /**
     * Applique les filtres aux données
     */
    private applyFilters(tracks: SpotifyTrack[], options: FilterOptions): SpotifyTrack[] {
        return tracks.filter(track => {
            // Filtre par genres
            if (options.genres && options.genres.length > 0) {
                if (!options.genres.includes(track.genre)) {
                    return false;
                }
            }

            // Filtre par année
            if (options.yearRange) {
                const [minYear, maxYear] = options.yearRange;
                if (track.year < minYear || track.year > maxYear) {
                    return false;
                }
            }

            // Filtre par popularité
            if (options.popularityRange) {
                const [minPop, maxPop] = options.popularityRange;
                if (track.popularity < minPop || track.popularity > maxPop) {
                    return false;
                }
            }

            // Filtre par énergie
            if (options.energyRange) {
                const [minEnergy, maxEnergy] = options.energyRange;
                if (track.energy < minEnergy || track.energy > maxEnergy) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Nettoie les données scatter (supprime les valeurs invalides)
     */
    private cleanScatterData(data: ScatterData[]): ScatterData[] {
        return data.filter(item => {
            // Vérifier que les valeurs principales sont valides
            return !isNaN(item.danceability) && 
                   !isNaN(item.popularity) && 
                   !isNaN(item.energy) &&
                   item.danceability >= 0 && item.danceability <= 1 &&
                   item.popularity >= 0 && item.popularity <= 100 &&
                   item.energy >= 0 && item.energy <= 1;
        });
    }

    /**
     * Télécharge le CSV côté client
     */
    private downloadCSV(csvContent: string, filename: string): void {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log(`📥 Fichier ${filename} téléchargé`);
        }
    }
}
