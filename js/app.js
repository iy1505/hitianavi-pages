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
    updateUI();
});

function initMap() {
    map = L.map('map', { zoomControl: false }).setView(userLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [20, 20], iconAnchor: [10, 10]
        })
    }).addTo(map);
}

async function loadData() {
    try {
        const response = await fetch('spots.json');
        allData = await response.json();
    } catch (error) { console.error("Error loading spots data:", error); }
}

function setupEventListeners() {
    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            currentCategory = 'all';
            selectedSpots = [];
            updateUI();
            switchTab('list');
        });
    });

    document.querySelectorAll('[data-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => switchTab(tabBtn.getAttribute('data-tab')));
    });

    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('drawer-handle');
    const toggleSidebar = () => {
        sidebar.classList.toggle('translate-y-[75%]');
        sidebar.classList.toggle('translate-y-0');
    };
    handle.addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);

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
    document.getElementById('clear-btn').addEventListener('click', () => { selectedSpots = []; updateUI(); });
    document.getElementById('ai-btn').addEventListener('click', callGemini);

    // Modal Close
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('modal-overlay').onclick = closeModal;
}

function switchTab(tabName) {
    const tabs = ['list', 'info', 'extra'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const pane = document.getElementById(`pane-${t}`);
        const active = t === (tabName === 'extra' ? 'extra' : (tabName === 'info' ? 'info' : 'list'));
        if (btn) {
            btn.classList.toggle('text-brand-500', active);
            btn.classList.toggle('border-brand-500', active);
            btn.classList.toggle('text-slate-400', !active);
            btn.classList.toggle('border-transparent', !active);
        }
        if (pane) pane.classList.toggle('hidden', !active);
    });
}

function updateUI() {
    const infoTabBtn = document.getElementById('tab-btn-info');
    const extraTabBtn = document.getElementById('tab-btn-extra');
    if (currentMode === 'tourism') {
        infoTabBtn.textContent = 'AIプラン作成';
        extraTabBtn.textContent = 'イベント';
        setupTourismAIUI();
        renderEvents();
    } else {
        infoTabBtn.textContent = 'AI防災相談';
        extraTabBtn.textContent = '防災情報';
        setupDisasterAIUI();
        renderDisasterInfo();
    }
    const chipsContainer = document.getElementById('category-chips');
    chipsContainer.innerHTML = '';
    const categories = ['all', ...new Set(allData[currentMode].map(s => s.カテゴリ))];
    categories.forEach(cat => {
        const chip = document.createElement('button');
        const isAll = cat === 'all';
        chip.className = `flex-none px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${currentCategory === cat ? (currentMode === 'tourism' ? 'bg-brand-500 border-brand-500 text-white' : 'bg-red-600 border-red-600 text-white') : 'bg-white text-slate-500 border-slate-200 hover:border-brand-200'}`;
        chip.textContent = isAll ? 'すべて' : cat;
        chip.onclick = () => { currentCategory = cat; updateUI(); };
        chipsContainer.appendChild(chip);
    });
    updateList();
}

function setupTourismAIUI() {
    document.getElementById('ai-title-text').innerHTML = `<span class="bg-brand-accent text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-sm"><i class="fas fa-robot"></i></span> AI観光ガイド`;
    document.getElementById('ai-label-1').textContent = '滞在時間';
    document.getElementById('ai-input-1').placeholder = '例: 3時間';
    document.getElementById('ai-label-2').textContent = '予算';
    document.getElementById('ai-input-2').placeholder = '例: 5千円';
    document.getElementById('ai-btn').textContent = 'AIにおまかせプラン作成';
    document.getElementById('ai-btn').className = 'w-full bg-brand-accent text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-brand-accent/30 hover:opacity-90 active:scale-[0.98] transition-all';
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = `<button class="interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all" data-value="歴史">歴史・文化</button><button class="interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all" data-value="自然">自然・絶景</button><button class="interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all" data-value="グルメ">グルメ</button>`;
    setupInterestChips();
}

