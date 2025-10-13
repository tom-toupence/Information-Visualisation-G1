import * as d3 from 'd3';
import { DataLoader } from '../data/DataLoader';
import { GenreBarChart } from '../charts/BaseChart';
import { SpotifyTrack, FilterOptions } from '../types';
import { DataUtils } from '../utils';

export class Dashboard {
    private dataLoader: DataLoader;
    private allTracks: SpotifyTrack[] = [];
    private filteredTracks: SpotifyTrack[] = [];
    private charts: Map<string, any> = new Map();
    private currentFilters: FilterOptions = {};

    constructor() {
        this.dataLoader = DataLoader.getInstance();
    }

    // Initialisation du dashboard
    async init(): Promise<void> {
        try {
            console.log('🚀 Initialisation du Dashboard...');

            // Charger les données
            await this.loadData();

            // Créer l'interface
            this.createUI();

            // Créer les graphiques
            this.createCharts();

            // Configurer les filtres
            this.setupFilters();

            console.log('✅ Dashboard initialisé avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement du dashboard');
        }
    }

    // Chargement des données
    private async loadData(): Promise<void> {
        this.allTracks = await this.dataLoader.loadSpotifyData();
        this.filteredTracks = [...this.allTracks];

        console.log(`📊 ${this.allTracks.length} pistes chargées`);
    }

    // Création de l'interface utilisateur
    private createUI(): void {
        const container = d3.select('#dashboard-container') || d3.select('body');

        // Effacer le contenu existant
        container.selectAll('*').remove();

        // Header
        const header = container.append('div')
            .attr('class', 'dashboard-header')
            .style('padding', '20px')
            .style('background', '#f8f9fa')
            .style('border-bottom', '1px solid #dee2e6');

        header.append('h1')
            .text('🎵 Spotify Music Dashboard')
            .style('margin', '0')
            .style('color', '#1db954');

        header.append('p')
            .text(`Analyse de ${this.allTracks.length} pistes musicales`)
            .style('margin', '5px 0 0 0')
            .style('color', '#666');

        // Filters section
        const filtersSection = container.append('div')
            .attr('class', 'filters-section')
            .style('padding', '20px')
            .style('background', '#fff')
            .style('border-bottom', '1px solid #dee2e6')
            .style('display', 'flex')
            .style('gap', '20px')
            .style('flex-wrap', 'wrap');

        // Charts container
        const chartsContainer = container.append('div')
            .attr('class', 'charts-container')
            .style('padding', '20px')
            .style('display', 'grid')
            .style('grid-template-columns', 'repeat(auto-fit, minmax(400px, 1fr))')
            .style('gap', '20px');

        // Chart cards
        this.createChartCard(chartsContainer, 'genre-chart', 'Répartition par Genre');
        this.createChartCard(chartsContainer, 'year-chart', 'Évolution par Année');
        this.createChartCard(chartsContainer, 'popularity-chart', 'Popularité par Genre');
        this.createChartCard(chartsContainer, 'energy-chart', 'Énergie vs Danceabilité');
    }

    // Création d'une carte de graphique
    private createChartCard(container: any, chartId: string, title: string): void {
        const card = container.append('div')
            .attr('class', 'chart-card')
            .style('background', 'white')
            .style('border-radius', '8px')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
            .style('padding', '20px');

        card.append('h3')
            .text(title)
            .style('margin', '0 0 15px 0')
            .style('color', '#333');

        card.append('div')
            .attr('id', chartId)
            .style('width', '100%')
            .style('height', '300px');
    }

    // Création des graphiques
    private createCharts(): void {
        // Graphique des genres
        const genreData = DataUtils.aggregateByGenre(this.filteredTracks);
        const genreChart = new GenreBarChart('genre-chart', {
            width: 350,
            height: 250,
            color: '#1db954'
        });

        genreChart.setData(genreData).render();
        this.charts.set('genre', genreChart);

        // TODO: Ajouter d'autres graphiques (year, popularity, energy)
        console.log('📈 Graphiques créés');
    }

    // Configuration des filtres
    private setupFilters(): void {
        const filtersSection = d3.select('.filters-section');

        // Filtre par genre
        this.createGenreFilter(filtersSection);

        // Filtre par année
        this.createYearFilter(filtersSection);

        // Filtre par popularité
        this.createPopularityFilter(filtersSection);

        console.log('🔧 Filtres configurés');
    }

    // Filtre des genres
    private createGenreFilter(container: any): void {
        const filterDiv = container.append('div')
            .attr('class', 'filter-group');

        filterDiv.append('label')
            .text('Genres:')
            .style('display', 'block')
            .style('margin-bottom', '5px')
            .style('font-weight', 'bold');

        const select = filterDiv.append('select')
            .attr('multiple', true)
            .style('width', '200px')
            .style('height', '100px')
            .style('padding', '5px')
            .on('change', () => this.onFiltersChange());

        const genres = DataUtils.getUniqueGenres(this.allTracks);
        select.selectAll('option')
            .data(genres)
            .enter()
            .append('option')
            .attr('value', (d: string) => d)
            .text((d: string) => d);
    }

