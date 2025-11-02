// Instances globales
const processor = new ScatterDataProcessor();
const mapper = new ScatterDataMapper();
let currentChart = null;

/**
 * Met à jour le badge d'information du cache
 * @param {Object} cacheInfo - Informations sur le cache
 */
function updateCacheBadge(cacheInfo) {
    const badge = document.getElementById('cache-badge');
    const status = document.getElementById('cache-status');
    
    if (!badge || !status) return;

    if (cacheInfo.hasMemoryCache) {
        badge.style.display = 'block';
        status.textContent = `In Memory (${cacheInfo.trackCount.toLocaleString()} tracks)`;
        badge.style.background = 'rgba(94, 231, 169, 0.2)';
        badge.style.color = '#5be7a9';
    } else if (cacheInfo.isLoading) {
        badge.style.display = 'block';
        status.textContent = 'Loading...';
        badge.style.background = 'rgba(255, 182, 77, 0.2)';
        badge.style.color = '#FFB64D';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Rend le scatter plot pour une année et un genre donnés
 * @param {number} year - Année à afficher
 * @param {string} genre - Genre à filtrer (vide = tous les genres)
 */
async function renderScatter(year, genre = '') {
    const loading = document.getElementById('loading');
    const container = document.getElementById('scatter-viz');
    
    // Afficher le loading
    loading.style.display = 'block';
    container.innerHTML = '';

    try {
        // ÉTAPE 1 : Charger et traiter les données
        const genreText = genre ? ` (genre: ${genre})` : '';
        console.log(`Étape 1 : ScatterProcessor pour ${year}${genreText}...`);
        const rawData = await processor.processScatterData(year, 1000, genre);
        
        if (rawData.length === 0) {
            const message = genre ? 
                `Aucune donnée disponible pour cette année et ce genre` :
                `Aucune donnée disponible pour cette année`;
            container.innerHTML = `<p class="error">${message}</p>`;
            loading.style.display = 'none';
            return;
        }

        // ÉTAPE 2 : Mapper les données pour la visualisation
        console.log('Étape 2 : ScatterMapper...');
        const mappedData = mapper.mapForVisualization(rawData);

        // ÉTAPE 3 : Créer et afficher le graphique
        console.log('Étape 3 : ScatterChart...');
        // Le ScatterChart prend maintenant automatiquement toute la place disponible
        currentChart = new ScatterChart('scatter-viz');
        
        currentChart.visualize(mappedData);

        // Masquer le loading
        loading.style.display = 'none';

        console.log('Pipeline terminée !');

    } catch (error) {
        console.error('Erreur:', error);
        container.innerHTML = '<p class="error">Erreur lors du chargement des données</p>';
        loading.style.display = 'none';
    }
}

// ============================================================================
// INITIALISATION
// ============================================================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initialisation du Scatter Plot...');
    console.log('Pipeline : DataLoader → ScatterProcessor → ScatterMapper → ScatterChart');

    // Récupérer les sélecteurs
    const yearSelect = document.getElementById('year-select');
    const genreSelect = document.getElementById('genre-select');

    // Charger les genres disponibles depuis music_genres_tree.json
    console.log('Chargement des genres disponibles...');
    try {
        const genres = await window.dataLoader.getAvailableGenres();
        console.log(`${genres.length} genres chargés depuis music_genres_tree.json`);
        
        // Vider le sélecteur et ajouter l'option "Tous"
        genreSelect.innerHTML = '<option value="">Tous les genres</option>';
        
        // Ajouter tous les genres triés
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
            genreSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur chargement genres:', error);
    }

    // Charger les préférences utilisateur depuis le LocalStorage
    const prefs = window.dataLoader.getUserPreferences();
    console.log('Préférences chargées:', prefs);

    // Appliquer les préférences aux sélecteurs
    if (prefs.year) {
        yearSelect.value = prefs.year;
    }
    if (prefs.genre !== undefined) {
        genreSelect.value = prefs.genre;
    }

    // Afficher les infos du cache
    const cacheInfo = window.dataLoader.getCacheInfo();
    console.log('Cache info:', cacheInfo);

    // Mettre à jour le badge de cache
    updateCacheBadge(cacheInfo);

    // Charger avec les valeurs des préférences
    renderScatter(parseInt(yearSelect.value), genreSelect.value);

    // Écouter les changements d'année
    yearSelect.addEventListener('change', (e) => {
        const year = parseInt(e.target.value);
        const genre = genreSelect.value;
        console.log(`\n📅 Changement d'année: ${year}`);
        
        // Sauvegarder la préférence
        window.dataLoader.saveUserPreferences({ year, genre });
        
        renderScatter(year, genre);
    });

    // Écouter les changements de genre
    genreSelect.addEventListener('change', (e) => {
        const genre = e.target.value;
        const year = parseInt(yearSelect.value);
        console.log(`\nChangement de genre: ${genre || 'Tous les genres'}`);
        
        // Sauvegarder la préférence
        window.dataLoader.saveUserPreferences({ year, genre });
        
        renderScatter(year, genre);
    });
});
