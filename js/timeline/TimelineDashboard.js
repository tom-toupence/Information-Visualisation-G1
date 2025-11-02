// Utilisation des classes globales définies dans timeline.html
import { TimelineChart } from './TimelineChart.js';

export class TimelineDashboard {
    constructor() {
        this.dataLoader = window.DataLoader.getInstance();
        this.allTracks = [];
        this.filteredTracks = [];
        this.timelineChart = null;
        this.currentFilters = {
            genre: '',
            minPopularity: 85
        };
    }

    async init() {
        console.log('🚀 Timeline Dashboard initializing...');
        this.showLoading('Chargement des données...');
        await this.loadData();
        this.updateLoadingMessage('Création de l\'interface...');
        this.createUI();
        this.updateLoadingMessage('Configuration des filtres...');
        await this.setupFilters(); // Rendre asynce pour charger les genres
        this.updateLoadingMessage('Génération de la timeline...');
        this.createTimeline();
        this.hideLoading();
        console.log('✅ Timeline Dashboard ready');
    }

    async loadData() {
        this.allTracks = await this.dataLoader.loadSpotifyData();
        this.applyInitialFilters();
        console.log(`📊 ${this.allTracks.length} tracks loaded, ${this.filteredTracks.length} after initial filter`);
    }

    applyInitialFilters() {
        this.filteredTracks = window.DataUtils.filterTracks(this.allTracks, {
            popularityRange: [this.currentFilters.minPopularity, 100]
        });
    }

    createUI() {
        const container = d3.select('body');
        
        // Ne pas effacer la sidebar existante, seulement le contenu principal
        container.selectAll('header, main, .loading').remove();

        // Topbar
        const header = container.append('header').attr('class', 'topbar');
        header.append('h1').attr('class', 'brand').text('SPOTIMIX');
        
        const toolbar = header.append('div').attr('class', 'toolbar');
        
        // Genre filter
        toolbar.append('label').attr('class', 'select')
            .append('select').attr('id', 'genre-filter');

        // Main content
        const main = container.append('main').attr('class', 'main-content');
        
        // Loading
        const loading = main.append('div').attr('id', 'loading').attr('class', 'loading');
        loading.append('i').attr('class', 'fa-solid fa-spinner fa-spin');
        loading.append('span').text(' Loading...');
        
        // Controls container (top right) - Only popularity
        const controlsContainer = main.append('div')
            .attr('id', 'controls-container')
            .attr('class', 'controls-container');
        
        // Popularity slider
        const popularityContainer = controlsContainer.append('div')
            .attr('class', 'popularity-bubble');
        popularityContainer.append('label').text('Popularité min: ').attr('class', 'popularity-label');
        popularityContainer.append('input')
            .attr('type', 'range')
            .attr('id', 'popularity-slider')
            .attr('class', 'slider')
            .attr('min', 0)
            .attr('max', 100)
            .attr('value', 85);
        popularityContainer.append('span').attr('id', 'popularity-value').text('85%');

        // Timeline container
        main.append('div')
            .attr('id', 'timeline-container')
            .attr('class', 'timeline-visualization')
            .style('display', 'none');
        
        // Now Playing element
        const nowPlaying = main.append('div')
            .attr('id', 'now-playing')
            .attr('class', 'now-playing');
        
        const nowPlayingHeader = nowPlaying.append('div')
            .attr('class', 'now-playing-header');
        
        nowPlayingHeader.append('i')
            .attr('class', 'fa-solid fa-music now-playing-icon');
        
        nowPlayingHeader.append('h4')
            .attr('class', 'now-playing-title')
            .text('Now Playing');
            
        // Add close button
        nowPlayingHeader.append('i')
            .attr('class', 'fa-solid fa-times now-playing-close')
            .on('click', () => {
                d3.select('#now-playing').classed('visible', false);
            });
        
        nowPlaying.append('div')
            .attr('class', 'now-playing-track')
            .attr('id', 'now-playing-track-name')
            .text('Aucune musique sélectionnée');
        
        nowPlaying.append('div')
            .attr('class', 'now-playing-artist')
            .attr('id', 'now-playing-artist-name');
        
        const nowPlayingDetails = nowPlaying.append('div')
            .attr('class', 'now-playing-details');
        
        ['genre', 'tempo', 'year'].forEach(field => {
            const detail = nowPlayingDetails.append('div')
                .attr('class', 'now-playing-detail');
            detail.append('span')
                .attr('class', 'now-playing-detail-label')
                .text(field === 'tempo' ? 'BPM' : field.charAt(0).toUpperCase() + field.slice(1));
            detail.append('span')
                .attr('class', 'now-playing-detail-value')
                .attr('id', `now-playing-${field}`);
        });
        
        // Add progress bar container
        const progressContainer = nowPlaying.append('div')
            .attr('class', 'now-playing-progress-container');
            
        const progressBar = progressContainer.append('div')
            .attr('class', 'now-playing-progress-bar');
            
        progressBar.append('div')
            .attr('class', 'now-playing-progress-fill')
            .attr('id', 'now-playing-progress-fill');
            
        const timeContainer = progressContainer.append('div')
            .attr('class', 'now-playing-time');
            
        timeContainer.append('span')
            .attr('id', 'now-playing-current-time')
            .text('0:00');
            
        timeContainer.append('span')
            .attr('id', 'now-playing-duration')
            .text('3:45');
        
        // Add playback controls
        const playbackControlsContainer = nowPlaying.append('div')
            .attr('class', 'now-playing-controls');
            
        playbackControlsContainer.append('button')
            .attr('class', 'now-playing-control-btn')
            .attr('id', 'prev-btn')
            .append('i')
            .attr('class', 'fa-solid fa-backward-step');
            
        const playPauseBtn = playbackControlsContainer.append('button')
            .attr('class', 'now-playing-control-btn play-pause')
            .attr('id', 'play-pause-btn')
            .on('click', () => this.togglePlayPause());
            
        playPauseBtn.append('i')
            .attr('class', 'fa-solid fa-play')
            .attr('id', 'play-pause-icon');
            
        playbackControlsContainer.append('button')
            .attr('class', 'now-playing-control-btn')
            .attr('id', 'next-btn')
            .append('i')
            .attr('class', 'fa-solid fa-forward-step');
        
        // Initialize player state
        this.isPlaying = false;
        this.progressInterval = null;
        
        // Créer la légende
        this.createLegend();
    }
    
