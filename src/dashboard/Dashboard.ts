import * as d3 from 'd3';
import { DataLoader } from '../data/DataLoader';
import { GenreBarChart } from '../charts/BaseChart';
import { SpotifyTrack, FilterOptions } from '../types';
import { DataUtils } from '../utils';

type Sel = d3.Selection<any, unknown, any, unknown>;

export class Dashboard {
  private dataLoader: DataLoader;
  private allTracks: SpotifyTrack[] = [];
  private filteredTracks: SpotifyTrack[] = [];
  private charts: Map<string, any> = new Map();
  private currentFilters: FilterOptions = {};

  constructor() {
    this.dataLoader = DataLoader.getInstance();
  }

  async init(): Promise<void> {
    try {
      console.log('🚀 Initialisation du Dashboard...');
      await this.loadData();
      this.createUI();
      this.createCharts();
      this.setupFilters();
      console.log('✅ Dashboard initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.showError('Erreur lors du chargement du dashboard');
    }
  }

  // --- Data ---
  private async loadData(): Promise<void> {
    this.allTracks = await this.dataLoader.loadSpotifyData();
    this.filteredTracks = [...this.allTracks];
    console.log(`📊 ${this.allTracks.length} pistes chargées`);
  }

  // --- Head assets (FontAwesome + style.css) ---
  private ensureHeadAssets(): void {
    const head = d3.select('head');

    if (head.select('link#fa-link').empty()) {
      head.append('link')
        .attr('id', 'fa-link')
        .attr('rel', 'stylesheet')
        .attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css')
        .attr('crossorigin', 'anonymous')
        .attr('referrerpolicy', 'no-referrer');
    }
    if (head.select('link#app-style').empty()) {
      head.append('link')
        .attr('id', 'app-style')
        .attr('rel', 'stylesheet')
        .attr('href', 'style.css'); // ajuste le chemin si besoin
    }
    if (head.select('meta[charset]').empty()) head.append('meta').attr('charset', 'UTF-8');
    if (head.select('meta[name="viewport"]').empty()) head.append('meta').attr('name', 'viewport').attr('content', 'width=device-width, initial-scale=1');
    if (head.select('title').empty()) head.append('title').text('Spotimix'); else head.select('title').text('Spotimix');
  }

  // --- UI (recrée l'ancien index.html) ---
  private createUI(): void {
    this.ensureHeadAssets();

    const container = d3.select('#app').empty() ? d3.select('body') : d3.select('#app');
    container.selectAll('*').remove();

    // Sidebar
    const aside = container.append('aside').attr('class', 'sidebar');
    [
      { cls: 'side-icon home', href: 'pages/heatmap.html', title: 'Graph 1', icon: 'fa-solid fa-border-all' },
      { cls: 'side-icon',      href: 'pages/bubbles.html', title: 'Graph 2', icon: 'fa-solid fa-chart-pie' },
      { cls: 'side-icon',      href: 'pages/timeline.html',title: 'Graph 3', icon: 'fa-solid fa-sliders' },
      { cls: 'side-icon',      href: 'pages/scatter.html', title: 'Graph 4', icon: 'fa-solid fa-chart-bar' },
    ].forEach(l => {
      const a = aside.append('a').attr('class', l.cls).attr('href', l.href).attr('title', l.title);
      a.append('i').attr('class', l.icon);
    });

    // Topbar
    const header = container.append('header').attr('class', 'topbar');
    header.append('h1').attr('class', 'brand').text('SPOTIMIX');
    const selectLabel = header.append('label').attr('class', 'select');
    const genreSelect = selectLabel.append('select');
    
    // Ajouter l'option par défaut
    genreSelect.append('option').text('Choisir un genre');
    
    // Extraire tous les genres uniques et les trier
    const uniqueGenres = [...new Set(this.allTracks.map(track => track.genre))]
      .filter(genre => genre && genre !== 'unknown')
      .sort((a, b) => a.localeCompare(b));
    
    // Ajouter chaque genre au select
    uniqueGenres.forEach(genre => {
      genreSelect.append('option')
        .text(genre.charAt(0).toUpperCase() + genre.slice(1))
        .attr('value', genre);
    });
    
    console.log(`🎵 ${uniqueGenres.length} genres disponibles dans le filtre`);
    
    // Ajouter la logique de filtrage pour le select de genre
    genreSelect.on('change', () => this.onGenreFilterChange());

    // Grille des panneaux
    const main = container.append('main').attr('class', 'dashboard');
    const panels = [
      { cls: 'panel--a', href: 'pages/heatmap.html', aria: 'Ouvrir Graph 1', title: 'Graph 1', chartId: 'genre-chart' },
      { cls: 'panel--b', href: 'pages/bubbles.html', aria: 'Ouvrir Graph 2', title: 'Graph 2', chartId: 'year-chart' },
      { cls: 'panel--c', href: 'pages/timeline.html', aria: 'Ouvrir Graph 3', title: 'Graph 3', chartId: 'popularity-chart' },
      { cls: 'panel--d', href: 'pages/scatter.html', aria: 'Ouvrir Graph 4', title: 'Graph 4', chartId: 'energy-chart' },
    ];
    panels.forEach(p => {
      const a = main.append('a').attr('class', `panel ${p.cls}`).attr('href', p.href).attr('aria-label', p.aria);
      a.append('div').attr('class', 'panel__title').text(p.title);
      a.append('div').attr('class', 'panel__body').append('div').attr('id', p.chartId).style('width', '100%').style('height', '100%');
    });
  }

  // --- Charts ---
  private createCharts(): void {
    const genreData = DataUtils.aggregateByGenre(this.filteredTracks);
    const genreChart = new GenreBarChart('genre-chart', { width: 350, height: 250, color: '#1db954' });
    genreChart.setData(genreData).render();
    this.charts.set('genre', genreChart);

    console.log('📈 Graphiques montés dans les panneaux');
  }

  private updateCharts(): void {
    const genreChart = this.charts.get('genre');
    if (genreChart) {
      const genreData = DataUtils.aggregateByGenre(this.filteredTracks);
      genreChart.update(genreData);
    }
    // TODO: update des autres charts
  }

  // --- Filtres ---
  private setupFilters(): void {
    console.log('🔧 Filtre de genre configuré');
  }

  private onGenreFilterChange(): void {
    const genreSelect = d3.select('.topbar select').node() as HTMLSelectElement | null;
    if (!genreSelect) return;

    const selectedGenre = genreSelect.value;
    
    if (selectedGenre === 'Choisir un genre') {
      // Aucun filtre, afficher toutes les pistes
      this.filteredTracks = [...this.allTracks];
    } else {
      // Filtrer par genre sélectionné
      this.filteredTracks = this.allTracks.filter(track => 
        track.genre.toLowerCase() === selectedGenre.toLowerCase()
      );
    }
    
    console.log(`🔍 ${this.filteredTracks.length} pistes après filtrage par genre: ${selectedGenre}`);
    this.updateCharts();
  }

  // --- Helpers / API publique ---
  private showError(message: string): void {
    const container = d3.select('body');
    container.append('div')
      .style('color', 'red')
      .style('padding', '20px')
      .style('text-align', 'center')
      .text(`❌ ${message}`);
  }

  public refresh(): void {
    this.updateCharts();
  }

  public resetFilters(): void {
    this.filteredTracks = [...this.allTracks];
    // Remettre le select à la valeur par défaut
    const genreSelect = d3.select('.topbar select').node() as HTMLSelectElement | null;
    if (genreSelect) {
      genreSelect.value = 'Choisir un genre';
    }
    this.updateCharts();
  }
}
