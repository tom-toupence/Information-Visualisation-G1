import { testDataLoader } from './DataLoader.test';
import { testTreeVizProcessor } from './TreeVizProcessor.test';

async function runTests() {
    console.log('Running TypeScript tests...\n');

    const results: { name: string, passed: boolean }[] = [];

    console.log('Running DataLoader test...');
    const dataLoaderResult = await testDataLoader();
    results.push({ name: 'DataLoader', passed: dataLoaderResult });

    console.log('\nRunning TreeVizProcessor test...');
    const treeVizResult = await testTreeVizProcessor();
    results.push({ name: 'TreeVizProcessor', passed: treeVizResult });

    console.log('\n=== Test Results ===');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(result => {
        console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
    });

    console.log(`\nResults: ${passed}/${total} tests passed`);

    if (passed < total) {
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});