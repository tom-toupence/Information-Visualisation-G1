import assert from 'assert';
import { DataLoader } from '../src/data/DataLoader';

async function testDataLoader() {
    try {
        const loader = DataLoader.getInstance();

        const tree = await loader.loadGenreTreeWithSongs();
        assert(tree, 'Tree should be loaded');
        assert(typeof tree.name === 'string', 'Tree should have name property');
        assert(Array.isArray(tree.songs), 'Tree should have songs array');

        if (tree.children && tree.children.length > 0) {
            const firstChild = tree.children[0];
            assert(typeof firstChild.name === 'string', 'Child should have name');
            assert(Array.isArray(firstChild.songs), 'Child should have songs array');
        }

        console.log('DataLoader test passed');
        return true;
    } catch (error) {
        console.error('DataLoader test failed:', error);
        return false;
    }
}

if (require.main === module) {
    testDataLoader().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export { testDataLoader };