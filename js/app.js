let map;
let markers = [];
let allData = { tourism: [], disaster: [] };
let currentMode = 'tourism';
let userLocation = [33.3219, 130.9414];
let selectedSpots = [];
let userMarker;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadData();
    setupEventListeners();
    updateUI();
});

function initMap() {
    map = L.map('map', { zoomControl: false }).setView(userLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
}

async function loadData() {
    try {
        const response = await fetch('spots.json');
        allData = await response.json();
    } catch (error) {
        console.error("Error loading spots data:", error);
    }
}

function setupEventListeners() {
    // Mode Switch
    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            selectedSpots = [];
            updateUI();
        });
    });

    // Tab Switch
    document.querySelectorAll('[data-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            const target = tabBtn.getAttribute('data-tab');
            switchTab(target);
        });
    });

    // Sidebar Toggle (Mobile Drawer)
    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('drawer-handle');
    const toggle = document.getElementById('sidebar-toggle');
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('translate-y-[70%]');
        sidebar.classList.toggle('translate-y-0');
    };

    handle.addEventListener('click', toggleSidebar);
    toggle.addEventListener('click', toggleSidebar);

    // Search & Filter
    document.getElementById('search-input').addEventListener('input', updateList);
    document.getElementById('category-filter').addEventListener('change', updateList);

    // GPS
    document.getElementById('gps-btn').addEventListener('click', () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];
                map.flyTo(userLocation, 15);
                userMarker.setLatLng(userLocation);
                updateList();
            }, () => alert("位置情報の取得に失敗しました。"));
        }
    });

    document.getElementById('optimize-btn').addEventListener('click', optimizeRoute);
    document.getElementById('clear-btn').addEventListener('click', () => {
        selectedSpots = [];
        updateUI();
    });
    document.getElementById('ai-btn').addEventListener('click', callGemini);
}

function switchTab(tabName) {
    // Buttons UI
    document.querySelectorAll('[data-tab]').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('text-brand-500', 'border-brand-500');
            btn.classList.remove('text-slate-400', 'border-transparent');
        } else {
            btn.classList.remove('text-brand-500', 'border-brand-500');
            btn.classList.add('text-slate-400', 'border-transparent');
        }
    });

    // Panes UI
    document.getElementById('pane-list').classList.toggle('hidden', tabName !== 'list');
    document.getElementById('pane-info').classList.toggle('hidden', tabName !== 'info');
    document.getElementById('pane-event').classList.toggle('hidden', tabName !== 'event');
}

function updateUI() {
    const filter = document.getElementById('category-filter');
    filter.innerHTML = '<option value="all">すべてのカテゴリー</option>';
    const categories = [...new Set(allData[currentMode].map(s => s.カテゴリ))];
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filter.appendChild(opt);
    });

    updateList();
    renderEvents();
}

function updateList() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const listContainer = document.getElementById('spot-list');
    listContainer.innerHTML = '';

    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const filtered = allData[currentMode].filter(s => {
        const matchSearch = s.スポット名.toLowerCase().includes(searchTerm) || s.説明.toLowerCase().includes(searchTerm);
        const matchCat = category === 'all' || s.カテゴリ === category;
        return matchSearch && matchCat;
    });

    filtered.forEach(s => s.distance = calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度));
    filtered.sort((a, b) => a.distance - b.distance);

    filtered.forEach(spot => {
        const isSelected = selectedSpots.some(s => s.No === spot.No);
        const color = currentMode === 'tourism' ? (isSelected ? '#ef4444' : '#1b4353') : (isSelected ? '#ef4444' : '#ea580c');
        
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><i class="fas fa-map-marker-alt fa-2x"></i></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })
        }).addTo(map).bindPopup(`<b class="text-brand-500">${spot.スポット名}</b><br><span class="text-xs text-slate-500">${spot.カテゴリ}</span>`);
        
        marker.on('click', () => showDetail(spot));
        markers.push(marker);

        // Spot Card
        const card = document.createElement('div');
        card.className = `group p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-brand-50 border-brand-200 shadow-md' : 'bg-white border-slate-100 hover:border-brand-200 hover:shadow-sm'}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-slate-800 group-hover:text-brand-500 transition-colors">${spot.スポット名}</h4>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">${spot.distance.toFixed(1)}km</span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-1 mb-3">${spot.カテゴリ}</p>
            <div class="flex gap-2">
                <button class="select-btn flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isSelected ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-500 hover:text-white'}">
                    ${isSelected ? 'Deselect' : 'Select'}
                </button>
                <button class="detail-btn px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-500 hover:text-white transition-all">
                    <i class="fas fa-info-circle text-xs"></i>
                </button>
            </div>
        `;
        
        card.querySelector('.select-btn').onclick = (e) => { e.stopPropagation(); toggleSelect(spot); };
        card.querySelector('.detail-btn').onclick = (e) => { e.stopPropagation(); showDetail(spot); };
        card.onclick = () => { map.flyTo([spot.緯度, spot.経度], 15); showDetail(spot); };
        listContainer.appendChild(card);
    });

    document.getElementById('selected-count').textContent = `${selectedSpots.length} spots selected`;
}

function toggleSelect(spot) {
    const idx = selectedSpots.findIndex(s => s.No === spot.No);
    if (idx >= 0) selectedSpots.splice(idx, 1);
    else selectedSpots.push(spot);
    updateList();
}