    createLegend() {
        // Supprimer la légende existante
        d3.select('.genre-legend').remove();
        
        // Couleurs modernes basées sur les autres pages
        const genreColors = {
            'pop': '#6eb6ff',
            'rock': '#ff7f0e', 
            'hip-hop': '#2ca02c',
            'rap': '#2ca02c', // Même couleur que hip-hop
            'electronic': '#d62728',
            'electro': '#d62728', // Même couleur qu'electronic
            'dance': '#9467bd',
            'jazz': '#8c564b',
            'country': '#e377c2',
            'folk': '#7f7f7f',
            'metal': '#bcbd22',
            'classical': '#17becf',
            'reggae': '#5be7a9',
            'blues': '#ff6ad5',
            'latin': '#8e98c9',
            'r&b': '#FFB64D',
            'indie': '#6eb6ff',
            'alternative': '#ff7f0e',
            'punk': '#d62728',
            'soul': '#e377c2'
        };
        
        // Récupérer tous les genres uniques dans les données filtrées
        const uniqueGenres = [...new Set(this.filteredTracks.map(track => track.genre || track.track_genre))];
        
        // Créer la div de légende
        const legendDiv = d3.select('body')
            .append('div')
            .attr('class', 'genre-legend');
            
        // Ajouter chaque item de légende pour les genres présents
        uniqueGenres.forEach(genre => {
            if (genre) {
                const color = genreColors[genre.toLowerCase()] || '#999999'; // Couleur par défaut
                const item = legendDiv.append('div')
                    .attr('class', 'legend-item');
                    
                item.append('div')
                    .attr('class', 'legend-circle')
                    .style('background-color', color);
                    
                item.append('span')
                    .text(genre.charAt(0).toUpperCase() + genre.slice(1));
            }
        });
    }

