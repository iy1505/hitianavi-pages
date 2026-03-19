let map;
let markers = [];
let allData = { tourism: [], disaster: [] };
let currentMode = 'tourism';
let currentCategory = 'all';
let userLocation = [33.3219, 130.9414];
let selectedSpots = [];
let userMarker;

document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadData();
    setupEventListeners();
    initBottomSheet();
    updateUI();
});

function initMap() {
    map = L.map('map', { zoomControl: false, tap: false }).setView(userLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [20, 20], iconAnchor: [10, 10]
        })
    }).addTo(map);
}

async function loadData() {
    try {
        const response = await fetch('spots.json');
        allData = await response.json();
    } catch (e) { console.error(e); }
}

function setupEventListeners() {
    document.querySelectorAll('input[name="mode"]').forEach(r => {
        r.onchange = (e) => {
            currentMode = e.target.value; currentCategory = 'all'; selectedSpots = [];
            if (window.polyline) map.removeLayer(window.polyline);
            document.getElementById('route-info').classList.add('hidden');
            updateUI(); switchTab('list');
        };
    });

    document.querySelectorAll('[data-tab]').forEach(b => {
        b.onclick = () => switchTab(b.getAttribute('data-tab'));
    });

    document.getElementById('search-input').oninput = updateList;
    document.getElementById('gps-btn').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(p => {
                userLocation = [p.coords.latitude, p.coords.longitude];
                map.flyTo(userLocation, 15);
                userMarker.setLatLng(userLocation);
                updateList();
            }, () => alert("GPSが使えません"));
        }
    };

    document.getElementById('optimize-btn').onclick = optimizeRoute;
    document.getElementById('clear-btn').onclick = () => resetAll();
    document.getElementById('ai-btn').onclick = callGemini;
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('modal-overlay').onclick = closeModal;
    document.getElementById('add-more-btn').onclick = () => {
        if (window.innerWidth < 768) setBottomSheetPos('mid');
        switchTab('list');
    };
    document.getElementById('reset-route-btn').onclick = resetAll;
}

function initBottomSheet() {
    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('drawer-handle');
    if (!handle || window.innerWidth >= 768) return;

    let startY, startTranslateY;
    const screenHeight = window.innerHeight;
    const midY = screenHeight * 0.45;
    const lowY = screenHeight * 0.85 - 110;

    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
        startTranslateY = matrix.m42;
        sidebar.classList.add('dragging');
    });

    handle.addEventListener('touchmove', (e) => {
        const deltaY = e.touches[0].clientY - startY;
        let newY = startTranslateY + deltaY;
        if (newY < 0) newY *= 0.2;
        sidebar.style.transform = `translateY(${newY}px)`;
    });

    handle.addEventListener('touchend', (e) => {
        sidebar.classList.remove('dragging');
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
        const currentY = matrix.m42;
        sidebar.style.transform = '';

        if (currentY < midY / 2) setBottomSheetPos('full');
        else if (currentY < lowY - (lowY - midY) / 2) setBottomSheetPos('mid');
        else setBottomSheetPos('low');
    });
}

function setBottomSheetPos(pos) {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 768) return;
    if (pos === 'full') sidebar.classList.add('open'), sidebar.style.transform = 'translateY(0)';
    else if (pos === 'mid') sidebar.classList.add('open'), sidebar.style.transform = 'translateY(45vh)';
    else sidebar.classList.remove('open'), sidebar.style.transform = '';
}

function resetAll() {
    selectedSpots = [];
    if (window.polyline) map.removeLayer(window.polyline);
    document.getElementById('route-info').classList.add('hidden');
    updateUI(); switchTab('list');
}

function switchTab(tabName) {
    ['list', 'info', 'extra'].forEach(t => {
        const active = (t === tabName);
        const btn = document.getElementById(`tab-btn-${t}`);
        const pane = document.getElementById(`pane-${t}`);
        if (btn) {
            btn.classList.toggle('text-brand-500', active);
            btn.classList.toggle('border-brand-500', active);
            btn.classList.toggle('text-slate-400', !active);
            btn.classList.toggle('border-transparent', !active);
        }
        if (pane) pane.classList.toggle('hidden', !active);
    });
    // 検索セクションは「Find」タブのみ表示
    document.getElementById('search-section').classList.toggle('hidden', tabName !== 'list');
    
    // タブ切り替え時にトップへスクロール
    document.getElementById('sidebar-scroll-area').scrollTop = 0;
}

