# 🎵 SPOTIMIX - Refacto HTML/CSS/JS

Version simplifiée du projet de visualisation Spotify, sans TypeScript ni Node.js.

## 📁 Structure

```
refacto/
├── index.html              # Dashboard principal (style SPOTIMIX)
├── scatter.html            # Page Scatter Plot interactive
├── css/
│   └── style.css          # Tous les styles
├── js/
│   ├── dashboard.js       # Logique du dashboard + preview
│   └── scatter.js         # Scatter Plot complet (Processor + Mapper + Chart)
└── data/
    ├── spotify_data.csv   # Données Spotify
    └── music_genres_tree.json
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

## 📊 Architecture du code

### `js/scatter.js` (tout-en-un)

```javascript
// 1. ScatterDataProcessor
//    → Charge et filtre les données CSV

// 2. ScatterDataMapper  
//    → Mappe les données pour D3 (couleur, taille, etc.)

// 3. ScatterChart
//    → Rend le graphique avec D3
//    → Gère le brush et les interactions

// 4. Application principale
//    → Initialise et orchestre le tout
```

### `js/dashboard.js`

```javascript
// Crée un mini preview du scatter avec données aléatoires
// Gère le sélecteur de genre (préparé pour futur filtrage)
```

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

## 🎯 Prochaines étapes

- [ ] Ajouter les autres visualisations (Graph 2, 3, 4)
- [ ] Implémenter le filtrage par genre dans le dashboard
- [ ] Créer un tree map des genres
- [ ] Ajouter une timeline
- [ ] Export des sélections en CSV

## 📄 Licence

MIT - Projet de visualisation de données

---

**Note** : Ce projet nécessite un serveur HTTP (CORS) pour charger les fichiers CSV et JSON.