function showDetail(spot) {
    document.getElementById('detail-title').textContent = spot.スポット名;
    document.getElementById('detail-desc').textContent = spot.説明;
    document.getElementById('spot-detail-view').classList.remove('hidden');
    switchTab('info');
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const a = 6378137.000;
    const b = 6356752.314245;
    const e2 = (Math.pow(a, 2) - Math.pow(b, 2)) / Math.pow(a, 2);
    const lat1Rad = lat1 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;
    const dy = lat1Rad - lat2Rad;
    const dx = lon1Rad - lon2Rad;
    const p = (lat1Rad + lat2Rad) / 2.0;
    const w = Math.sqrt(1 - e2 * Math.pow(Math.sin(p), 2));
    const m = a * (1 - e2) / Math.pow(w, 3);
    const n = a / w;
    return Math.sqrt(Math.pow(dy * m, 2) + Math.pow(dx * n * Math.cos(p), 2)) / 1000;
}

function optimizeRoute() {
    if (selectedSpots.length < 1) return alert("スポットを選択してください。");
    let currentPos = [...userLocation], unvisited = [...selectedSpots], route = [], totalDist = 0;
    while (unvisited.length > 0) {
        let nearestIdx = -1;
        if (currentMode === 'tourism') {
            let dists = unvisited.map(s => calculateDistance(currentPos[0], currentPos[1], s.緯度, s.経度));
            let waits = unvisited.map(s => s.待ち時間 || 0);
            let sDists = [...dists].sort((a,b)=>a-b), sWaits = [...waits].sort((a,b)=>a-b);
            let minScore = Infinity;
            for(let i=0; i<unvisited.length; i++) {
                let score = (sDists.indexOf(dists[i])+1) + (sWaits.indexOf(waits[i])+1);
                if(score < minScore) { minScore = score; nearestIdx = i; }
            }
        } else {
            let minDist = Infinity;
            for(let i=0; i<unvisited.length; i++) {
                let d = calculateDistance(currentPos[0], currentPos[1], unvisited[i].緯度, unvisited[i].経度);
                if(d < minDist) { minDist = d; nearestIdx = i; }
            }
        }
        const next = unvisited.splice(nearestIdx, 1)[0];
        route.push(next);
        totalDist += calculateDistance(currentPos[0], currentPos[1], next.緯度, next.経度);
        currentPos = [next.緯度, next.経度];
    }
    displayRoute(route, totalDist);
}

function displayRoute(route, totalDist) {
    const stats = document.getElementById('route-stats');
    stats.innerHTML = `<p class="font-bold text-brand-500">総距離: ${totalDist.toFixed(2)}km</p><div class="space-y-1 mt-2">${route.map((s,i)=>`<div>${i+1}. ${s.スポット名}</div>`).join('')}</div>`;
    document.getElementById('route-info').classList.remove('hidden');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${route[route.length-1].緯度},${route[route.length-1].経度}&waypoints=${route.slice(0,-1).map(s=>`${s.緯度},${s.経度}`).join('|')}&travelmode=${currentMode==='tourism'?'driving':'walking'}`;
    document.getElementById('gmaps-link-btn').onclick = () => window.open(url, '_blank');
    if (window.polyline) map.removeLayer(window.polyline);
    window.polyline = L.polyline([userLocation, ...route.map(s=>[s.緯度,s.経度])], {color: '#1b4353', weight: 4, opacity: 0.6, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(window.polyline.getBounds(), { padding: [50, 50] });
    switchTab('info');
}

async function callGemini() {
    const key = document.getElementById('gemini-key').value;
    if (!key) return alert("API Keyが必要です");
    const resContainer = document.getElementById('ai-response');
    resContainer.textContent = "AI思考中...";
    resContainer.classList.remove('hidden');
    const spots = allData.tourism.slice(0, 8).map(s => `${s.スポット名}: ${s.説明}`).join('\n');
    const prompt = `あなたは日田市の観光コンシェルジュです。研究結果に基づき、女性には「自己研鑽・発見」、若者には「SNS映え・リラックス」を意識したプランを、時間:${document.getElementById('ai-time').value}、予算:${document.getElementById('ai-budget').value}で提案してください。\n${spots}`;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        resContainer.textContent = data.candidates[0].content.parts[0].text;
    } catch (e) { resContainer.textContent = "エラー: " + e.message; }
}

function renderEvents() {
    const events = [
        { m: 2, n: "天領日田おひなまつり", d: "雛人形の展示" },
        { m: 5, n: "日田川開き観光祭", d: "大花火大会" },
        { m: 7, n: "日田祇園祭", d: "山鉾巡行" },
        { m: 11, n: "千年あかり", d: "竹灯籠ライトアップ" }
    ];
    const container = document.getElementById('event-list');
    container.innerHTML = '<h3 class="text-slate-700 font-bold text-sm mb-4">季節のイベント</h3>';
    events.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-4';
        div.innerHTML = `<div class="bg-brand-50 text-brand-500 font-bold w-10 h-10 rounded-lg flex items-center justify-center text-sm">${ev.m}月</div><div><div class="text-xs font-bold text-slate-800">${ev.n}</div><div class="text-[10px] text-slate-500">${ev.d}</div></div>`;
        container.appendChild(div);
    });
}
