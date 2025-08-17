import './send.worker';
import './sync.worker';

console.log('Workers are running...');

// In a real app you might want a graceful shutdown mechanism here.
process.on('SIGINT', () => {
    console.log('Shutting down workers...');
    process.exit(0);
});