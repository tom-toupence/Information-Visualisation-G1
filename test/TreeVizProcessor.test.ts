import assert from 'assert';
import { DataLoader } from '../src/data/DataLoader';
import { TreeVizProcessor } from '../src/api/treeViz';

async function testTreeVizProcessor() {
    try {
        const loader = DataLoader.getInstance();
        const tree = await loader.loadGenreTreeWithSongs();
        const processor = new TreeVizProcessor(tree);

        const rootResult = await processor.getData([], { weightBy: 'nonmusical' });
        assert(typeof rootResult === 'object', 'getData should return an object');
        assert(rootResult.type === 'genres', 'Root should return genres type');
        assert(Array.isArray(rootResult.values), 'values should be an array');
        assert(rootResult.values.length > 0, 'Root should have genre values');

        if (rootResult.values.length > 0) {
            const firstGenre = rootResult.values[0];
            const firstGenreResult = await processor.getData([firstGenre], { weightBy: 'nonmusical' });
            assert(typeof firstGenreResult === 'object', 'First genre should return an object');
            assert(['genres', 'songs'].includes(firstGenreResult.type), 'Should return genres or songs type');
            assert(Array.isArray(firstGenreResult.values), 'values should be an array');
        }

        const nonExistentResult = await processor.getData(['NonExistent'], { weightBy: 'nonmusical' });
        assert(nonExistentResult.type === 'genres', 'Non-existent should return genres type');
        assert(nonExistentResult.values.length === 0, 'Non-existent path should return empty values');

        console.log('TreeVizProcessor test passed');
        return true;
    } catch (error) {
        console.error('TreeVizProcessor test failed:', error);
        return false;
    }
}

if (require.main === module) {
    testTreeVizProcessor().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export { testTreeVizProcessor };