function setupDisasterAIUI() {
    document.getElementById('ai-title-text').innerHTML = `<span class="bg-red-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-sm"><i class="fas fa-shield-alt"></i></span> AI防災グッズ相談`;
    document.getElementById('ai-label-1').textContent = '家族の人数';
    document.getElementById('ai-input-1').placeholder = '例: 大人2人、子供1人';
    document.getElementById('ai-label-2').textContent = '予算（備蓄用）';
    document.getElementById('ai-input-2').placeholder = '例: 1万円以内';
    document.getElementById('ai-btn').textContent = '必要な防災グッズを教えて';
    document.getElementById('ai-btn').className = 'w-full bg-red-600 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-red-600/30 hover:opacity-90 active:scale-[0.98] transition-all';
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = `<button class="interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all" data-value="食料">食料・水</button><button class="interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all" data-value="衛生">衛生・トイレ</button><button class="interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all" data-value="停電">停電・明かり</button>`;
    setupInterestChips();
}

function setupInterestChips() {
    document.querySelectorAll('.interest-chip').forEach(chip => {
        chip.onclick = () => {
            const isActive = chip.classList.contains('bg-brand-500') || chip.classList.contains('bg-red-600');
            const activeClass = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
            if (isActive) { chip.classList.remove(activeClass, 'text-white', 'border-transparent'); chip.classList.add('bg-white', 'text-slate-500', 'border-slate-200'); }
            else { chip.classList.add(activeClass, 'text-white', 'border-transparent'); chip.classList.remove('bg-white', 'text-slate-500', 'border-slate-200'); }
        };
    });
}

