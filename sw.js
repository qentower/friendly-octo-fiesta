/* Personal Wordly static shell. Source audio is not bulk-downloaded. */
const CACHE='wordly-final-swipe-v3';
const SHELL=['./','index.html','assets/module-1.js','assets/module-2.js','assets/module-3.js','assets/vocabulary.js','assets/module-5.js','assets/module-6.js','assets/module-7.js','assets/module-8.js','assets/grammar.js','assets/app.js?v=swipe-v3','assets/swipe.css?v=swipe-v3','manifest.webmanifest','icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('wordly-final-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==location.origin)return;if(url.pathname.includes('/assets/audio/'))return;
if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('index.html',copy));}return res;}).catch(()=>caches.match('index.html')));return;}
event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));});
