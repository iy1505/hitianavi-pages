let map;
let markers = [];
let allData = { tourism: [], disaster: [] };
let currentMode = 'tourism';
let currentCategory = 'all';
let currentLang = 'ja';
let userLocation = [33.3219, 130.9414];
let selectedSpots = [];
let userMarker;

const i18n = {
    ja: {
        find: "場所をさがす", shelter: "避難所をさがす", route_ai: "決定ルート・AI", route: "ルート", consult: "相談", info: "情報", event: "イベント",
        search_tour: "観光地やキーワードで検索...", search_dis: "避難所名や場所で検索...", decide_tour: "最適化ルートの算出", decide_dis: "最適化ルートの算出",
        sel_tour: "か所えらんだよ", sel_dis: "か所の避難先を選択中", add_tour: "場所を追加", add_dis: "避難先を追加", reset: "やり直し", reset_all: "すべて解除",
        gmaps_tour: "Googleマップで出発", gmaps_dis: "Googleマップで避難開始", ai_tour_title: "AI観光ガイド", ai_dis_title: "AI防災グッズ相談",
        ai_in1_tour: "滞在時間", ai_in1_dis: "家族構成 (例: 大人2人)", ai_in2_tour: "予算", ai_in2_dis: "予算 (備蓄用)",
        ai_btn_tour: "AIにおまかせプラン作成", ai_btn_dis: "必要な備えを聞く", ai_req: "その他の要望", ai_req_tour: "例: 子供連れ、映える場所など",
        go_here: "ここへ行く", go_dis: "ここへ避難する", remove: "消す", add_modal_tour: "ここへ行く場所に追加", add_modal_dis: "ここを避難先に選ぶ",
        credit: "created by 大分県立日田高校 79回生 SS情報班", history: "歴史", nature: "自然", gourmet: "グルメ", food: "食料", hygiene: "衛生", blackout: "停電",
        total_dist: "総距離", total_time: "合計時間", shelter_dist: "避難距離", shelter_time: "時間の目安"
    },
    en: {
        find: "Find", shelter: "Shelters", route_ai: "Route/AI", route: "Route", consult: "Consult", info: "Info", event: "Events",
        search_tour: "Search spots...", search_dis: "Search shelters...", decide_tour: "Decide Route", decide_dis: "Show Escape Route",
        sel_tour: "spots selected", sel_dis: "shelters selected", add_tour: "Add Spot", add_dis: "Add Shelter", reset: "Retry", reset_all: "Clear All",
        gmaps_tour: "Start with Google Maps", gmaps_dis: "Start Evacuation", ai_tour_title: "AI Tour Guide", ai_dis_title: "AI Disaster Consult",
        ai_in1_tour: "Duration", ai_in1_dis: "Family (e.g. 2 adults)", ai_in2_tour: "Budget", ai_in2_dis: "Stock Budget",
        ai_btn_tour: "Create AI Plan", ai_btn_dis: "Ask for Supplies", ai_req: "Other requests", ai_req_tour: "e.g. Kid-friendly, Photo-genic",
        go_here: "Go Here", go_dis: "Evacuate Here", remove: "Remove", add_modal_tour: "Add to Plan", add_modal_dis: "Select as Shelter",
        credit: "created by Hita High School 79th SS Information Group", history: "History", nature: "Nature", gourmet: "Gourmet", food: "Food", hygiene: "Hygiene", blackout: "Blackout",
        total_dist: "Distance", total_time: "Total Time", shelter_dist: "Distance", shelter_time: "Est. Time"
    },
    zh: {
        find: "寻找地点", shelter: "寻找避难所", route_ai: "路线/AI", route: "路线", consult: "咨询", info: "信息", event: "活动",
        search_tour: "搜索景点...", search_dis: "搜索避难所...", decide_tour: "确定路线", decide_dis: "显示避难路线",
        sel_tour: "个已选择", sel_dis: "个避难所已选择", add_tour: "添加地点", add_dis: "添加避难所", reset: "重试", reset_all: "全部清除",
        gmaps_tour: "使用谷歌地图出发", gmaps_dis: "开始避难", ai_tour_title: "AI 旅游指南", ai_dis_title: "AI 防灾咨询",
        ai_in1_tour: "停留时间", ai_in1_dis: "家庭构成 (如: 2名成人)", ai_in2_tour: "预算", ai_in2_dis: "备货预算",
        ai_btn_tour: "生成 AI 方案", ai_btn_dis: "咨询防灾用品", ai_req: "其他要求", ai_req_tour: "例如: 亲子游, 适合拍照",
        go_here: "去这里", go_dis: "去避难", remove: "删除", add_modal_tour: "加入行程", add_modal_dis: "选择为避难所",
        credit: "由 大分县立日田高中 第79届 SS信息组 创建", history: "历史", nature: "自然", gourmet: "美食", food: "食物", hygiene: "卫生", blackout: "停电",
        total_dist: "总距离", total_time: "总时间", shelter_dist: "避难距离", shelter_time: "预计时间"
    },
    ko: {
        find: "장소 찾기", shelter: "대피소 찾기", route_ai: "결정 루트/AI", route: "루트", consult: "상담", info: "정보", event: "이벤트",
        search_tour: "관광지 검색...", search_dis: "대피소 검색...", decide_tour: "루트 결정하기", decide_dis: "대피 경로 표시",
        sel_tour: "곳 선택됨", sel_dis: "곳 대피소 선택됨", add_tour: "장소 추가", add_dis: "대피소 추가", reset: "다시 시도", reset_all: "모두 해제",
        gmaps_tour: "Google 지도로 출발", gmaps_dis: "대피 시작", ai_tour_title: "AI 관광 가이드", ai_방재 상담: "AI 방재 상담",
        ai_in1_tour: "체류 시간", ai_in1_dis: "가족 구성 (예: 성인 2명)", ai_in2_tour: "예산", ai_in2_dis: "비축 예산",
        ai_btn_tour: "AI 플랜 생성", ai_btn_dis: "필요한 물품 묻기", ai_req: "기타 요청", ai_req_tour: "예: 아이 동반, 포토존",
        go_here: "여기로 가기", go_dis: "여기로 대피", remove: "삭제", add_modal_tour: "플랜에 추가", add_modal_dis: "대피소로 선택",
        credit: "오이타현립 히타 고등학교 79회 SS정보반 제작", history: "역사", nature: "자연", gourmet: "맛집", food: "식량", hygiene: "위생", blackout: "정전",
        total_dist: "총 거리", total_time: "총 시간", shelter_dist: "대피 거리", shelter_time: "예상 시간"
    }
};

