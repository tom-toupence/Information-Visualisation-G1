import { Dashboard } from './dashboard/Dashboard';

// Initialisation de l'application
async function initApp(): Promise<void> {
    try {
        console.log('🎵 Démarrage de l\'application Spotify Dashboard...');

        const dashboard = new Dashboard();
        await dashboard.init();

        // Export global pour utilisation dans le navigateur
        if (typeof window !== 'undefined') {
            (window as any).SpotifyDashboard = dashboard;
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

// Démarrage automatique lors du chargement
if (typeof window !== 'undefined') {
    // Dans le navigateur
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
} else {
    // En Node.js
    initApp();
}

export { Dashboard } from './dashboard/Dashboard';
export { DataLoader } from './data/DataLoader';
export { BaseChart, GenreBarChart } from './charts/BaseChart';
export { HeatmapChart } from './charts/HeatmapChart';
export { HeatmapProcessor } from './processor/HeatmapProcessor';
export * from './types';
export * from './utils';