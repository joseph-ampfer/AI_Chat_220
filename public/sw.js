self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => console.log('SW activated'));
self.addEventListener('fetch', e => { /* just let everything pass through */ });