function t(key) { return i18n[currentLang][key] || key; }

document.addEventListener('DOMContentLoaded', async () => {
    initMap(); await loadData(); setupEventListeners(); initBottomSheet(); updateUI();
});

function initMap() {
    map = L.map('map', { zoomControl: false, tap: false }).setView(userLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [24, 24], iconAnchor: [12, 12]
        })
    }).addTo(map);
}

async function loadData() {
    try { const response = await fetch('spots.json'); allData = await response.json(); } catch (e) { console.error(e); }
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
    document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => switchTab(b.getAttribute('data-tab')); });
    const handle = document.getElementById('drawer-handle');
    handle.onclick = () => document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('search-input').oninput = updateList;
    document.getElementById('gps-btn').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(p => {
                userLocation = [p.coords.latitude, p.coords.longitude];
                map.flyTo(userLocation, 15); userMarker.setLatLng(userLocation); updateList();
            });
        }
    };
    document.getElementById('optimize-btn').onclick = optimizeRoute;
    document.getElementById('clear-btn').onclick = () => resetAll();
    document.getElementById('ai-btn').onclick = callGemini;
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('modal-overlay').onclick = closeModal;
    document.getElementById('add-more-btn').onclick = () => { if (window.innerWidth < 768) setBottomSheetPos('mid'); switchTab('list'); };
    document.getElementById('reset-route-btn').onclick = resetAll;
    document.getElementById('lang-select').onchange = (e) => { currentLang = e.target.value; updateUI(); };
}

