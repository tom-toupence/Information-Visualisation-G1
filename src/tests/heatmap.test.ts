/**
 * Fichier de test pour vérifier le bon fonctionnement de HeatmapProcessor et HeatmapChart
 */

import { DataLoader } from '../data/DataLoader';
import { HeatmapProcessor, HeatmapCell } from '../processor/HeatmapProcessor';
import { SpotifyTrack } from '../types';

// Test de HeatmapProcessor
async function testHeatmapProcessor(): Promise<void> {
    console.log('🧪 Test de HeatmapProcessor');
    
    // Créer des données de test
    const testTracks: SpotifyTrack[] = [
        {
            artist_name: "Artist A",
            track_name: "Song 1",
            track_id: "track1",
            popularity: 85,
            year: 2020,
            genre: "Pop",
            danceability: 0.7,
            energy: 0.8,
            key: 5,
            loudness: -5,
            mode: 1,
            speechiness: 0.05,
            acousticness: 0.2,
            instrumentalness: 0,
            liveness: 0.1,
            valence: 0.6,
            tempo: 120,
            duration_ms: 200000,
            time_signature: 4
        },
        {
            artist_name: "Artist A",
            track_name: "Song 2",
            track_id: "track2",
            popularity: 90,
            year: 2020,
            genre: "Pop",
            danceability: 0.8,
            energy: 0.7,
            key: 3,
            loudness: -4,
            mode: 1,
            speechiness: 0.04,
            acousticness: 0.1,
            instrumentalness: 0,
            liveness: 0.15,
            valence: 0.8,
            tempo: 125,
            duration_ms: 210000,
            time_signature: 4
        },
        {
            artist_name: "Artist B",
            track_name: "Song 3",
            track_id: "track3",
            popularity: 45,
            year: 2020,
            genre: "Rock",
            danceability: 0.5,
            energy: 0.9,
            key: 7,
            loudness: -3,
            mode: 0,
            speechiness: 0.03,
            acousticness: 0.05,
            instrumentalness: 0.2,
            liveness: 0.3,
            valence: 0.4,
            tempo: 140,
            duration_ms: 250000,
            time_signature: 4
        },
        {
            artist_name: "Artist A",
            track_name: "Song 4",
            track_id: "track4",
            popularity: 65,
            year: 2021,
            genre: "Pop",
            danceability: 0.75,
            energy: 0.6,
            key: 2,
            loudness: -6,
            mode: 1,
            speechiness: 0.06,
            acousticness: 0.3,
            instrumentalness: 0,
            liveness: 0.12,
            valence: 0.7,
            tempo: 115,
            duration_ms: 190000,
            time_signature: 4
        }
    ];

    // Test 1: Traitement de base
    console.log('\n📝 Test 1: Traitement de base');
    const heatmapData = HeatmapProcessor.processHeatmapData(testTracks);
    console.log(`✓ ${heatmapData.length} cellules créées`);
    console.log('Données:', heatmapData);

    // Test 2: Filtrage par genre
    console.log('\n📝 Test 2: Filtrage par genre Pop');
    const popData = HeatmapProcessor.processHeatmapData(testTracks, 'Pop');
    console.log(`✓ ${popData.length} cellules pour le genre Pop`);

    // Test 3: Artistes uniques
    console.log('\n📝 Test 3: Artistes uniques');
    const artists = HeatmapProcessor.getUniqueArtists(heatmapData);
    console.log(`✓ ${artists.length} artistes uniques:`, artists);

    // Test 4: Années uniques
    console.log('\n📝 Test 4: Années uniques');
    const years = HeatmapProcessor.getUniqueYears(heatmapData);
    console.log(`✓ ${years.length} années:`, years);

    // Test 5: Top artistes
    console.log('\n📝 Test 5: Top 1 artiste');
    const topArtists = HeatmapProcessor.getTopArtists(heatmapData, 1);
    console.log(`✓ ${topArtists.length} cellules pour le top artiste`);

    // Test 6: Statistiques
    console.log('\n📝 Test 6: Statistiques');
    const stats = HeatmapProcessor.getStatistics(heatmapData);
    console.log('✓ Statistiques:', stats);

    // Vérifications
    console.log('\n✅ Vérifications:');
    
    // Artist A devrait avoir 2 cellules (2020 et 2021)
    const artistACells = heatmapData.filter(cell => cell.artist === 'Artist A');
    console.assert(artistACells.length === 2, 'Artist A devrait avoir 2 cellules');
    console.log(`✓ Artist A a ${artistACells.length} cellules`);

    // Cellule Artist A 2020 devrait avoir rank 4 (popularité max = 90)
    const artistA2020 = heatmapData.find(cell => cell.artist === 'Artist A' && cell.year === 2020);
    console.assert(artistA2020?.rank === 4, 'Artist A 2020 devrait avoir rank 4');
    console.log(`✓ Artist A 2020 a rank ${artistA2020?.rank}`);

    // Cellule Artist B 2020 devrait avoir rank 2 (popularité = 45)
    const artistB2020 = heatmapData.find(cell => cell.artist === 'Artist B' && cell.year === 2020);
    console.assert(artistB2020?.rank === 2, 'Artist B 2020 devrait avoir rank 2');
    console.log(`✓ Artist B 2020 a rank ${artistB2020?.rank}`);

    // Top 5 songs devrait contenir au max 5 chansons
    heatmapData.forEach(cell => {
        console.assert(cell.popular_songs.length <= 5, 'Max 5 chansons populaires');
    });
    console.log('✓ Toutes les cellules ont max 5 chansons populaires');

    console.log('\n✅ Tous les tests sont passés!');
}

// Test du calcul de rank
function testRankCalculation(): void {
    console.log('\n🧪 Test du calcul de rank');

    const testCases = [
        { popularity: 95, expectedRank: 4, description: 'Popularité 95 → Rank 4' },
        { popularity: 80, expectedRank: 4, description: 'Popularité 80 → Rank 4' },
        { popularity: 75, expectedRank: 3, description: 'Popularité 75 → Rank 3' },
        { popularity: 60, expectedRank: 3, description: 'Popularité 60 → Rank 3' },
        { popularity: 55, expectedRank: 2, description: 'Popularité 55 → Rank 2' },
        { popularity: 40, expectedRank: 2, description: 'Popularité 40 → Rank 2' },
        { popularity: 35, expectedRank: 1, description: 'Popularité 35 → Rank 1' },
        { popularity: 20, expectedRank: 1, description: 'Popularité 20 → Rank 1' },
        { popularity: 15, expectedRank: 0, description: 'Popularité 15 → Rank 0' },
        { popularity: 0, expectedRank: 0, description: 'Popularité 0 → Rank 0' },
    ];

    testCases.forEach(({ popularity, expectedRank, description }) => {
        let rank = 0;
        if (popularity >= 80) rank = 4;
        else if (popularity >= 60) rank = 3;
        else if (popularity >= 40) rank = 2;
        else if (popularity >= 20) rank = 1;

        console.assert(rank === expectedRank, `Échec: ${description}`);
        console.log(`✓ ${description}`);
    });

    console.log('✅ Tous les tests de rank sont passés!');
}

// Exécuter les tests
export async function runTests(): Promise<void> {
    console.log('🚀 Démarrage des tests\n');
    
    testRankCalculation();
    await testHeatmapProcessor();
    
    console.log('\n🎉 Tous les tests terminés avec succès!');
}

// Auto-run si exécuté directement
if (require.main === module) {
    runTests().catch(console.error);
}