    async setupFilters() {
        // Charger les genres disponibles depuis music_genres_tree.json
        const genreSelect = d3.select('#genre-filter');
        
        console.log('Chargement des genres disponibles...');
        try {
            const genres = await this.dataLoader.getAvailableGenres();
            console.log(`${genres.length} genres chargés depuis music_genres_tree.json`);
            
            // Vider le sélecteur et ajouter l'option "Tous"
            genreSelect.selectAll('*').remove();
            genreSelect.append('option')
                .attr('value', '')
                .text('Tous les genres');
            
            // Ajouter tous les genres triés
            genres.forEach(genre => {
                genreSelect.append('option')
                    .attr('value', genre)
                    .text(genre.charAt(0).toUpperCase() + genre.slice(1));
            });

            // Restaurer la préférence sauvegardée (si on vient d'une autre page)
            const prefs = this.dataLoader.getUserPreferences();
            if (prefs.genre) {
                genreSelect.property('value', prefs.genre);
                this.currentFilters.genre = prefs.genre;
                console.log('Genre restauré depuis préférences:', prefs.genre);
                // Réappliquer les filtres avec le genre restauré
                this.onFiltersChange();
            }
        } catch (error) {
            console.error('Erreur chargement genres:', error);
            // Fallback vers les genres hardcodés en cas d'erreur
            ['Tous les genres', 'Pop', 'Rock', 'Rap', 'Electro'].forEach(genre => {
                genreSelect.append('option')
                    .attr('value', genre === 'Tous les genres' ? '' : genre.toLowerCase())
                    .text(genre);
            });
        }
        
        genreSelect.on('change', () => {
            const selectedGenre = genreSelect.property('value');
            // Sauvegarder la préférence pour les autres pages
            this.dataLoader.saveUserPreferences({ genre: selectedGenre });
            this.onFiltersChange();
        });
        
        const slider = d3.select('#popularity-slider');
        slider.on('input', () => {
            const value = slider.property('value');
            d3.select('#popularity-value').text(value + '%');
            this.onFiltersChange();
        });
    }

    onFiltersChange() {
        const selectedGenre = d3.select('#genre-filter').property('value');
        const minPopularity = +d3.select('#popularity-slider').property('value');
        
        this.currentFilters.genre = selectedGenre;
        this.currentFilters.minPopularity = minPopularity;
        
        this.filteredTracks = this.allTracks.filter(track => {
            // Filtrage par popularité
            if (track.popularity < minPopularity) return false;
            
            // Filtrage par genre (support des deux champs genre et track_genre)
            if (selectedGenre && selectedGenre !== '') {
                const trackGenre = track.genre || track.track_genre || '';
                return trackGenre.toLowerCase().includes(selectedGenre.toLowerCase());
            }
            
            return true;
        });
        
        console.log(`🔍 ${this.filteredTracks.length} tracks after filtering (genre: ${selectedGenre || 'tous'}, popularity: ${minPopularity}%)`);
        
        if (this.timelineChart) {
            this.timelineChart.updateData(this.filteredTracks);
        }
        
        // Mettre à jour la légende avec les nouveaux genres visibles
        this.createLegend();
    }

    createTimeline() {
        const container = d3.select('#timeline-container');
        
        this.timelineChart = new TimelineChart(container.node(), {
            width: window.innerWidth - 68,
            height: window.innerHeight - 100
        });
        
        this.timelineChart.setData(this.filteredTracks);
        this.timelineChart.render();
        
        this.timelineChart.on('trackSelected', (track) => this.showTrackDetails(track));
    }

    showTrackDetails(track) {
        // Update Now Playing
        this.updateNowPlaying(track);
    }