function updateUI() {
    const infoTabBtn = document.getElementById('tab-btn-info');
    const extraTabBtn = document.getElementById('tab-btn-extra');
    const isMobile = window.innerWidth < 768;

    if (currentMode === 'tourism') {
        infoTabBtn.textContent = isMobile ? 'ルート' : '決定ルート・AI';
        extraTabBtn.textContent = 'イベント';
        setupTourismAIUI(); renderEvents();
    } else {
        infoTabBtn.textContent = isMobile ? '相談' : 'AI防災相談';
        extraTabBtn.textContent = '防災情報';
        setupDisasterAIUI(); renderDisasterInfo();
    }
    const chips = document.getElementById('category-chips');
    chips.innerHTML = '';
    ['all', ...new Set(allData[currentMode].map(s => s.カテゴリ))].forEach(cat => {
        const b = document.createElement('button');
        const active = currentCategory === cat;
        const colorClass = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
        b.className = `flex-none px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${active ? colorClass + ' text-white border-transparent' : 'bg-white text-slate-400 border-slate-200'}`;
        b.innerText = (cat === 'all' ? 'すべて' : cat).toUpperCase();
        b.onclick = () => { currentCategory = cat; updateUI(); };
        chips.appendChild(b);
    });
    updateList();
}

function setupTourismAIUI() {
    document.getElementById('ai-title-text').innerText = 'AI観光ガイド';
    document.getElementById('ai-input-1').placeholder = '滞在時間';
    document.getElementById('ai-input-2').placeholder = '予算';
    document.getElementById('ai-btn').innerText = 'AIプランを作成';
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = '';
    ['歴史', '自然', 'グルメ'].forEach(v => {
        const b = document.createElement('button');
        b.className = 'interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500';
        b.innerText = v;
        b.onclick = () => {
            b.classList.toggle('bg-brand-500'); b.classList.toggle('text-white');
            b.classList.toggle('bg-white'); b.classList.toggle('text-slate-500');
        };
        interests.appendChild(b);
    });
}

function setupDisasterAIUI() {
    document.getElementById('ai-title-text').innerText = 'AI防災相談';
    document.getElementById('ai-input-1').placeholder = '家族構成';
    document.getElementById('ai-input-2').placeholder = '予算';
    document.getElementById('ai-btn').innerText = '必要なものを聞く';
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = '';
    ['食料', '衛生', '停電'].forEach(v => {
        const b = document.createElement('button');
        b.className = 'interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500';
        b.innerText = v;
        b.onclick = () => {
            b.classList.toggle('bg-red-600'); b.classList.toggle('text-white');
            b.classList.toggle('bg-white'); b.classList.toggle('text-slate-500');
        };
        interests.appendChild(b);
    });
}

