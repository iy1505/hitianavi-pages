let map;
let markers = [];
let allData = { tourism: [], disaster: [] };
let currentMode = 'tourism';
let currentCategory = 'all';
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
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [16, 16], iconAnchor: [8, 8]
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
    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            currentCategory = 'all';
            selectedSpots = [];
            updateUI();
        });
    });

    document.querySelectorAll('[data-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => switchTab(tabBtn.getAttribute('data-tab')));
    });

    // Interest Chips Toggle
    document.querySelectorAll('.interest-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('bg-brand-500');
            chip.classList.toggle('text-white');
            chip.classList.toggle('border-brand-500');
            chip.classList.toggle('bg-white');
            chip.classList.toggle('text-slate-500');
            chip.classList.toggle('border-slate-200');
        });
    });

    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('drawer-handle');
    const toggle = document.getElementById('sidebar-toggle');
    const toggleSidebar = () => {
        sidebar.classList.toggle('translate-y-[70%]');
        sidebar.classList.toggle('translate-y-0');
    };
    handle.addEventListener('click', toggleSidebar);
    toggle.addEventListener('click', toggleSidebar);

    document.getElementById('search-input').addEventListener('input', updateList);
    document.getElementById('gps-btn').addEventListener('click', () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];
                map.flyTo(userLocation, 15);
                userMarker.setLatLng(userLocation);
                updateList();
            });
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
    document.querySelectorAll('[data-tab]').forEach(btn => {
        const active = btn.getAttribute('data-tab') === tabName;
        btn.classList.toggle('text-brand-500', active);
        btn.classList.toggle('border-brand-500', active);
        btn.classList.toggle('text-slate-400', !active);
        btn.classList.toggle('border-transparent', !active);
    });
    ['list', 'info', 'event'].forEach(p => document.getElementById(`pane-${p}`).classList.toggle('hidden', p !== tabName));
}

function updateUI() {
    const chipsContainer = document.getElementById('category-chips');
    chipsContainer.innerHTML = '';
    const categories = ['all', ...new Set(allData[currentMode].map(s => s.カテゴリ))];
    categories.forEach(cat => {
        const chip = document.createElement('button');
        const isAll = cat === 'all';
        chip.className = `flex-none px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${currentCategory === cat ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-200'}`;
        chip.textContent = isAll ? 'すべて' : cat;
        chip.onclick = () => { currentCategory = cat; updateUI(); };
        chipsContainer.appendChild(chip);
    });
    updateList();
    renderEvents();
}

