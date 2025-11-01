// Bundle pour navigateur - pas de modules CommonJS
class Dashboard {
  constructor() {
    this.dataLoader = new DataLoader();
    this.allTracks = [];
    this.filteredTracks = [];
    this.charts = new Map();
    this.currentFilters = {};
  }

  async init() {
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

  async loadData() {
    this.allTracks = await this.dataLoader.loadSpotifyData();
    this.filteredTracks = [...this.allTracks];
    console.log(`📊 ${this.allTracks.length} pistes chargées`);
  }

  ensureHeadAssets() {
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
        .attr('href', 'style.css');
    }
    if (head.select('meta[charset]').empty()) head.append('meta').attr('charset', 'UTF-8');
    if (head.select('meta[name="viewport"]').empty()) head.append('meta').attr('name', 'viewport').attr('content', 'width=device-width, initial-scale=1');
    if (head.select('title').empty()) head.append('title').text('Spotimix'); 
    else head.select('title').text('Spotimix');
  }

  createUI() {
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
    ['Choisir un genre', 'Pop', 'Rock', 'Rap', 'Electro'].forEach(t => genreSelect.append('option').text(t));
    
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

  createCharts() {
    const genreData = DataUtils.aggregateByGenre(this.filteredTracks);
    const genreChart = new GenreBarChart('genre-chart', { width: 350, height: 250, color: '#1db954' });
    genreChart.setData(genreData).render();
    this.charts.set('genre', genreChart);

    console.log('📈 Graphiques montés dans les panneaux');
  }

  updateCharts() {
    const genreChart = this.charts.get('genre');
    if (genreChart) {
      const genreData = DataUtils.aggregateByGenre(this.filteredTracks);
      genreChart.update(genreData);
    }
  }

  setupFilters() {
    console.log('🔧 Filtre de genre configuré');
  }

  onGenreFilterChange() {
    const genreSelect = d3.select('.topbar select').node();
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

  showError(message) {
    const container = d3.select('body');
    container.append('div')
      .style('color', 'red')
      .style('padding', '20px')
      .style('text-align', 'center')
      .text(`❌ ${message}`);
  }

  refresh() {
    this.applyFilters();
  }

  resetFilters() {
    this.currentFilters = {};
    this.filteredTracks = [...this.allTracks];
    this.updateCharts();
  }
}

// DataLoader pour navigateur
class DataLoader {
  constructor() {
    this.cache = new Map();
  }

  static getInstance() {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadSpotifyData() {
    const cacheKey = 'spotify_data';

    if (this.cache.has(cacheKey)) {
      console.log('📦 Données chargées depuis le cache');
      return this.cache.get(cacheKey);
    }

    try {
      console.log('🔄 Chargement des données Spotify...');

      const rawData = await d3.csv('spotify_data.csv');
      const spotifyTracks = this.parseSpotifyData(rawData);

      this.cache.set(cacheKey, spotifyTracks);

      console.log(`✅ ${spotifyTracks.length} pistes chargées avec succès`);
      return spotifyTracks;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      return this.getDefaultData();
    }
  }

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

  parseNumber(value, defaultValue) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

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
}

// Classes Chart pour navigateur
class BaseChart {
  constructor(containerId, config = {}) {
    this.config = {
      width: 400,
      height: 300,
      margin: { top: 20, right: 30, bottom: 40, left: 40 },
      color: 'steelblue',
      animation: true,
      ...config
    };

    this.margin = this.config.margin;
    this.data = [];

    this.svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  getInnerWidth() {
    return this.config.width - this.margin.left - this.margin.right;
  }

  getInnerHeight() {
    return this.config.height - this.margin.top - this.margin.bottom;
  }

  setData(data) {
    this.data = data;
    return this;
  }

  render() {
    this.createScales();
    this.drawChart();
    this.drawAxes();
    return this;
  }

  update(newData) {
    this.data = newData;
    this.updateChart();
    return this;
  }

  onElementClick(event, d) {
    console.log('Element clicked:', d);
  }

  onElementHover(event, d) {
    // Override dans les classes filles
  }

  onElementLeave(event, d) {
    // Override dans les classes filles
  }
}

class GenreBarChart extends BaseChart {
  createScales() {
    this.xScale = d3.scaleBand()
      .domain(this.data.map(d => d.genre))
      .range([0, this.getInnerWidth()])
      .padding(0.1);

    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => d.count) || 0])
      .nice()
      .range([this.getInnerHeight(), 0]);
  }

  drawChart() {
    const bars = this.g.selectAll('.bar')
      .data(this.data, d => d.genre);

    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(d.genre) || 0)
      .attr('y', this.getInnerHeight())
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', this.config.color || 'steelblue')
      .style('cursor', 'pointer');

    const barsUpdate = barsEnter.merge(bars);

    if (this.config.animation) {
      barsUpdate.transition()
        .duration(750)
        .attr('x', d => this.xScale(d.genre) || 0)
        .attr('y', d => this.yScale(d.count))
        .attr('width', this.xScale.bandwidth())
        .attr('height', d => this.getInnerHeight() - this.yScale(d.count));
    } else {
      barsUpdate
        .attr('x', d => this.xScale(d.genre) || 0)
        .attr('y', d => this.yScale(d.count))
        .attr('width', this.xScale.bandwidth())
        .attr('height', d => this.getInnerHeight() - this.yScale(d.count));
    }

    barsUpdate
      .on('click', this.onElementClick.bind(this))
      .on('mouseover', this.onElementHover.bind(this))
      .on('mouseout', this.onElementLeave.bind(this));

    bars.exit()
      .transition()
      .duration(500)
      .attr('height', 0)
      .attr('y', this.getInnerHeight())
      .remove();
  }

