"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreBarChart = exports.BaseChart = exports.DataLoader = exports.Dashboard = void 0;
const Dashboard_1 = require("./dashboard/Dashboard");
// Initialisation de l'application
async function initApp() {
    try {
        console.log('🎵 Démarrage de l\'application Spotify Dashboard...');
        const dashboard = new Dashboard_1.Dashboard();
        await dashboard.init();
        // Export global pour utilisation dans le navigateur
        if (typeof window !== 'undefined') {
            window.SpotifyDashboard = dashboard;
        }
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}
// Démarrage automatique lors du chargement
if (typeof window !== 'undefined') {
    // Dans le navigateur
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    }
    else {
        initApp();
    }
}
else {
    // En Node.js
    initApp();
}
var Dashboard_2 = require("./dashboard/Dashboard");
Object.defineProperty(exports, "Dashboard", { enumerable: true, get: function () { return Dashboard_2.Dashboard; } });
var DataLoader_1 = require("./data/DataLoader");
Object.defineProperty(exports, "DataLoader", { enumerable: true, get: function () { return DataLoader_1.DataLoader; } });
var BaseChart_1 = require("./charts/BaseChart");
Object.defineProperty(exports, "BaseChart", { enumerable: true, get: function () { return BaseChart_1.BaseChart; } });
Object.defineProperty(exports, "GenreBarChart", { enumerable: true, get: function () { return BaseChart_1.GenreBarChart; } });
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
//# sourceMappingURL=index.js.map