function initBottomSheet() {
    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('drawer-handle');
    if (!handle || window.innerWidth >= 768) return;
    let startY, startTranslateY;
    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
        startTranslateY = matrix.m42;
        sidebar.classList.add('dragging');
    });
    handle.addEventListener('touchmove', (e) => {
        let newY = startTranslateY + (e.touches[0].clientY - startY);
        if (newY < 0) newY *= 0.2; sidebar.style.transform = `translateY(${newY}px)`;
    });
    handle.addEventListener('touchend', (e) => {
        sidebar.classList.remove('dragging');
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
        const currentY = matrix.m42;
        const screenHeight = window.innerHeight;
        sidebar.style.transform = '';
        if (currentY < screenHeight * 0.2) setBottomSheetPos('full');
        else if (currentY < screenHeight * 0.6) setBottomSheetPos('mid');
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
    selectedSpots = []; if (window.polyline) map.removeLayer(window.polyline);
    document.getElementById('route-info').classList.add('hidden');
    updateUI(); switchTab('list');
}

function switchTab(tabName) {
    ['list', 'info', 'extra'].forEach(t => {
        const active = (t === tabName);
        const btn = document.getElementById(`tab-btn-${t}`);
        const pane = document.getElementById(`pane-${t}`);
        if (btn) {
            btn.classList.toggle('text-brand-500', active); btn.classList.toggle('border-brand-500', active);
            btn.classList.toggle('text-slate-400', !active); btn.classList.toggle('border-transparent', !active);
        }
        if (pane) pane.classList.toggle('hidden', !active);
    });
    document.getElementById('search-section').classList.toggle('hidden', tabName !== 'list');
}

function updateUI() {
    const isMobile = window.innerWidth < 768;
    document.getElementById('header-credit').innerText = t('credit');
    document.getElementById('mode-label-tourism').innerText = currentLang === 'ja' ? '観光モード' : 'Tourism';
    document.getElementById('mode-label-disaster').innerText = currentLang === 'ja' ? '防災モード' : 'Disaster';
    document.getElementById('tab-btn-list').innerText = currentMode === 'tourism' ? (isMobile ? t('find').slice(0,3) : t('find')) : (isMobile ? t('shelter').slice(0,3) : t('shelter'));
    document.getElementById('tab-btn-info').innerText = isMobile ? (currentMode === 'tourism' ? t('route') : t('consult')) : t('route_ai');
    document.getElementById('tab-btn-extra').innerText = currentMode === 'tourism' ? t('event') : t('info');
    document.getElementById('search-input').placeholder = currentMode === 'tourism' ? t('search_tour') : t('search_dis');
    document.getElementById('optimize-btn').innerText = currentMode === 'tourism' ? t('decide_tour') : t('decide_dis');
    document.getElementById('selected-count').innerText = `${selectedSpots.length} ${currentMode === 'tourism' ? t('sel_tour') : t('sel_dis')}`;
    
    if (currentMode === 'tourism') { setupTourismAIUI(); renderEvents(); }
    else { setupDisasterAIUI(); renderDisasterInfo(); }

    const chips = document.getElementById('category-chips');
    chips.innerHTML = '';
    ['all', ...new Set(allData[currentMode].map(s => s.カテゴリ))].forEach(cat => {
        const b = document.createElement('button');
        const active = currentCategory === cat;
        const color = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
        b.className = `flex-none px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${active ? color + ' text-white border-transparent shadow-md' : 'bg-white text-slate-400 border-slate-200'}`;
        b.innerText = (cat === 'all' ? (currentLang==='ja'?'すべて':'ALL') : cat).toUpperCase();
        b.onclick = () => { currentCategory = cat; updateUI(); };
        chips.appendChild(b);
    });
    updateList();
}

function setupTourismAIUI() {
    document.getElementById('ai-title-text').innerText = t('ai_tour_title');
    document.getElementById('ai-input-1').placeholder = t('ai_in1_tour');
    document.getElementById('ai-input-2').placeholder = t('ai_in2_tour');
    document.getElementById('ai-request').placeholder = t('ai_req_tour');
    document.getElementById('ai-btn').innerText = t('ai_btn_tour');
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = '';
    ['history', 'nature', 'gourmet'].forEach(v => {
        const b = document.createElement('button');
        b.className = 'interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500';
        b.innerText = t(v);
        b.onclick = () => {
            const activeColor = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
            b.classList.toggle(activeColor); b.classList.toggle('text-white');
            b.classList.toggle('bg-white'); b.classList.toggle('text-slate-500');
        };
        interests.appendChild(b);
    });
}

function setupDisasterAIUI() {
    document.getElementById('ai-title-text').innerText = t('ai_dis_title');
    document.getElementById('ai-input-1').placeholder = t('ai_in1_dis');
    document.getElementById('ai-input-2').placeholder = t('ai_in2_dis');
    document.getElementById('ai-request').placeholder = t('ai_req');
    document.getElementById('ai-btn').innerText = t('ai_btn_dis');
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = '';
    ['food', 'hygiene', 'blackout'].forEach(v => {
        const b = document.createElement('button');
        b.className = 'interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500';
        b.innerText = t(v);
        b.onclick = () => {
            const activeColor = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
            b.classList.toggle(activeColor); b.classList.toggle('text-white');
            b.classList.toggle('bg-white'); b.classList.toggle('text-slate-500');
        };
        interests.appendChild(b);
    });
}

function getSpotStyle(spot) {
    if (spot.sel) return { color: '#ef4444', icon: 'fa-star', size: 40 };
    
    const styles = {
        '歴史': { color: '#1b4353', icon: 'fa-landmark' },
        '自然': { color: '#10b981', icon: 'fa-tree' },
        'グルメ': { color: '#f59e0b', icon: 'fa-utensils' },
        '温泉': { color: '#06b6d4', icon: 'fa-hot-tub' },
        '体験': { color: '#ec4899', icon: 'fa-palette' },
        '進撃の巨人': { color: '#dc2626', icon: 'fa-fist-raised' },
        '指定緊急避難場所': { color: '#dc2626', icon: 'fa-running' },
        '指定避難所': { color: '#9333ea', icon: 'fa-house-user' },
        '福祉避難所': { color: '#2563eb', icon: 'fa-hand-holding-heart' }
    };
    return styles[spot.カテゴリ] || { color: '#64748b', icon: 'fa-map-marker-alt' };
}

function updateList() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const list = document.getElementById('spot-list');
    list.innerHTML = ''; markers.forEach(m => map.removeLayer(m)); markers = [];
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
        const style = getSpotStyle(spot);
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({
                className: 'm-icon',
                html: `<div style="color: ${style.color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" class="${spot.sel ? 'animate-bounce' : ''}">
                        <i class="fas ${style.icon} ${spot.sel ? 'fa-3x' : 'fa-2x'}"></i>
                       </div>`,
                iconSize: spot.sel ? [40,40] : [30,30], iconAnchor: spot.sel ? [20,40] : [15,30]
            })
        }).addTo(map);
        marker.on('click', () => { showDetail(spot); setBottomSheetPos('low'); });
        markers.push(marker);
        
        const intro = spot.説明.split(/[。！!？?]/)[0] + '。';
        const card = document.createElement('div');
        card.className = `p-5 rounded-[32px] border transition-all ${spot.sel ? 'bg-brand-50 border-brand-300 shadow-md ring-1 ring-brand-500/10' : 'bg-white border-slate-100 shadow-sm'}`;
        const btnT = currentMode === 'tourism' ? (spot.sel ? t('remove') : t('go_here')) : (spot.sel ? t('remove') : t('go_dis'));
        card.innerHTML = `<div class="flex justify-between items-start mb-1"><div class="flex-1 pr-2"><h4 class="font-black text-slate-800 text-sm leading-tight">${spot.スポット名}</h4><p class="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">${intro}</p></div><div class="text-right flex-none"><span class="text-[9px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500 block mb-1">${spot.dist.toFixed(1)}km</span><span class="text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 text-slate-400 block truncate max-w-[60px]">${spot.カテゴリ}</span></div></div><div class="flex gap-2 mt-4"><button class="s-btn flex-1 py-2.5 rounded-2xl text-[10px] font-black transition-all ${spot.sel ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-600'}">${btnT}</button><button class="d-btn px-4 py-2.5 rounded-2xl bg-slate-50 text-slate-400"><i class="fas fa-chevron-right text-xs"></i></button></div>`;
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
    btn.innerText = currentMode === 'tourism' ? (isSel ? t('remove') : t('add_modal_tour')) : (isSel ? t('remove') : t('add_modal_dis'));
    btn.className = `w-full py-4 rounded-2xl text-sm font-bold shadow-lg ${isSel ? 'bg-red-500' : (currentMode==='tourism'?'bg-brand-500':'bg-red-600')}`;
    btn.onclick = () => { toggleSelect(spot); closeModal(); };
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('detail-modal').classList.add('hidden'); }

