// service‑workers.js

// Import Firebase core + messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey:    "AIzaSyAdxJQfsIspb5sdPeVMQ5Zu_5X3GjDBTYg",
    authDomain:"costguard.firebaseapp.com",
    projectId: "costguard",
    storageBucket:"costguard.firebasestorage.app",
    messagingSenderId:"873736687737",
    appId:     "1:873736687737:web:be444e90d27f23364544a8"
});

// Helper to forward logs into the page
function swLog(msg, data) {
    clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(wins => wins.forEach(w => w.postMessage({ type: 'sw-log', msg, data })));
    console.log('[SW]', msg, data);
}

// Top‑level log so we know this build is active
swLog('⚡️ SW loaded v1.3.16', null);

// Handle incoming push
self.addEventListener('push', event => {
    let payload = {};
    if (event.data) {
        try { payload = event.data.json(); }
        catch (e) { swLog('push: invalid JSON', event.data.text()); }
    }
    swLog('Push received', payload);

    const title = payload.notification?.title || 'Notification';
    const options = {
        body: payload.notification?.body || '',
        icon: '/favicon/favicon.ico',
        data: payload.data || payload
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const data = event.notification.data || {};
    swLog('Notification click', data);

    const hash = '#notification=' + encodeURIComponent(JSON.stringify(data));

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(wins => {
                if (wins.length) {
                    const w = wins[0];
                    // send payload before navigating
                    w.postMessage({ type: 'notification-click', data });
                    w.focus();
                    return w.navigate('/' + hash);
                }
                return clients.openWindow('/' + hash)
                    .then(newWin => {
                        if (newWin) newWin.postMessage({ type: 'notification-click', data });
                    });
            })
    );
});

const CACHE_NAME = 'costguard-v1.3.16';
const urlsToCache = [
    '/index.html',
    '/cache.manifest',
    '/favicon/apple-touch-icon.png',
    '/favicon/favicon.ico',
    '/favicon/icon-192.png',
    '/favicon/icon-512.png',
    '/favicon/icon-maskable.png',
    '/css/custom.css',
    '/css/cutestrap.css',
    '/js/app.js',
    '/js/custom.js',
    '/js/sta-api.js',
    '/js/sta-config.js',
    '/js/sta-io.js',
    '/js/sta-nebula.js',
    '/js/sta-socket.js',
    '/js/sta-state.js',
    '/js/stripe.js'
];

// Install: cache shell assets
self.addEventListener('install', event => {
    swLog('install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate: cleanup old caches, take control
self.addEventListener('activate', event => {
    swLog('activate');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(old => caches.delete(old))
            )
        ).then(() => {
            self.clients.claim();
        })
    );
});

// Fetch: respond from cache first
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(resp => resp || fetch(event.request))
    );
});