function updateList() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const list = document.getElementById('spot-list');
    list.innerHTML = '';
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const items = allData[currentMode].map(s => ({
        ...s, dist: calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度),
        sel: selectedSpots.some(x => x.No === s.No)
    }));

    const filtered = items.filter(s => {
        const mSearch = s.スポット名.toLowerCase().includes(search) || s.説明.toLowerCase().includes(search);
        const mCat = currentCategory === 'all' || s.カテゴリ === currentCategory;
        return (mSearch && mCat) || s.sel;
    }).sort((a, b) => (a.sel === b.sel) ? a.dist - b.dist : (a.sel ? -1 : 1));

    filtered.forEach(spot => {
        const color = currentMode === 'tourism' ? (spot.sel ? '#ef4444' : '#1b4353') : (spot.sel ? '#ef4444' : '#ea580c');
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({
                className: 'm-icon',
                html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><i class="fas fa-map-marker-alt ${spot.sel ? 'fa-3x' : 'fa-2x'}"></i></div>`,
                iconSize: spot.sel ? [36,36] : [24,24], iconAnchor: spot.sel ? [18,36] : [12,24]
            })
        }).addTo(map);
        marker.on('click', () => { showDetail(spot); setBottomSheetPos('low'); });
        markers.push(marker);

        const intro = spot.説明.split(/[。！!？?]/)[0] + '。';
        const card = document.createElement('div');
        card.className = `p-5 rounded-[32px] border transition-all ${spot.sel ? 'bg-brand-50 border-brand-300 shadow-md' : 'bg-white border-slate-100 shadow-sm'}`;
        card.innerHTML = `<div class="flex justify-between items-start mb-1"><div class="flex-1 pr-2"><h4 class="font-black text-slate-800 text-sm leading-tight">${spot.スポット名}</h4><p class="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">${intro}</p></div><div class="text-right flex-none"><span class="text-[9px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500 block mb-1">${spot.dist.toFixed(1)}km</span><span class="text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 text-slate-400 block truncate max-w-[60px]">${spot.カテゴリ}</span></div></div><div class="flex gap-2 mt-4"><button class="s-btn flex-1 py-2.5 rounded-2xl text-[10px] font-black transition-all ${spot.sel ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-600'}">${spot.sel ? '消す' : 'ここへ行く'}</button><button class="d-btn px-4 py-2.5 rounded-2xl bg-slate-50 text-slate-400"><i class="fas fa-chevron-right text-xs"></i></button></div>`;
        card.onclick = () => { map.flyTo([spot.緯度, spot.経度], 15); };
        card.querySelector('.s-btn').onclick = (e) => { e.stopPropagation(); toggleSelect(spot); };
        card.querySelector('.d-btn').onclick = (e) => { e.stopPropagation(); showDetail(spot); };
        list.appendChild(card);
    });
}

function showDetail(spot) {
    document.getElementById('detail-title').innerText = spot.スポット名;
    document.getElementById('detail-desc').innerText = spot.説明;
    const btn = document.getElementById('modal-select-btn');
    const isSel = selectedSpots.some(s => s.No === spot.No);
    btn.innerText = isSel ? 'えらんだ場所から消す' : 'ここへ行く場所に追加';
    btn.className = `w-full py-4 rounded-2xl text-sm font-bold shadow-lg ${isSel ? 'bg-red-500' : 'bg-brand-500'}`;
    btn.onclick = () => { toggleSelect(spot); closeModal(); };
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('detail-modal').classList.add('hidden'); }

function toggleSelect(spot) {
    const i = selectedSpots.findIndex(s => s.No === spot.No);
    if (i >= 0) selectedSpots.splice(i, 1); else selectedSpots.push(spot);
    updateList();
    document.getElementById('selected-count').innerText = `${selectedSpots.length}SELECTED`;
}

function calculateDistance(l1, o1, l2, o2) {
    const a = 6378137.0, b = 6356752.314245, e2 = (a*a - b*b) / (a*a);
    const r1 = l1 * Math.PI / 180, r2 = l2 * Math.PI / 180;
    const dy = r1 - r2, dx = (o1 - o2) * Math.PI / 180, p = (r1 + r2) / 2.0;
    const w = Math.sqrt(1 - e2 * Math.sin(p)*Math.sin(p)), m = a * (1 - e2) / (w*w*w), n = a / w;
    return Math.sqrt(Math.pow(dy * m, 2) + Math.pow(dx * n * Math.cos(p), 2)) / 1000;
}

function optimizeRoute() {
    if (selectedSpots.length < 1) return alert("場所を選んでください！");
    let pos = [...userLocation], unvisited = [...selectedSpots], route = [], dist = 0, totalTime = 0;
    while (unvisited.length > 0) {
        let nextI = -1;
        if (currentMode === 'tourism') {
            let ds = unvisited.map(s => calculateDistance(pos[0], pos[1], s.緯度, s.経度));
            let ws = unvisited.map(s => s.待ち時間 || 0);
            let sDs = [...ds].sort((a,b)=>a-b), sWs = [...ws].sort((a,b)=>a-b);
            let minS = Infinity;
            for(let i=0; i<unvisited.length; i++) {
                let s = (sDs.indexOf(ds[i])+1) + (sWs.indexOf(ws[i])+1);
                if(s < minS) { minS = s; nextI = i; }
            }
        } else {
            let minD = Infinity;
            for(let i=0; i<unvisited.length; i++) {
                let d = calculateDistance(pos[0], pos[1], unvisited[i].緯度, unvisited[i].経度);
                if(d < minD) { minD = d; nextI = i; }
            }
        }
        const n = unvisited.splice(nextI, 1)[0];
        route.push(n);
        const d = calculateDistance(pos[0], pos[1], n.緯度, n.経度);
        dist += d;
        totalTime += (d * 15) + (n.所要時間 || 0);
        pos = [n.緯度, n.経度];
    }
    const h = Math.floor(totalTime / 60), m = Math.round(totalTime % 60);
    const timeStr = h > 0 ? `${h}時間${m}分` : `${m}分`;
    const stats = document.getElementById('route-stats');
    stats.innerHTML = `<div class="flex justify-between items-center bg-white/50 p-3 rounded-2xl mb-2"><div class="text-center flex-1 border-r border-brand-100"><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dist.</div><div class="text-xs font-black text-brand-500">${dist.toFixed(2)}km</div></div><div class="text-center flex-1"><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Time</div><div class="text-xs font-black text-brand-500">${timeStr}</div></div></div><div class="space-y-1.5 mt-3">${route.map((s,i)=>`<div class="text-[11px] font-bold flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[8px]">${i+1}</span>${s.スポット名}</div>`).join('')}</div>`;
    document.getElementById('route-info').classList.remove('hidden');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${route[route.length-1].緯度},${route[route.length-1].経度}&waypoints=${route.slice(0,-1).map(s=>`${s.緯度},${s.経度}`).join('|')}&travelmode=${currentMode==='tourism'?'driving':'walking'}`;
    document.getElementById('gmaps-link-btn').onclick = () => window.open(url, '_blank');
    if (window.polyline) map.removeLayer(window.polyline);
    window.polyline = L.polyline([userLocation, ...route.map(s=>[s.緯度,s.経度])], {color: currentMode==='tourism'?'#1b4353':'#dc2626', weight: 5, opacity: 0.5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(window.polyline.getBounds(), { padding: [60, 60] });
    switchTab('info');
}

async function callGemini() {
    const key = document.getElementById('gemini-key').value;
    if (!key) return alert("Keyが必要です");
    const v1 = document.getElementById('ai-input-1').value || "未指定";
    const v2 = document.getElementById('ai-input-2').value || "未指定";
    const req = document.getElementById('ai-request').value || "なし";
    const activeClass = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
    const interests = Array.from(document.querySelectorAll(`.interest-chip.${activeClass}`)).map(chip => chip.getAttribute('data-value'));
    const res = document.getElementById('ai-response');
    res.innerText = "AIがプランを練っています..."; res.classList.remove('hidden');
    let prompt = currentMode === 'tourism' ? `日田市観光プラン提案: 時間 ${v1}, 予算 ${v2}, 興味 ${interests.join(',')}, 要望 ${req}` : `防災グッズ提案: 家族 ${v1}, 予算 ${v2}, 重視 ${interests.join(',')}, 要望 ${req}`;
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await r.json();
        res.innerText = d.candidates[0].content.parts[0].text;
    } catch (e) { res.innerText = "エラー: " + e.message; }
}

function renderEvents() {
    const events = [{ m: 2, n: "おひなまつり", keyword: "豆田町" }, { m: 5, n: "川開き観光祭", keyword: "花火" }, { m: 7, n: "日田祇園祭", keyword: "山鉾" }, { m: 11, n: "千年あかり", keyword: "竹灯籠" }];
    const c = document.getElementById('extra-content-list');
    c.innerHTML = '<h3 class="text-slate-700 font-bold text-sm mb-4 px-2">主要イベント</h3>';
    events.forEach(ev => {
        const rel = allData.tourism.find(s => s.説明.includes(ev.keyword)) || { 説明: "日田の伝統行事です。" };
        const d = document.createElement('div');
        d.className = 'p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-2';
        d.innerHTML = `<div class="flex items-center gap-4"><div class="bg-brand-50 text-brand-500 font-black w-10 h-10 rounded-xl flex-none flex items-center justify-center text-xs shadow-inner">${ev.m}月</div><div class="text-sm font-black text-slate-800 tracking-tight">${ev.n}</div></div><p class="text-[10px] text-slate-400 leading-relaxed font-medium">${rel.説明.split(/[。！!？?]/)[0]}。</p>`;
        c.appendChild(d);
    });
}

function renderDisasterInfo() {
    const c = document.getElementById('extra-content-list');
    c.innerHTML = `<h3 class="text-red-600 font-bold text-sm mb-4 px-2">防災情報</h3><div class="space-y-3 px-1"><a href="https://www.city.hita.oita.jp/soshiki/somubu/kikikanrishitu/kikikanri/anshin/bosai/Preparing_for_disaster/3317.html" target="_blank" class="block p-5 bg-red-50 rounded-[32px] border border-red-100 shadow-sm flex items-center gap-3"><i class="fas fa-map-marked-alt text-red-600 text-xl"></i><div><div class="text-sm font-bold text-slate-800 leading-tight">ハザードマップ</div><div class="text-[9px] text-red-600 font-black uppercase mt-1">Hita City HP</div></div></a><div class="p-6 bg-slate-50 rounded-[32px] border border-slate-200 shadow-sm space-y-4"><div class="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">Emergency Contacts</div><div class="grid grid-cols-2 gap-3"><div class="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm"><div class="text-[9px] text-slate-400 font-bold mb-1">消防</div><div class="text-lg font-black text-red-600 leading-none">119</div></div><div class="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm"><div class="text-[9px] text-slate-400 font-bold mb-1">警察</div><div class="text-lg font-black text-blue-600 leading-none">110</div></div></div><div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center px-6 shadow-sm"><span class="text-[10px] text-slate-500 font-bold">日田市役所</span><span class="text-xs font-black tracking-wider">0973-23-3111</span></div></div></div>`;
}
