/// <reference types="node" />

import './send.worker';
import './sync.worker';

console.log('Workers are running...');

// In a real app you might want a graceful shutdown mechanism here.
(process as any).on('SIGINT', () => {
    console.log('Shutting down workers...');
    (process as any).exit(0);
});