    updateNowPlaying(track) {
        if (!track) {
            // Show placeholder when no track is selected
            d3.select('#now-playing-track-name').text('Aucune musique sélectionnée');
            d3.select('#now-playing-artist-name').text('Cliquez sur un point pour écouter');
            d3.select('#now-playing-genre').text('-');
            d3.select('#now-playing-tempo').text('-');
            d3.select('#now-playing-year').text('-');
            
            // Show the now playing element but with placeholder content
            d3.select('#now-playing').classed('visible', true);
            return;
        }
        
        // Update track information
        d3.select('#now-playing-track-name').text(track.track_name);
        d3.select('#now-playing-artist-name').text(track.artist_name);
        d3.select('#now-playing-genre').text(track.genre || track.track_genre || 'Unknown');
        d3.select('#now-playing-tempo').text(Math.round(track.tempo));
        d3.select('#now-playing-year').text(track.year);
        
        // Update duration based on track data (convert ms to mm:ss)
        if (track.duration_ms) {
            const minutes = Math.floor(track.duration_ms / 60000);
            const seconds = Math.floor((track.duration_ms % 60000) / 1000);
            d3.select('#now-playing-duration').text(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        
        // Reset progress when new track is selected
        this.resetProgress();
        
        // Show the now playing element
        d3.select('#now-playing').classed('visible', true);
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        
        const icon = d3.select('#play-pause-icon');
        const progressFill = d3.select('#now-playing-progress-fill');
        
        if (this.isPlaying) {
            // Change to pause icon
            icon.attr('class', 'fa-solid fa-pause');
            
            // Start progress animation
            progressFill.classed('playing', true);
            
            // Start fake time counter
            this.startProgressCounter();
        } else {
            // Change to play icon
            icon.attr('class', 'fa-solid fa-play');
            
            // Pause progress animation
            progressFill.classed('playing', false);
            
            // Stop time counter
            this.stopProgressCounter();
        }
    }

    startProgressCounter() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        let currentSeconds = 0;
        this.progressInterval = setInterval(() => {
            currentSeconds++;
            const minutes = Math.floor(currentSeconds / 60);
            const seconds = currentSeconds % 60;
            d3.select('#now-playing-current-time').text(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            
            // Reset after 15 seconds (duration of animation)
            if (currentSeconds >= 15) {
                this.resetProgress();
            }
        }, 1000);
    }

    stopProgressCounter() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    resetProgress() {
        this.isPlaying = false;
        d3.select('#play-pause-icon').attr('class', 'fa-solid fa-play');
        d3.select('#now-playing-progress-fill').classed('playing', false);
        d3.select('#now-playing-current-time').text('0:00');
        this.stopProgressCounter();
    }

    showLoading(message = 'Chargement...') {
        // Créer ou afficher l'écran de chargement
        let loadingScreen = d3.select('#loading-screen');
        if (loadingScreen.empty()) {
            loadingScreen = d3.select('body')
                .append('div')
                .attr('id', 'loading-screen')
                .style('position', 'fixed')
                .style('top', '0')
                .style('left', '0')
                .style('width', '100%')
                .style('height', '100%')
                .style('background', 'rgba(0, 0, 0, 0.8)')
                .style('display', 'flex')
                .style('flex-direction', 'column')
                .style('justify-content', 'center')
                .style('align-items', 'center')
                .style('z-index', '9999')
                .style('color', 'white')
                .style('font-family', 'Arial, sans-serif');
            
            // Spinner animé
            loadingScreen.append('div')
                .style('width', '50px')
                .style('height', '50px')
                .style('border', '5px solid #333')
                .style('border-top', '5px solid #6eb6ff')
                .style('border-radius', '50%')
                .style('animation', 'spin 1s linear infinite')
                .style('margin-bottom', '20px');
            
            // Message de chargement
            loadingScreen.append('div')
                .attr('id', 'loading-message')
                .style('font-size', '18px')
                .style('text-align', 'center');
            
            // Ajouter l'animation CSS
            if (!d3.select('#loading-spinner-style').node()) {
                d3.select('head').append('style')
                    .attr('id', 'loading-spinner-style')
                    .text(`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `);
            }
        }
        
        loadingScreen.style('display', 'flex');
        d3.select('#loading-message').text(message);
    }

    updateLoadingMessage(message) {
        d3.select('#loading-message').text(message);
    }

    hideLoading() {
        d3.select('#loading-screen').style('display', 'none');
        d3.select('#loading').style('display', 'none');
        d3.select('#timeline-container').style('display', 'block');
        
        // Show the Now Playing element with placeholder
        this.updateNowPlaying(null);
    }
}

// Global initialization
let timelineDashboard;

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        timelineDashboard = new TimelineDashboard();
        await timelineDashboard.init();
        window.timelineDashboard = timelineDashboard;
    });
}