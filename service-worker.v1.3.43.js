importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAdxJQfsIspb5sdPeVMQ5Zu_5X3GjDBTYg",
    authDomain: "costguard.firebaseapp.com",
    projectId: "costguard",
    storageBucket: "costguard.firebasestorage.app",
    messagingSenderId: "873736687737",
    appId: "1:873736687737:web:be444e90d27f23364544a8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
    console.log('📬 Firebase BG Message:', payload);
    const { title, body, icon } = payload.notification || {};
    self.registration.showNotification(title || 'Notification', { body, icon });
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    let payload = {};
    try {
        payload = JSON.parse(event.notification.title);
    } catch (err) {
        console.warn('❌ Could not parse JSON from notification title:', err);
    }

    const encoded = encodeURIComponent(JSON.stringify(payload));
    const targetUrl = `/push-action?data=${encoded}`;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
            const existing = clientsArr.find(c => c.url.includes('/') && 'focus' in c);
            if (existing) return existing.focus();
            return clients.openWindow(targetUrl);
        })
    );
});

const CACHE_NAME = 'cg-static-v1.3.43';
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/custom.css',
    '/js/app.js',
    '/js/sta-api.js',
    '/js/sta-config.js',
    '/js/sta-io.js',
    '/js/sta-nebula.js',
    '/js/sta-socket.js',
    '/js/sta-state.js',
    '/js/stripe.js',
    '/favicon/favicon.ico',
    '/favicon/icon-192.png',
    '/favicon/icon-512.png',
    '/manifest.json'
];

console.log('🔥 SW loaded: version 1.3.43');

self.addEventListener('install', event => {
    console.log('📦 Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('🚀 Activated');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(res => res || fetch(event.request))
    );
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        console.log('⏩ Skipping waiting');
        self.skipWaiting();
    }
});