function updateList() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const listContainer = document.getElementById('spot-list');
    listContainer.innerHTML = '';
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    const items = allData[currentMode].map(s => ({
        ...s,
        distance: calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度),
        isSelected: selectedSpots.some(sel => sel.No === s.No)
    }));
    const filtered = items.filter(s => {
        const matchSearch = s.スポット名.toLowerCase().includes(searchTerm) || s.説明.toLowerCase().includes(searchTerm);
        const matchCat = currentCategory === 'all' || s.カテゴリ === currentCategory;
        return matchSearch && matchCat;
    });
    filtered.sort((a, b) => (a.isSelected === b.isSelected) ? a.distance - b.distance : (a.isSelected ? -1 : 1));
    filtered.forEach(spot => {
        const color = currentMode === 'tourism' ? (spot.isSelected ? '#ef4444' : '#1b4353') : (spot.isSelected ? '#ef4444' : '#ea580c');
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><i class="fas fa-map-marker-alt fa-2x"></i></div>`,
                iconSize: [24, 24], iconAnchor: [12, 24]
            })
        }).addTo(map);
        marker.on('click', () => showDetail(spot));
        markers.push(marker);
        const card = document.createElement('div');
        card.className = `group p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${spot.isSelected ? 'bg-brand-50 border-brand-200 shadow-md ring-1 ring-brand-500/20' : 'bg-white border-slate-100 hover:border-brand-200'}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                    ${spot.isSelected ? '<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>' : ''}
                    <h4 class="font-bold text-slate-800 group-hover:text-brand-500 transition-colors">${spot.スポット名}</h4>
                </div>
                <span class="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500">${spot.distance.toFixed(1)}km</span>
            </div>
            <p class="text-[11px] text-slate-400 mb-3 flex items-center gap-1"><i class="fas fa-tag opacity-50"></i> ${spot.カテゴリ}</p>
            <div class="flex gap-2">
                <button class="select-btn flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${spot.isSelected ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-600 hover:bg-brand-500 hover:text-white'}">
                    ${spot.isSelected ? '選択解除' : '選択する'}
                </button>
                <button class="detail-btn px-4 py-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-brand-500 hover:text-white transition-all">
                    <i class="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        `;
        card.querySelector('.select-btn').onclick = (e) => { e.stopPropagation(); toggleSelect(spot); };
        card.querySelector('.detail-btn').onclick = (e) => { e.stopPropagation(); showDetail(spot); };
        card.onclick = () => { map.flyTo([spot.緯度, spot.経度], 15); showDetail(spot); };
        listContainer.appendChild(card);
    });
    document.getElementById('selected-count').textContent = `${selectedSpots.length} SELECTED`;
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
    const a = 6378137.0, b = 6356752.314245, e2 = (a*a - b*b) / (a*a);
    const r1 = lat1 * Math.PI / 180, r2 = lat2 * Math.PI / 180;
    const dy = r1 - r2, dx = (lon1 - lon2) * Math.PI / 180, p = (r1 + r2) / 2.0;
    const w = Math.sqrt(1 - e2 * Math.sin(p)*Math.sin(p)), m = a * (1 - e2) / (w*w*w), n = a / w;
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

    const time = document.getElementById('ai-time').value || "未指定";
    const budget = document.getElementById('ai-budget').value || "未指定";
    const request = document.getElementById('ai-request').value || "特になし";
    
    // Get selected interests
    const interests = Array.from(document.querySelectorAll('.interest-chip.bg-brand-500'))
                           .map(chip => chip.getAttribute('data-value'));
    
    const resContainer = document.getElementById('ai-response');
    resContainer.textContent = "AIがプランを練っています...";
    resContainer.classList.remove('hidden');

    const spots = allData.tourism.slice(0, 15).map(s => `${s.スポット名}: ${s.説明}`).join('\n');
    
    const prompt = `あなたは日田市の観光コンシェルジュです。最新の研究結果とユーザーの要望に基づき、最高のプランを提案してください。

【基本条件】
- 滞在時間: ${time}
- 予算: ${budget}
- 興味のあるカテゴリー: ${interests.length > 0 ? interests.join(', ') : '全般的'}
- 特記事項・追加要望: ${request}

【ユーザーインサイト（研究結果）】
- 女性: 「自己研鑽・新たな自分の発見・成長」につながる文化・体験を重視。
- 若者: 「景色の美しさ」「食べ物の美味しさ」「リラックス」「SNS映え」を重視。

上記の条件をすべて汲み取った上で、日田市のおすすめスポットを巡る具体的なタイムスケジュールを含めたプランを作成してください。

【スポット情報】
${spots}`;

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
    const events = [{ m: 2, n: "天領日田おひなまつり", d: "雛人形の展示" }, { m: 5, n: "日田川開き観光祭", d: "大花火大会" }, { m: 7, n: "日田祇園祭", d: "山鉾巡行" }, { m: 11, n: "千年あかり", d: "竹灯籠ライトアップ" }];
    const container = document.getElementById('event-list');
    container.innerHTML = '<h3 class="text-slate-700 font-bold text-sm mb-4">季節のイベント</h3>';
    events.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-4';
        div.innerHTML = `<div class="bg-brand-50 text-brand-500 font-bold w-10 h-10 rounded-lg flex items-center justify-center text-sm">${ev.m}月</div><div><div class="text-xs font-bold text-slate-800">${ev.n}</div><div class="text-[10px] text-slate-500">${ev.d}</div></div>`;
        container.appendChild(div);
    });
}