    // Filtre des années
    private createYearFilter(container: any): void {
        const filterDiv = container.append('div')
            .attr('class', 'filter-group');

        filterDiv.append('label')
            .text('Années:')
            .style('display', 'block')
            .style('margin-bottom', '5px')
            .style('font-weight', 'bold');

        const [minYear, maxYear] = DataUtils.getYearRange(this.allTracks);

        const rangeDiv = filterDiv.append('div')
            .style('display', 'flex')
            .style('gap', '10px')
            .style('align-items', 'center');

        rangeDiv.append('input')
            .attr('type', 'number')
            .attr('id', 'year-min')
            .attr('min', minYear)
            .attr('max', maxYear)
            .attr('value', minYear)
            .style('width', '80px')
            .on('change', () => this.onFiltersChange());

        rangeDiv.append('span').text(' - ');

        rangeDiv.append('input')
            .attr('type', 'number')
            .attr('id', 'year-max')
            .attr('min', minYear)
            .attr('max', maxYear)
            .attr('value', maxYear)
            .style('width', '80px')
            .on('change', () => this.onFiltersChange());
    }

    // Filtre de popularité
    private createPopularityFilter(container: any): void {
        const filterDiv = container.append('div')
            .attr('class', 'filter-group');

        filterDiv.append('label')
            .text('Popularité:')
            .style('display', 'block')
            .style('margin-bottom', '5px')
            .style('font-weight', 'bold');

        const rangeDiv = filterDiv.append('div')
            .style('display', 'flex')
            .style('gap', '10px')
            .style('align-items', 'center');

        rangeDiv.append('input')
            .attr('type', 'range')
            .attr('id', 'popularity-min')
            .attr('min', 0)
            .attr('max', 100)
            .attr('value', 0)
            .style('width', '100px')
            .on('input', () => this.onFiltersChange());

        rangeDiv.append('span')
            .attr('id', 'popularity-display')
            .text('0 - 100');

        rangeDiv.append('input')
            .attr('type', 'range')
            .attr('id', 'popularity-max')
            .attr('min', 0)
            .attr('max', 100)
            .attr('value', 100)
            .style('width', '100px')
            .on('input', () => this.onFiltersChange());
    }

    // Gestionnaire de changement de filtres
    private onFiltersChange(): void {
        // Récupérer les valeurs des filtres
        const genreSelect = d3.select('.filters-section select').node() as HTMLSelectElement;
        const selectedGenres = Array.from(genreSelect.selectedOptions).map(option => option.value);

        const yearMin = +(d3.select('#year-min').node() as HTMLInputElement).value;
        const yearMax = +(d3.select('#year-max').node() as HTMLInputElement).value;

        const popMin = +(d3.select('#popularity-min').node() as HTMLInputElement).value;
        const popMax = +(d3.select('#popularity-max').node() as HTMLInputElement).value;

        // Mettre à jour l'affichage de la popularité
        d3.select('#popularity-display').text(`${popMin} - ${popMax}`);

        // Construire les filtres
        this.currentFilters = {
            genres: selectedGenres.length > 0 ? selectedGenres : undefined,
            yearRange: [yearMin, yearMax],
            popularityRange: [popMin, popMax]
        };

        // Appliquer les filtres
        this.applyFilters();
    }

    // Application des filtres
    private applyFilters(): void {
        this.filteredTracks = DataUtils.filterTracks(this.allTracks, this.currentFilters);

        console.log(`🔍 ${this.filteredTracks.length} pistes après filtrage`);

        // Mettre à jour les graphiques
        this.updateCharts();
    }

    // Mise à jour des graphiques
    private updateCharts(): void {
        const genreChart = this.charts.get('genre');
        if (genreChart) {
            const genreData = DataUtils.aggregateByGenre(this.filteredTracks);
            genreChart.update(genreData);
        }

        // TODO: Mettre à jour les autres graphiques
    }

    // Affichage d'erreur
    private showError(message: string): void {
        const container = d3.select('#dashboard-container') || d3.select('body');

        container.append('div')
            .style('color', 'red')
            .style('padding', '20px')
            .style('text-align', 'center')
            .text(`❌ ${message}`);
    }

    // Méthodes publiques
    public refresh(): void {
        this.applyFilters();
    }

    public resetFilters(): void {
        this.currentFilters = {};
        this.filteredTracks = [...this.allTracks];
        this.updateCharts();
    }
}