function toggleSelect(spot) {
    const i = selectedSpots.findIndex(s => s.No === spot.No);
    if (i >= 0) selectedSpots.splice(i, 1); else selectedSpots.push(spot);
    updateList();
    document.getElementById('selected-count').innerText = `${selectedSpots.length} ${currentMode === 'tourism' ? t('sel_tour') : t('sel_dis')}`;
}

function calculateDistance(l1, o1, l2, o2) {
    const a = 6378137.0, b = 6356752.314245, e2 = (a*a - b*b) / (a*a);
    const r1 = l1 * Math.PI / 180, r2 = l2 * Math.PI / 180;
    const dy = r1 - r2, dx = (o1 - o2) * Math.PI / 180, p = (r1 + r2) / 2.0;
    const w = Math.sqrt(1 - e2 * Math.sin(p)*Math.sin(p)), m = a * (1 - e2) / (w*w*w), n = a / w;
    return Math.sqrt(Math.pow(dy * m, 2) + Math.pow(dx * n * Math.cos(p), 2)) / 1000;
}

function optimizeRoute() {
    if (selectedSpots.length < 1) return alert("Select spots first!");
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
        dist += d; totalTime += (d * 15) + (n.所要時間 || 0); pos = [n.緯度, n.経度];
    }
    const h = Math.floor(totalTime / 60), m = Math.round(totalTime % 60);
    const timeStr = h > 0 ? `${h}${currentLang==='ja'?'時間':'h'}${m}${currentLang==='ja'?'分':'m'}` : `${m}${currentLang==='ja'?'分':'m'}`;
    const stats = document.getElementById('route-stats');
    const dL = currentMode === 'tourism' ? t('total_dist') : t('shel_dist');
    const tL = currentMode === 'tourism' ? t('total_time') : t('shel_time');
    stats.innerHTML = `<div class="flex justify-between items-center bg-white/50 p-3 rounded-2xl mb-2"><div class="text-center flex-1 border-r border-brand-100"><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${dL}</div><div class="text-xs font-black text-brand-500">${dist.toFixed(2)}km</div></div><div class="text-center flex-1"><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${tL}</div><div class="text-xs font-black text-brand-500">${timeStr}</div></div></div><div class="space-y-1.5 mt-3">${route.map((s,i)=>`<div class="text-[11px] font-bold flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[8px]">${i+1}</span>${s.スポット名}</div>`).join('')}</div>`;
    document.getElementById('route-info').classList.remove('hidden');
    document.getElementById('route-title-text').innerText = currentMode === 'tourism' ? t('decide_tour') : t('decide_dis');
    document.getElementById('add-more-btn').innerText = currentMode === 'tourism' ? t('add_tour') : t('add_dis');
    document.getElementById('reset-route-btn').innerText = t('reset');
    document.getElementById('gmaps-link-btn').innerText = currentMode === 'tourism' ? t('gmaps_tour') : t('gmaps_dis');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${route[route.length-1].緯度},${route[route.length-1].経度}&waypoints=${route.slice(0,-1).map(s=>`${s.緯度},${s.経度}`).join('|')}&travelmode=${currentMode==='tourism'?'driving':'walking'}`;
    document.getElementById('gmaps-link-btn').onclick = () => window.open(url, '_blank');
    if (window.polyline) map.removeLayer(window.polyline);
    window.polyline = L.polyline([userLocation, ...route.map(s=>[s.緯度,s.経度])], {color: currentMode==='tourism'?'#1b4353':'#dc2626', weight: 5, opacity: 0.5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(window.polyline.getBounds(), { padding: [60, 60] });
    switchTab('info');
}

async function callGemini() {
    const key = document.getElementById('gemini-key').value;
    if (!key) return alert("API Key is required");
    const v1 = document.getElementById('ai-input-1').value || "...";
    const v2 = document.getElementById('ai-input-2').value || "...";
    const req = document.getElementById('ai-request').value || "...";
    const activeClass = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-red-600';
    const interests = Array.from(document.querySelectorAll(`.interest-chip.${activeClass}`)).map(chip => chip.getAttribute('data-value'));
    const res = document.getElementById('ai-response');
    res.innerText = "Thinking..."; res.classList.remove('hidden');
    const langNames = { ja: "Japanese", en: "English", zh: "Chinese", ko: "Korean" };
    let prompt = "";
    if (currentMode === 'tourism') {
        const nearbySpots = allData.tourism.map(s => ({ ...s, dist: calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度) })).sort((a,b)=>a.dist-b.dist).slice(0,10).map(s => `${s.スポット名}: ${s.説明}`).join('\n');
        prompt = `You are a Hita City tour guide. Provide a 1-day plan in ${langNames[currentLang]}. Condition: Duration ${v1}, Budget ${v2}, Interests ${interests.join(',')}, Requests ${req}. Spots:\n${nearbySpots}`;
    } else {
        prompt = `You are a disaster expert. Suggest evacuation supplies in ${langNames[currentLang]}. Family ${v1}, Budget ${v2}, Focus ${interests.join(',')}, Requests ${req}.`;
    }
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await r.json(); res.innerText = d.candidates[0].content.parts[0].text;
    } catch (e) { res.innerText = "Error: " + e.message; }
}

function renderEvents() {
    const events = [{ m: 2, n: "おひなまつり", keyword: "豆田町" }, { m: 5, n: "川開き観光祭", keyword: "花火" }, { m: 7, n: "日田祇園祭", keyword: "山鉾" }, { m: 11, n: "千年あかり", keyword: "竹灯籠" }];
    const c = document.getElementById('extra-content-list');
    c.innerHTML = `<h3 class="text-slate-700 font-bold text-sm mb-4 px-2">${currentLang==='ja'?'主要イベント':'Key Events'}</h3>`;
    events.forEach(ev => {
        const rel = allData.tourism.find(s => s.説明.includes(ev.keyword)) || { 説明: "Traditional event." };
        const d = document.createElement('div'); d.className = 'p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-2';
        d.innerHTML = `<div class="flex items-center gap-4"><div class="bg-brand-50 text-brand-500 font-black w-10 h-10 rounded-xl flex-none flex items-center justify-center text-xs shadow-inner">${ev.m}${currentLang==='ja'?'月':'M'}</div><div class="text-sm font-black text-slate-800">${ev.n}</div></div><p class="text-[10px] text-slate-400 leading-relaxed font-medium">${rel.説明.split(/[。！!？?]/)[0]}。</p>`;
        c.appendChild(d);
    });
}

function renderDisasterInfo() {
    const c = document.getElementById('extra-content-list');
    c.innerHTML = `<h3 class="text-red-600 font-bold text-sm mb-4 px-2">${currentLang==='ja'?'防災情報':'Disaster Info'}</h3><div class="space-y-3 px-1"><a href="https://www.city.hita.oita.jp/soshiki/somubu/kikikanrishitu/kikikanri/anshin/bosai/Preparing_for_disaster/3317.html" target="_blank" class="block p-5 bg-red-50 rounded-[32px] border border-red-100 shadow-sm flex items-center gap-3"><i class="fas fa-map-marked-alt text-red-600 text-xl"></i><div><div class="text-sm font-bold text-slate-800">Hazard Map</div><div class="text-[9px] text-red-600 font-black uppercase mt-1">City HP</div></div></a></div>`;
}