function updateList() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const listContainer = document.getElementById('spot-list');
    listContainer.innerHTML = '';
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    const items = allData[currentMode].map(s => ({
        ...s, distance: calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度), isSelected: selectedSpots.some(sel => sel.No === s.No)
    }));
    const filtered = items.filter(s => {
        const matchSearch = s.スポット名.toLowerCase().includes(searchTerm) || s.説明.toLowerCase().includes(searchTerm);
        const matchCat = currentCategory === 'all' || s.カテゴリ === currentCategory;
        return (matchSearch && matchCat) || s.isSelected;
    });
    filtered.sort((a, b) => (a.isSelected === b.isSelected) ? a.distance - b.distance : (a.isSelected ? -1 : 1));
    filtered.forEach(spot => {
        const color = currentMode === 'tourism' ? (spot.isSelected ? '#ef4444' : '#1b4353') : (spot.isSelected ? '#ef4444' : '#ea580c');
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><i class="fas fa-map-marker-alt ${spot.isSelected ? 'fa-3x' : 'fa-2x'}"></i></div>`,
                iconSize: spot.isSelected ? [36, 36] : [24, 24], iconAnchor: spot.isSelected ? [18, 36] : [12, 24]
            })
        }).addTo(map);
        marker.on('click', () => showDetail(spot));
        markers.push(marker);
        const card = document.createElement('div');
        card.className = `group p-4 rounded-3xl border transition-all duration-300 cursor-pointer ${spot.isSelected ? 'bg-brand-50 border-brand-300 shadow-md ring-1 ring-brand-500/10' : 'bg-white border-slate-100 hover:border-brand-200 shadow-sm'}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                    ${spot.isSelected ? '<span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm"></span>' : ''}
                    <h4 class="font-bold text-slate-800 group-hover:text-brand-500 transition-colors text-sm">${spot.スポット名}</h4>
                </div>
                <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">${spot.distance.toFixed(1)}km</span>
            </div>
            <div class="flex gap-2">
                <button class="select-btn flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${spot.isSelected ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-600 hover:bg-brand-500 hover:text-white'}">
                    ${spot.isSelected ? 'えらんだ場所を消す' : 'ここへ行く'}
                </button>
            </div>
        `;
        card.onclick = () => showDetail(spot);
        card.querySelector('.select-btn').onclick = (e) => { e.stopPropagation(); toggleSelect(spot); };
        listContainer.appendChild(card);
    });
}

function showDetail(spot) {
    document.getElementById('detail-title').textContent = spot.スポット名;
    document.getElementById('detail-desc').textContent = spot.説明;
    const modalSelectBtn = document.getElementById('modal-select-btn');
    const isSelected = selectedSpots.some(s => s.No === spot.No);
    
    modalSelectBtn.textContent = isSelected ? 'えらんだ場所から消す' : 'ここへ行く場所に追加';
    modalSelectBtn.className = `w-full py-4 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 ${isSelected ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'}`;
    modalSelectBtn.onclick = () => { toggleSelect(spot); closeModal(); };

    const modal = document.getElementById('detail-modal');
    const container = document.getElementById('modal-container');
    modal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
        container.classList.remove('scale-90', 'opacity-0');
        container.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    const container = document.getElementById('modal-container');
    container.classList.remove('scale-100', 'opacity-100');
    container.classList.add('scale-90', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden', 'pointer-events-none');
    }, 300);
}

function toggleSelect(spot) {
    const idx = selectedSpots.findIndex(s => s.No === spot.No);
    if (idx >= 0) selectedSpots.splice(idx, 1);
    else selectedSpots.push(spot);
    updateList();
    document.getElementById('selected-count').textContent = `${selectedSpots.length} か所えらんだよ`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const a = 6378137.0, b = 6356752.314245, e2 = (a*a - b*b) / (a*a);
    const r1 = lat1 * Math.PI / 180, r2 = lat2 * Math.PI / 180;
    const dy = r1 - r2, dx = (lon1 - lon2) * Math.PI / 180, p = (r1 + r2) / 2.0;
    const w = Math.sqrt(1 - e2 * Math.sin(p)*Math.sin(p)), m = a * (1 - e2) / (w*w*w), n = a / w;
    return Math.sqrt(Math.pow(dy * m, 2) + Math.pow(dx * n * Math.cos(p), 2)) / 1000;
}

function optimizeRoute() {
    if (selectedSpots.length < 1) return alert("場所を選んでくださいね！");
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
    stats.innerHTML = `<p class="font-bold text-brand-500 text-sm">全部で ${totalDist.toFixed(2)}km 歩くよ</p><div class="space-y-1.5 mt-3">${route.map((s,i)=>`<div class="flex items-center gap-2 text-xs"><span class="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">${i+1}</span> ${s.スポット名}</div>`).join('')}</div>`;
    document.getElementById('route-info').classList.remove('hidden');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${route[route.length-1].緯度},${route[route.length-1].経度}&waypoints=${route.slice(0,-1).map(s=>`${s.緯度},${s.経度}`).join('|')}&travelmode=${currentMode==='tourism'?'driving':'walking'}`;
    document.getElementById('gmaps-link-btn').onclick = () => window.open(url, '_blank');
    if (window.polyline) map.removeLayer(window.polyline);
    window.polyline = L.polyline([userLocation, ...route.map(s=>[s.緯度,s.経度])], {color: currentMode === 'tourism' ? '#1b4353' : '#dc2626', weight: 5, opacity: 0.5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(window.polyline.getBounds(), { padding: [60, 60] });
    switchTab('info');
}

async function callGemini() {
    const key = document.getElementById('gemini-key').value;
    if (!key) return alert("Geminiのキーを教えてくださいね！");
    const val1 = document.getElementById('ai-input-1').value || "未指定";
    const val2 = document.getElementById('ai-input-2').value || "未指定";
    const request = document.getElementById('ai-request').value || "特になし";
    const activeClass = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
    const interests = Array.from(document.querySelectorAll(`.interest-chip.${activeClass}`)).map(chip => chip.getAttribute('data-value'));
    const resContainer = document.getElementById('ai-response');
    resContainer.textContent = "AIが一生懸命考えています...";
    resContainer.classList.remove('hidden');
    let prompt = "";
    if (currentMode === 'tourism') {
        const spots = allData.tourism.slice(0, 15).map(s => `${s.スポット名}: ${s.説明}`).join('\n');
        prompt = `あなたは日田市の観光コンシェルジュです。研究成果（女性は自己研鑽、若者はSNS映え）を考慮しプランを提案してください。\n【時間】${val1} 【予算】${val2} 【興味】${interests.join(',')} 【要望】${request}\n【スポット】\n${spots}`;
    } else {
        prompt = `あなたは防災の専門家です。ユーザーの状況に合わせて、実用的な防災グッズの備蓄リストを提案してください。\n【家族構成】${val1} 【予算】${val2} 【重視】${interests.join(',')} 【状況/要望】${request}\n各グッズの必要量と、なぜそれが必要か理由を添えてください。`;
    }
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        resContainer.textContent = data.candidates[0].content.parts[0].text;
    } catch (e) { resContainer.textContent = "エラーが起きちゃったみたい: " + e.message; }
}

function renderEvents() {
    const events = [
        { m: 2, n: "おひなまつり", d: "江戸時代から伝わる貴重なお雛様が、古い町並みに華やかに飾られます。商家で受け継がれてきた豪華な「天領日田」の文化を、春の訪れを感じながらゆっくりと楽しめます。" },
        { m: 5, n: "川開き観光祭", d: "初夏の夜空に約1万発の花火が打ち上がる、日田の初夏の風物詩です。川面に映る大迫力の花火や、屋形船から眺める幻想的な景色は、一生の思い出になる美しさです。" },
        { m: 7, n: "日田祇園祭", d: "ユネスコ無形文化遺産にも登録された、300年以上の歴史を誇る豪華な「山鉾」が城下町を練り歩きます。夜に提灯を灯した姿は圧巻で、伝統の音色と共に街が熱気に包まれます。" },
        { m: 11, n: "千年あかり", d: "秋の夜、約3万本の竹灯籠の優しい光が、古い町並みや川沿いを幻想的に包み込みます。静寂の中に揺らめく灯りが美しく、大切な人と一緒に歩きたくなるような温かみのあるイベントです。" }
    ];
    const container = document.getElementById('extra-content-list');
    container.innerHTML = '<h3 class="text-slate-700 font-bold text-sm mb-4">季節のイベント</h3>';
    events.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-3';
        div.innerHTML = `<div class="flex items-center gap-4"><div class="bg-brand-50 text-brand-500 font-black w-12 h-12 rounded-2xl flex-none flex items-center justify-center shadow-inner">${ev.m}月</div><div class="text-base font-bold text-slate-800">${ev.n}</div></div><p class="text-xs text-slate-500 leading-relaxed font-medium">${ev.d}</p>`;
        container.appendChild(div);
    });
}

function renderDisasterInfo() {
    const container = document.getElementById('extra-content-list');
    container.innerHTML = `<h3 class="text-red-600 font-bold text-sm mb-4">日田市 防災情報</h3><div class="space-y-3"><a href="https://www.city.hita.oita.jp/soshiki/somubu/kikikanrishitu/kikikanri/anshin/bosai/Preparing_for_disaster/3317.html" target="_blank" class="block p-5 bg-red-50 rounded-[32px] border border-red-100 hover:bg-red-100 transition-all shadow-sm"><div class="flex items-center gap-3"><i class="fas fa-map-marked-alt text-red-600 text-xl"></i><div><div class="text-sm font-bold text-slate-800">公式ハザードマップ</div><div class="text-[10px] text-red-600 font-bold">日田市ホームページを開く</div></div></div></a><div class="p-6 bg-slate-50 rounded-[32px] border border-slate-200 shadow-sm"><div class="text-xs font-bold text-slate-500 mb-4">緊急時の連絡先</div><div class="grid grid-cols-2 gap-3 mb-4"><div class="bg-white p-4 rounded-2xl border border-slate-100 text-center"><div class="text-[10px] text-slate-400 font-bold mb-1">消防・救急</div><div class="text-xl font-black text-red-600">119</div></div><div class="bg-white p-4 rounded-2xl border border-slate-100 text-center"><div class="text-[10px] text-slate-400 font-bold mb-1">警察</div><div class="text-xl font-black text-blue-600">110</div></div></div><div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center px-6"><span class="text-xs text-slate-500 font-bold">日田市役所</span><span class="text-sm font-bold tracking-wider">0973-23-3111</span></div></div></div>`;
}
