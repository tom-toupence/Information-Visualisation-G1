# 🎵 SPOTIMIX - Data Visualization Platform

Plateforme de visualisation interactive des données Spotify avec architecture modulaire et système de cache intelligent.

## 📁 Structure du Projet

```
Information-Visualisation-G1/
├── index.html                  # Dashboard principal
├── scatter.html                # Scatter Plot interactif (DJ Transitions)
├── css/
│   └── style.css              # Design system SPOTIMIX
├── data/
│   ├── DataLoader.js          # ⭐ Gestion centralisée des données + Cache
│   ├── spotify_data.csv       # Dataset Spotify (~100k tracks)
│   └── music_genres_tree.json # Hiérarchie des genres
├── js/
│   ├── ScatterProcessor.js    # Traitement et filtrage
│   ├── ScatterMapper.js       # Mapping des données pour D3
│   ├── ScatterChart.js        # Visualisation D3.js
│   └── ScatterPipeline.js     # Orchestration de l'app
└── CACHE_SYSTEM.md            # 📖 Documentation du système de cache
```

## ✨ Fonctionnalités

### Dashboard (`index.html`)
- **Design SPOTIMIX** : Sidebar avec icônes, topbar, grille de panels
- **Sélecteur de genre** dans la topbar
- **Mini preview** du scatter plot dans le panel principal
- **Responsive** : S'adapte aux différentes tailles d'écran

### Scatter Plot (`scatter.html`)
- **Graphique interactif** : Energy vs Danceability
- **Brush D3** : Sélection par glisser-déposer
- **Coloration dynamique** : Points gris → colorés selon popularité quand sélectionnés
- **Panel de stats** : Moyennes, top artistes, etc.
- **Tooltip détaillé** au survol
- **Sélecteur d'année** : 2015-2023
- **Top 1000** chansons les plus populaires

## 🚀 Utilisation

### Option 1 : Serveur HTTP simple (recommandé)

```bash
cd refacto
npx http-server -p 8000 -o
```

### Option 2 : Live Server (VS Code)

1. Installer l'extension "Live Server"
2. Clic droit sur `refacto/index.html`
3. "Open with Live Server"

### Option 3 : Python

```bash
cd refacto
python -m http.server 8000
```

Puis ouvrir : **http://localhost:8000**

## 🎨 Design

- **Thème sombre** : Fond #2b2f42
- **Accent violet** : #7972a8
- **Sidebar fixe** : 68px de large
- **Topbar sticky** : Marque + sélecteur
- **Grille responsive** : 5 colonnes sur desktop

## 🏗️ Architecture Modulaire

### Pipeline de Données

```
DataLoader → Processor → Mapper → Chart
  (Cache)     (Filter)   (Transform)  (Render)
```

### 1️⃣ **DataLoader** (`data/DataLoader.js`)
- **Pattern Singleton** : Une seule instance globale
- **Triple Cache** :
  - 💾 **Memory Cache** : Instantané (Map)
  - 💾 **LocalStorage** : Persistant entre pages (24h)
  - 📥 **CSV File** : Fallback initial
- **Préférences** : Genre et année sauvegardés automatiquement
- **Performance** : 60x plus rapide avec cache mémoire

### 2️⃣ **ScatterProcessor** (`js/ScatterProcessor.js`)
- Utilise DataLoader pour charger les données
- Filtre par année et genre
- Tri par popularité (Top N)
- Validation et nettoyage

### 3️⃣ **ScatterMapper** (`js/ScatterMapper.js`)
- Transforme les données brutes en format D3
- Calcule les propriétés visuelles (taille, couleur, position)
- Prépare les métadonnées pour tooltips

### 4️⃣ **ScatterChart** (`js/ScatterChart.js`)
- Rendu D3.js avec axes dynamiques
- **Brush interactif** : Sélection par glisser-déposer
- **Mini Pie Charts** : Visualisation Danceability/Energy/Chill
- **Details on Demand** : Panneau DJ avec suggestions de transitions
- **Interactions** : Tooltip, clic, hover

### 5️⃣ **ScatterPipeline** (`js/ScatterPipeline.js`)
- Orchestration de l'application
- Gestion des événements UI (sélecteurs)
- Sauvegarde automatique des préférences

## 🔧 Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Grid, Flexbox, variables CSS
- **JavaScript ES6** : Classes, async/await, modules
- **D3.js v7** : Chargé depuis CDN
- **Font Awesome 6.5** : Icônes de la sidebar

## 📝 Modifications par rapport à la version TypeScript

✅ **Simplifié** :
- Plus de compilation TypeScript
- Plus de npm/Node.js requis
- Un seul fichier JS par page
- D3 chargé depuis CDN

✅ **Conservé** :
- Toute la logique du scatter plot
- Brush interactif
- Panel de statistiques
- Architecture Processor/Mapper/Chart

✅ **Design adapté** :
- Style SPOTIMIX exact
- Sidebar + topbar + panels
- Même palette de couleurs
- Animations fluides

## 💾 Système de Cache Intelligent

### Avantages
- ⚡ **60x plus rapide** : Memory cache (~50ms vs 3s)
- 🔄 **Navigation fluide** : Pas de rechargement entre pages
- 💾 **Persistance** : LocalStorage conserve les données 24h
- 🎯 **Préférences** : Genre et année restaurés automatiquement
- 🛡️ **Robuste** : Gestion des erreurs (quota, corruption)

### Utilisation
```javascript
// Les données sont chargées automatiquement avec cache
const tracks = await dataLoader.loadSpotifyData();

// Préférences sauvegardées automatiquement lors des changements
dataLoader.saveUserPreferences({ year: 2023, genre: 'pop' });

// Restauration automatique au chargement de la page
const prefs = dataLoader.getUserPreferences();
```

📖 **Documentation complète** : Voir [CACHE_SYSTEM.md](./CACHE_SYSTEM.md)

## 🎯 Fonctionnalités Clés - Scatter Plot

### Pour DJ - Aide aux Transitions
- 🎵 **Mini Pie Charts** : Ratio Danceability/Energy/Chill
- 🎹 **Tonalités compatibles** : Suggestions harmoniques automatiques
- ⏱️ **Plage BPM** : Recommandations pour transitions fluides
- 🔥 **Profil énergétique** : Peak hour banger vs Chill vibe
- 💡 **Guide intelligent** : Conseils basés sur tempo, key, energy

### Interactions
- **Brush** : Sélection de zone → Mini pies remplacent les points
- **Hover** : Tooltip avec infos essentielles
- **Click** : Panneau de détails avec guide DJ complet
- **Filtres** : Année + Genre (persistants entre pages)

## 🎯 Prochaines étapes

- [ ] Dashboard avec preview des visualisations
- [ ] Tree map des genres musicaux
- [ ] Timeline d'évolution des tendances
- [ ] Export des sélections (CSV, JSON)
- [ ] Service Worker pour cache offline

## 📄 Licence

MIT - Projet académique de visualisation de données

---

**Note** : Nécessite un serveur HTTP local pour le chargement des fichiers (CORS).