  drawAxes() {
    this.g.select('.x-axis').remove();
    this.g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.getInnerHeight()})`)
      .call(d3.axisBottom(this.xScale));

    this.g.select('.y-axis').remove();
    this.g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale));
  }

  updateChart() {
    this.createScales();
    this.drawChart();
    this.drawAxes();
  }

  onElementHover(event, d) {
    d3.select(event.currentTarget)
      .attr('fill', '#ff6b6b');

    console.log(`Genre: ${d.genre}, Count: ${d.count}`);
  }

  onElementLeave(event, d) {
    d3.select(event.currentTarget)
      .attr('fill', this.config.color || 'steelblue');
  }
}

// Utilitaires de données
class DataUtils {
  static aggregateByGenre(tracks) {
    const grouped = d3.group(tracks, d => d.genre);

    return Array.from(grouped, ([genre, tracks]) => ({
      genre,
      count: tracks.length,
      avgPopularity: d3.mean(tracks, d => d.popularity) || 0,
      avgEnergy: d3.mean(tracks, d => d.energy) || 0,
      avgDanceability: d3.mean(tracks, d => d.danceability) || 0
    }));
  }

  static aggregateByYear(tracks) {
    const grouped = d3.group(tracks, d => d.year);

    return Array.from(grouped, ([year, tracks]) => ({
      year,
      count: tracks.length,
      avgPopularity: d3.mean(tracks, d => d.popularity) || 0
    })).sort((a, b) => a.year - b.year);
  }

  static filterTracks(tracks, filters) {
    return tracks.filter(track => {
      if (filters.genres && filters.genres.length > 0) {
        if (!filters.genres.includes(track.genre)) return false;
      }

      if (filters.yearRange) {
        const [minYear, maxYear] = filters.yearRange;
        if (track.year < minYear || track.year > maxYear) return false;
      }

      if (filters.popularityRange) {
        const [minPop, maxPop] = filters.popularityRange;
        if (track.popularity < minPop || track.popularity > maxPop) return false;
      }

      return true;
    });
  }

  static getUniqueGenres(tracks) {
    return Array.from(new Set(tracks.map(t => t.genre))).sort();
  }

  static getYearRange(tracks) {
    const years = tracks.map(t => t.year);
    return [Math.min(...years), Math.max(...years)];
  }
}

// Initialisation automatique
async function initApp() {
  try {
    console.log('🎵 Démarrage de l\'application Spotify Dashboard...');

    const dashboard = new Dashboard();
    await dashboard.init();

    // Export global pour utilisation dans le navigateur
    if (typeof window !== 'undefined') {
      window.SpotifyDashboard = dashboard;
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
}

// Démarrage automatique lors du chargement
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
} else {
  initApp();
}