let map;
let markers = [];
let allData = { 
    ja: { tourism: [], disaster: [] }, 
    en: { tourism: [], disaster: [] }, 
    zh: { tourism: [], disaster: [] }, 
    ko: { tourism: [], disaster: [] } 
};
let currentMode = 'tourism';
let currentCategory = 'all';
let currentLang = 'ja';
let currentSort = 'dist';
let filter1km = false;
let filterOpen = false;
let userLocation = [33.3219, 130.9414];
let selectedSpots = [];
let userMarker;

const i18n = {
    ja: {
        find: "場所をさがす", shelter: "避難所をさがす", route_ai: "決定ルート・AI", route: "ルート", consult: "相談", info: "情報", event: "イベント",
        search_tour: "観光地やキーワードで検索...", search_dis: "避難所名や場所で検索...", decide_tour: "ルート算出",
        sel_tour: "か所選択", sel_dis: "か所選択", add_tour: "場所を追加", add_dis: "避難先を追加", reset: "やり直し", reset_all: "選択をリセット",
        sort_dist: "現在地から近い順", sort_cat: "カテゴリ順", sort_name: "名前順",
        filter_1km: "1km以内", filter_open: "営業中",
        gmaps_tour: "Googleマップで出発", gmaps_dis: "Googleマップで避難開始", ai_tour_title: "AI観光ガイド", ai_dis_title: "AI防災グッズ相談",
        ai_in1_tour: "滞在時間", ai_in1_dis: "家族構成 (例: 大人2人)", ai_in2_tour: "予算", ai_in2_dis: "予算 (備蓄用)",
        ai_btn_tour: "AIにおまかせプラン作成", ai_btn_dis: "必要な備えを聞く", ai_req: "その他の要望", ai_req_tour: "例: 子供連れ、映える場所など",
        go_here: "ここへ行く", go_dis: "ここへ避難する", remove: "消す", add_modal_tour: "ここへ行く場所に追加", add_modal_dis: "ここを避難先に選ぶ",
        credit: "created by 大分県立日田高校 79回生 SS情報班", subtitle: "日田市総合案内コンシェルジュ",
        history: "歴史", nature: "自然", gourmet: "グルメ", onsen: "温泉", experience: "体験", shingeki: "進撃の巨人", culture: "文化", shopping: "ショッピング", park: "公園", camp: "キャンプ", sports: "スポーツ", food: "食料", hygiene: "衛生", blackout: "停電", medicine: "常備薬", clothing: "衣類", baby: "ベビー用品", pet: "ペット用品",
        h_map: "ハザードマップ", d_portal: "防災ポータル", oita_bousai: "おおいた防災知識の広場", emergency_contact: "救急安心センター",
        h_map_desc: "浸水想定区域や土砂災害警戒区域を確認できます。",
        d_portal_desc: "日田市の最新の防災情報をまとめて確認できます。",
        oita_bousai_desc: "大分県の防災に関する知識や情報をリアルタイムで提供。",
        emergency_contact_desc: "急な病気やケガで、病院に行くべきか救急車を呼ぶべきか迷った時の相談窓口です。",
        event_1: "天領日田おひなまつり", event_desc_1: "豆田町一帯で雛人形を展示する春の風物詩。江戸〜昭和の雛人形が並びます。",
        event_2: "日田川開き観光祭", event_desc_2: "九州最大級の花火大会を含む日田最大の祭り。三隈川で鵜飼いも始まります。",
        event_3: "日田祇園祭", event_desc_3: "300年以上の歴史を持つユネスコ無形文化遺産の祭り。豪華な山鉾が練り歩きます。",
        event_4: "千年あかり", event_desc_4: "豆田町と花月川周辺を約3万本の竹灯籠が彩る幻想的な秋の夜のイベント。",
        total_dist: "総距離", total_time: "合計時間", shelter_dist: "避難距離", shelter_time: "時間の目安", thinking: "AIがプランを練っています...", error: "エラーが発生しました: ",
        gps_error: "現在地を取得できませんでした。設定を確認してください。",
        selection_reset: "選択をすべてリセット",
        header_title: "日田なび"
    },
    en: {
        find: "Find Spots", shelter: "Find Shelters", route_ai: "Route / AI", route: "Route", consult: "Consult", info: "Info", event: "Events",
        // ... (rest of en i18n)
        "歴史": "History", "自然": "Nature", "グルメ": "Gourmet", "温泉": "Onsen", "体験": "Craft", "進撃の巨人": "Attack on Titan", "文化": "Culture", "ショッピング": "Shopping", "公園": "Park", "キャンプ": "Camp", "スポーツ": "Sports",
        "指定緊急避難場所": "Emergency Shelter", "指定避難所": "Designated Shelter", "福祉避難所": "Welfare Shelter",
        history: "History", nature: "Nature", gourmet: "Gourmet", onsen: "Onsen", experience: "Craft", shingeki: "Attack on Titan", culture: "Culture", shopping: "Shopping", park: "Park", camp: "Camp", sports: "Sports", food: "Food", hygiene: "Hygiene", blackout: "Blackout", medicine: "Medicine", clothing: "Clothing", baby: "Baby Care", pet: "Pet Supplies",
        h_map: "Hazard Map", d_portal: "Disaster Portal", oita_bousai: "Oita Disaster Info", emergency_contact: "Emergency Relief Center",
        h_map_desc: "Check flood and landslide risk areas.",
        d_portal_desc: "Unified source for Hita City's latest disaster info.",
        oita_bousai_desc: "Real-time disaster knowledge and info across Oita.",
        emergency_contact_desc: "Consultation for sudden illness or injury (Should I go to hospital or call ambulance?).",
        event_1: "Hita Ohina-matsuri", event_desc_1: "A spring tradition in Mameda town displaying doll collections from Edo to Showa eras.",
        event_2: "Hita Kawabiraki Festival", event_desc_2: "Hita's largest festival featuring major fireworks and cormorant fishing on Mikuma river.",
        event_3: "Hita Gion Festival", event_desc_3: "UNESCO Intangible Cultural Heritage with 300 years of history and ornate floats.",
        event_4: "Sennen-Akari", event_desc_4: "A mystical autumn night event with 30,000 bamboo lanterns lighting up Mameda town.",
        total_dist: "Distance", total_time: "Total Time", shelter_dist: "Distance", shelter_time: "Est. Time", thinking: "AI is thinking...", error: "Error occurred: ",
        gps_error: "Could not get current location. Please check settings.",
        selection_reset: "Selection Reset",
        header_title: "Hita Navi"
    },
    zh: {
        find: "寻找地点", shelter: "寻找避难所", route_ai: "路线 / AI", route: "路线", consult: "咨询", info: "信息", event: "活动",
        search_tour: "搜索景点或关键词...", search_dis: "搜索避难所或地点...", decide_tour: "计算路线",
        sel_tour: "个已选择", sel_dis: "个已选择", add_tour: "添加地点", add_dis: "添加避难所", reset: "重试", reset_all: "全部清除",
        sort_dist: "离我最近", sort_cat: "按类别", sort_name: "按名称",
        filter_1km: "1公里以内", filter_open: "营业中",
        gmaps_tour: "开始导航", gmaps_dis: "开始避难", ai_tour_title: "AI 旅游指南", ai_dis_title: "AI 防灾咨询",
        ai_in1_tour: "停留时间", ai_in1_dis: "家庭构成 (如: 2名成人)", ai_in2_tour: "预算", ai_in2_dis: "备货预算",
        ai_btn_tour: "生成 AI 方案", ai_btn_dis: "咨询防灾用品", ai_req: "其他要求", ai_req_tour: "例如: 亲子游, 适合拍照",
        go_here: "去这里", go_dis: "去避难", remove: "删除", add_modal_tour: "加入行程", add_modal_dis: "选择为避难所",
        credit: "由 大分县立日田高中 第79届 SS信息组 创建", subtitle: "日田市智能导览地图",
        "歴史": "历史", "自然": "自然", "グルメ": "美食", "温泉": "温泉", "体験": "体验", "進撃の巨人": "进击的巨人", "文化": "文化", "ショッピング": "购物", "公園": "公园", "キャンプ": "露营", "スポーツ": "运动",
        "指定緊急避難場所": "紧急避难场所", "指定避難所": "指定避难所", "福祉避難所": "福祉避难所",
        history: "历史", nature: "自然", gourmet: "美食", onsen: "温泉", experience: "体验", shingeki: "进撃の巨人", culture: "文化", shopping: "购物", park: "公园", camp: "露营", sports: "运动", food: "食物", hygiene: "卫生", blackout: "停电", medicine: "常备药", clothing: "衣物", baby: "婴儿用品", pet: "宠物用品",
        h_map: "灾害地图", d_portal: "防灾门户", oita_bousai: "大分县防灾知识广场", emergency_contact: "急救安心中心",
        h_map_desc: "可以确认淹没预想区域和土石流灾害警戒区域。",
        d_portal_desc: "可以集中确认日田市最新的防灾信息。",
        oita_bousai_desc: "实时提供大分县防灾相关的知识和信息。",
        emergency_contact_desc: "因突发疾病或受伤，犹豫是否该去医院或叫救护车时的咨询窗口。",
        event_1: "天领日田女儿节", event_desc_1: "豆田町一带展示江户至昭和时期女儿节人偶的春季特色活动。",
        event_2: "日田川开观光祭", event_desc_2: "日田最大的节日，包括九州最大规模的烟花大会和三隈川鸬鹚捕鱼。",
        event_3: "日田祇园祭", event_desc_3: "拥有300多年历史的联合国教科文组织非物质文化遗产节日，华丽的山鉾巡游。",
        event_4: "千年灯火", event_desc_4: "约3万盏竹灯笼点亮豆田町和花月川周边的奇幻秋夜活动。",
        total_dist: "总距离", total_time: "总时间", shelter_dist: "避难距离", shelter_time: "预计时间", thinking: "AI 正在思考...", error: "发生错误: ",
        gps_error: "无法获取当前位置。请检查设置。",
        selection_reset: "重置所有选择",
        header_title: "日田导览"
    },
    ko: {
        find: "장소 찾기", shelter: "대피소 찾기", route_ai: "결정 루트 / AI", route: "루트", consult: "상담", info: "정보", event: "이벤트",
        search_tour: "관광지나 키워드로 검색...", search_dis: "대피소 이름이나 장소로 검색...", decide_tour: "루트 산출",
        sel_tour: "곳 선택됨", sel_dis: "곳 선택됨", add_tour: "장소 추가", add_dis: "대피처 추가", reset: "다시 하기", reset_all: "선택 리셋",
        sort_dist: "현재지에서 가까운 순", sort_cat: "카테고리 순", sort_name: "이름 순",
        filter_1km: "1km 이내", filter_open: "영업 중",
        gmaps_tour: "Google 맵으로 출발", gmaps_dis: "Google 맵으로 대피 시작", ai_tour_title: "AI 관광 가이드", ai_dis_title: "AI 방재 용품 상담",
        ai_in1_tour: "체류 시간", ai_in1_dis: "가족 구성 (예: 성인 2명)", ai_in2_tour: "예산", ai_in2_dis: "예산 (비축용)",
        ai_btn_tour: "AI 추천 플랜 작성", ai_btn_dis: "필요한 대비 묻기", ai_req: "기타 요청", ai_req_tour: "예: 아이 동반, 사진 찍기 좋은 곳 등",
        go_here: "여기로 가기", go_dis: "여기로 대피하기", remove: "삭제", add_modal_tour: "일정에 추가", add_modal_dis: "대피처로 선택",
        credit: "오이타현립 히타고등학교 79회생 SS정보반 제작", subtitle: "히타시 종합 안내 컨시어지",
        "歴史": "역사", "自然": "자연", "グルメ": "맛집", "温泉": "온천", "体験": "체험", "進撃의巨人": "진격의 거인", "文化": "문화", "ショッピング": "쇼핑", "公園": "공원", "キャンプ": "캠핑", "スポーツ": "스포츠",
        "指定緊急避難場所": "지정긴급대피장소", "指定避難所": "지정대피소", "福祉避難所": "복지대피소",
        history: "역사", nature: "자연", gourmet: "맛집", onsen: "온천", experience: "체험", shingeki: "진격의 거인", culture: "문화", shopping: "쇼핑", park: "공원", camp: "캠핑", sports: "스포츠", food: "식량", hygiene: "위생", blackout: "정전", medicine: "상비약", clothing: "의류", baby: "베이비 용품", pet: "반려동물 용품",

        h_map: "해저드 맵", d_portal: "방재 포털", oita_bousai: "오이타 방재 지식의 광장", emergency_contact: "응급 안심 센터",
        h_map_desc: "침수 예상 구역 및 토사 재해 경계 구역을 확인할 수 있습니다.",
        d_portal_desc: "히타시의 최신 방재 정보를 모아서 확인할 수 있습니다.",
        oita_bousai_desc: "오이타현의 방재에 관한 지식과 정보를 실시간 제공.",
        emergency_contact_desc: "갑작스러운 질병이나 부상으로 병원에 가야 할지, 구급차를 불러야 할지 망설여질 때의 상담 창구입니다.",
        event_1: "텐료 히타 오히나마츠리", event_desc_1: "마메다마치 일대에서 히나 인형을 전시하는 봄의 풍물시. 에도~쇼와 시대 인형이 전시됩니다.",
        event_2: "히타 카와비라키 관광제", event_desc_2: "규슈 최대 규모의 불꽃놀이를 포함한 히타 최대의 축제. 가마우지 낚시도 시작됩니다.",
        event_3: "히타 기온 마츠리", event_desc_3: "300년 이상의 역사를 가진 유네스코 무형문화유산 축제. 화려한 야마보코가 행진합니다.",
        event_4: "센넨아카리", event_desc_4: "마메다마치와 카게츠가와 주변을 약 3만 개의 대나무 등불이 수놓는 환상적인 가을 밤 이벤트.",
        total_dist: "총 거리", total_time: "총 시간", shelter_dist: "대피 거리", shelter_time: "예상 시간", thinking: "AI가 생각 중입니다...", error: "오류가 발생했습니다: ",
        gps_error: "현재지를 가져올 수 없습니다. 설정을 확인하십시오.",
        selection_reset: "선택 리셋",
        header_title: "히타나비"
    }
};

function t(key) { return i18n[currentLang][key] || key; }

async function requestLocation(isStartup = false) {
    if (!navigator.geolocation) {
        if (!isStartup) alert(t('gps_error'));
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (p) => {
            userLocation = [p.coords.latitude, p.coords.longitude];
            if (map) {
                map.flyTo(userLocation, 15);
                if (userMarker) userMarker.setLatLng(userLocation);
            }
            updateList();
        },
        (err) => {
            console.error("Geolocation error:", err);
            // On startup, we don't necessarily want to alert unless it's a critical failure
            if (!isStartup) alert(t('gps_error'));
        },
        options
    );
}

document.addEventListener('DOMContentLoaded', async () => {
    initMap(); 
    await loadAllData(); 
    setupEventListeners(); 
    initBottomSheet(); 
    updateUI();
    // Automatically request location on startup
    requestLocation(true);
});

function initMap() {
    map = L.map('map', { zoomControl: false, tap: false }).setView(userLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    userMarker = L.marker(userLocation, {
        icon: L.divIcon({ className: 'user-marker', html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>', iconSize: [24, 24], iconAnchor: [12, 12] })
    }).addTo(map);
}

async function loadAllData() {
    const langs = ['ja', 'en', 'ko', 'zh'];
    for (const lang of langs) {
        await loadData(lang);
    }
    console.log("All data loaded:", allData);
}

async function loadData(lang) {
    try {
        const fileName = lang === 'ja' ? 'spots.xlsx' : `spots_${lang}.xlsx`;
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`Failed to load ${fileName}`);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const mapRow = (row) => {
            const get = (keys) => {
                for (const key of keys) {
                    if (row[key] !== undefined && row[key] !== null) return row[key];
                }
                return undefined;
            };
            
            const latVal = get(['緯度', 'Latitude', 'lat', 'latitude']);
            const lngVal = get(['経度', 'Longitude', 'lng', 'lon', 'longitude']);
            
            const lat = parseFloat(latVal);
            const lng = parseFloat(lngVal);
            
            if (isNaN(lat) || isNaN(lng)) return null;

            return {
                No: parseInt(get(['No', 'no', 'ID', 'id'])) || 0,
                スポット名: (get(['スポット名', 'Spot Name', 'Name', 'name', 'spot_name']) || "").toString().trim(),
                カテゴリ: (get(['カテゴリ', 'Category', 'category']) || "").toString().trim(),
                緯度: lat,
                経度: lng,
                '所要時間（参考）': (get(['所要時間（参考）', 'Duration', 'time_ref']) || "").toString().trim(),
                説明: (get(['説明', 'Description', 'desc', 'description']) || "").toString().trim(),
                待ち時間: parseInt(get(['待ち時間', 'Wait Time', 'wait'])) || 0,
                所要時間: parseInt(get(['所要時間（参考）', 'Duration'])) || 0,
                '営業時間': (get(['営業時間', 'Hours', 'hours']) || "終日").toString().trim(),
                '料金': (get(['料金', 'Fee', 'fee']) || "無料").toString().trim()
            };
        };

        const tourismSheet = workbook.Sheets['観光'] || workbook.Sheets['Tourism'];
        if (tourismSheet) {
            allData[lang].tourism = XLSX.utils.sheet_to_json(tourismSheet).map(mapRow).filter(s => s !== null);
        }

        const disasterSheet = workbook.Sheets['防災'] || workbook.Sheets['Disaster'];
        if (disasterSheet) {
            allData[lang].disaster = XLSX.utils.sheet_to_json(disasterSheet).map(mapRow).filter(s => s !== null);
        }
    } catch (e) {
        console.error(`Error loading data for ${lang}:`, e);
    }
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
    
    document.getElementById('search-input').oninput = updateList;
    document.getElementById('gps-btn').onclick = () => requestLocation(false);
    document.getElementById('optimize-btn').onclick = optimizeRoute;
    document.getElementById('sort-select').onchange = (e) => {
        currentSort = e.target.value; updateList();
    };
    document.getElementById('filter-1km').onclick = () => {
        filter1km = !filter1km; updateUI();
    };
    document.getElementById('filter-open').onclick = () => {
        filterOpen = !filterOpen; updateUI();
    };
    document.getElementById('clear-btn').onclick = () => resetAll();
    document.getElementById('ai-btn').onclick = callGemini;
    document.getElementById('close-modal').onclick = closeModal;
    document.getElementById('modal-overlay').onclick = closeModal;
    document.getElementById('add-more-btn').onclick = () => { if (window.innerWidth < 768) setBottomSheetPos('mid'); switchTab('list'); };
    document.getElementById('reset-route-btn').onclick = resetAll;
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => { 
            currentLang = btn.getAttribute('data-lang'); 
            updateUI(); 
        };
    });

    // Handle click to cycle states (for better affordance)
    const handle = document.getElementById('drawer-handle');
    let lastY = 0;
    handle.onclick = (e) => {
        if (e.target.closest('input, label')) return;
        if (window.innerWidth < 768) {
            const sidebar = document.getElementById('sidebar');
            const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
            const currentY = matrix.m42;
            const screenHeight = window.innerHeight;
            
            // Calculate limit to stay below header (95px)
            const minY = Math.max(0, 95 + 15 - (screenHeight * 0.15));

            // Cycle: low -> mid -> full -> low
            if (currentY > screenHeight * 0.5) setBottomSheetPos('mid');
            else if (currentY > minY + 20) setBottomSheetPos('full');
            else setBottomSheetPos('low');
        } else {
            const sidebar = document.getElementById('sidebar');
            const isCollapsed = sidebar.classList.contains('collapsed');
            setBottomSheetPos(isCollapsed ? 'full' : 'low');
        }
    };
}

function initBottomSheet() {
    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('drawer-handle');
    if (!handle) return;

    let startX, startY, startLeft, startTop, startTranslateY;
    let isDragging = false;
    let startTime;

    const onStart = (e) => {
        if (e.target.closest('input, label')) return;
        isDragging = true;
        startTime = Date.now();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        
        const rect = sidebar.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        if (window.innerWidth < 768) {
            const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
            startTranslateY = matrix.m42;
        }
        
        sidebar.classList.add('dragging');
        document.body.style.userSelect = 'none';
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - startX;
        const dy = clientY - startY;

        if (window.innerWidth < 768) {
            let newY = startTranslateY + dy;
            const screenHeight = window.innerHeight;
            
            // Prevent dragging above the header (95px)
            const minY = Math.max(0, 95 + 15 - (screenHeight * 0.15));
            
            // Limit downward drag
            const maxTranslateY = screenHeight * 0.85;
            if (newY > maxTranslateY) newY = maxTranslateY;

            if (newY < minY) {
                const diff = minY - newY;
                newY = minY - (diff * 0.2); // Resist pulling up past limit
                if (newY < minY - 20) newY = minY - 20; // Hard clamp
            }
            
            sidebar.style.transform = `translateY(${newY}px)`;
        } else {
            let newTop = startTop + dy;
            let newLeft = startLeft + dx;
            
            // Constraints for Desktop (Header is 105px)
            const headerHeight = 105;
            if (newTop < headerHeight) newTop = headerHeight;
            
            // Screen boundaries
            if (newLeft < 0) newLeft = 0;
            if (newLeft > window.innerWidth - 100) newLeft = window.innerWidth - 100;
            if (newTop > window.innerHeight - 100) newTop = window.innerHeight - 100;

            sidebar.style.left = `${newLeft}px`;
            sidebar.style.top = `${newTop}px`;
            sidebar.style.bottom = 'auto'; 
        }
    };

    const onEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        sidebar.classList.remove('dragging');
        document.body.style.userSelect = '';

        const duration = Date.now() - startTime;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        const dy = clientY - startY;

        if (window.innerWidth < 768) {
            const matrix = new WebKitCSSMatrix(window.getComputedStyle(sidebar).transform);
            const currentY = matrix.m42;
            const screenHeight = window.innerHeight;
            sidebar.style.transform = '';
            
            const minY = Math.max(0, 95 + 15 - (screenHeight * 0.15));
            
            // Fast swipe detection
            if (duration < 300 && Math.abs(dy) > 30) {
                if (dy < 0) setBottomSheetPos(currentY > screenHeight * 0.4 ? 'mid' : 'full');
                else setBottomSheetPos(currentY < screenHeight * 0.4 ? 'mid' : 'low');
            } else {
                if (currentY < screenHeight * 0.2) setBottomSheetPos('full');
                else if (currentY < screenHeight * 0.6) setBottomSheetPos('mid');
                else setBottomSheetPos('low');
            }
        }
    };

    handle.addEventListener('touchstart', onStart, {passive: true});
    window.addEventListener('touchmove', onMove, {passive: false});
    window.addEventListener('touchend', onEnd);

    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
}

function setBottomSheetPos(pos) {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768) {
        const screenHeight = window.innerHeight;
        const minY = Math.max(0, 95 + 15 - (screenHeight * 0.15));

        if (pos === 'full') sidebar.style.transform = `translateY(${minY}px)`, sidebar.classList.add('open');
        else if (pos === 'mid') sidebar.style.transform = 'translateY(45vh)', sidebar.classList.add('open');
        else sidebar.style.transform = '', sidebar.classList.remove('open');
    } else {
        // Reset custom position when toggling collapsed state to prevent "sinking"
        sidebar.style.top = '';
        sidebar.style.left = '';
        sidebar.style.bottom = '';
        if (pos === 'low') sidebar.classList.add('collapsed');
        else sidebar.classList.remove('collapsed');
    }
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
            const activeColor = currentMode === 'tourism' ? 'text-brand-500' : 'text-disaster-600';
            const activeBorder = currentMode === 'tourism' ? 'border-brand-500' : 'border-disaster-600';
            
            btn.classList.toggle(activeColor, active); 
            btn.classList.toggle(activeBorder, active);
            
            // Remove the other mode's active colors
            const inactiveColor = currentMode === 'tourism' ? 'text-disaster-600' : 'text-brand-500';
            const inactiveBorder = currentMode === 'tourism' ? 'border-disaster-600' : 'border-brand-500';
            btn.classList.remove(inactiveColor, inactiveBorder);

            btn.classList.toggle('text-slate-400', !active); 
            btn.classList.toggle('border-transparent', !active);
        }
        if (pane) pane.classList.toggle('hidden', !active);
    });
    document.getElementById('search-section').classList.toggle('hidden', tabName !== 'list');
}

function updateUI() {
    const isMobile = window.innerWidth < 768;
    document.getElementById('header-title').innerText = t('header_title');
    document.getElementById('header-credit').innerText = t('credit');
    document.getElementById('header-subtitle').innerText = t('subtitle');
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

    document.getElementById('mode-label-tourism').innerText = currentLang === 'ja' ? '観光モード' : 'Tourism';
    document.getElementById('mode-label-disaster').innerText = currentLang === 'ja' ? '防災モード' : 'Disaster';
    
    document.getElementById('tab-btn-list').innerText = currentMode === 'tourism' ? (isMobile ? t('find').slice(0,3) : t('find')) : (isMobile ? t('shelter').slice(0,3) : t('shelter'));
    document.getElementById('tab-btn-info').innerText = isMobile ? (currentMode === 'tourism' ? t('route') : t('consult')) : t('route_ai');
    document.getElementById('tab-btn-extra').innerText = currentMode === 'tourism' ? t('event') : t('info');
    
    document.getElementById('search-input').placeholder = currentMode === 'tourism' ? t('search_tour') : t('search_dis');
    
    const optBtn = document.getElementById('optimize-btn');
    optBtn.innerText = t('decide_tour');
    optBtn.className = `flex-1 ${currentMode === 'tourism' ? 'bg-brand-500' : 'bg-disaster-500'} text-white py-2.5 rounded-xl text-[10px] md:text-xs font-black shadow-lg uppercase truncate`;

    document.getElementById('sort-opt-dist').innerText = t('sort_dist');
    document.getElementById('sort-opt-cat').innerText = t('sort_cat');
    document.getElementById('sort-opt-name').innerText = t('sort_name');
    
    const selCount = document.getElementById('selected-count');
    selCount.innerText = `${selectedSpots.length} ${currentMode === 'tourism' ? t('sel_tour') : t('sel_dis')}`;
    selCount.className = `text-[8px] md:text-[9px] font-black ${currentMode === 'tourism' ? 'text-brand-500 bg-brand-50 border-brand-100' : 'text-disaster-600 bg-disaster-50 border-disaster-100'} px-2 py-1.5 rounded-lg border flex-none`;

    document.getElementById('clear-btn').innerText = t('selection_reset').toUpperCase();
    document.getElementById('ai-title-text').innerText = t('ai_guide').toUpperCase();


    const f1km = document.getElementById('filter-1km');
    f1km.innerText = t('filter_1km');
    const f1kmColor = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-disaster-600';
    f1km.className = `px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${filter1km ? f1kmColor + ' text-white border-transparent' : 'bg-white text-slate-500 border-slate-200'}`;
    
    const fOpen = document.getElementById('filter-open');
    fOpen.innerText = t('filter_open');
    const fOpenColor = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-disaster-600';
    fOpen.className = `px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${filterOpen ? fOpenColor + ' text-white border-transparent' : 'bg-white text-slate-500 border-slate-200'}`;

    if (currentMode === 'tourism') { setupTourismAIUI(); renderEvents(); }
    else { setupDisasterAIUI(); renderDisasterInfo(); }

    const chips = document.getElementById('category-chips');
    chips.innerHTML = '';
    const data = allData[currentLang][currentMode] || [];
    ['all', ...new Set(data.map(s => s.カテゴリ))].forEach(cat => {
        const b = document.createElement('button');
        const active = currentCategory === cat;
        const color = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-disaster-600';
        b.className = `flex-none px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${active ? color + ' text-white border-transparent shadow-md' : 'bg-white text-slate-400 border-slate-200'}`;
        
        let label = cat;
        if (cat === 'all') label = currentLang === 'ja' ? 'すべて' : 'ALL';
        else if (i18n[currentLang][cat.toLowerCase()]) label = t(cat.toLowerCase());
        
        b.innerText = label.toUpperCase();
        b.onclick = () => { currentCategory = cat; updateUI(); };
        chips.appendChild(b);
    });
    // Update tab colors
    switchTab(document.querySelector('[data-tab].text-brand-500, [data-tab].text-disaster-600')?.getAttribute('data-tab') || 'list');
    updateList();
}

function setupTourismAIUI() {
    document.getElementById('ai-title-text').innerText = t('ai_tour_title');
    document.getElementById('ai-input-1').placeholder = t('ai_in1_tour');
    document.getElementById('ai-input-2').placeholder = t('ai_in2_tour');
    document.getElementById('ai-request').placeholder = t('ai_req_tour');
    document.getElementById('ai-btn').innerText = t('ai_btn_tour');
    document.getElementById('ai-btn').className = 'w-full bg-brand-accent text-white py-4 rounded-[20px] text-sm font-black shadow-lg uppercase transition-all active:scale-95';
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = '';
    ['history', 'nature', 'gourmet', 'onsen', 'experience', 'culture', 'shopping', 'sightseeing', 'camp', 'sports', 'shingeki'].forEach(v => {
        const b = document.createElement('button');
        b.className = 'interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all';
        b.innerText = t(v);
        b.setAttribute('data-value', v);
        b.onclick = () => {
            const c = 'bg-brand-500';
            b.classList.toggle(c); b.classList.toggle('text-white'); b.classList.toggle('border-transparent');
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
    document.getElementById('ai-btn').className = 'w-full bg-disaster-600 text-white py-4 rounded-[20px] text-sm font-black shadow-lg uppercase transition-all active:scale-95';
    const interests = document.getElementById('ai-interests');
    interests.innerHTML = '';
    ['food', 'hygiene', 'blackout', 'medicine', 'clothing', 'baby', 'pet'].forEach(v => {
        const b = document.createElement('button');
        b.className = 'interest-chip px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold bg-white text-slate-500 transition-all';
        b.innerText = t(v);
        b.setAttribute('data-value', v);
        b.onclick = () => {
            const c = 'bg-disaster-600';
            b.classList.toggle(c); b.classList.toggle('text-white'); b.classList.toggle('border-transparent');
            b.classList.toggle('bg-white'); b.classList.toggle('text-slate-500');
        };
        interests.appendChild(b);
    });
}

function getSpotStyle(spot) {
    if (spot.sel) return { color: '#EF4123', icon: 'fa-star' };
    if (spot.スポット名.includes('進撃の巨人') || spot.スポット名.includes('Attack on Titan') || spot.スポット名.includes('进击的巨人') || spot.スポット名.includes('진격의 거인')) return { color: '#EF4123', icon: 'fa-fist-raised' };

    const styles = {
        '歴史': { color: '#4f46e5', icon: 'fa-landmark' },      // Indigo
        '自然': { color: '#059669', icon: 'fa-tree' },          // Emerald
        'グルメ': { color: '#d97706', icon: 'fa-utensils' },      // Amber
        '温泉': { color: '#0891b2', icon: 'fa-hot-tub' },       // Cyan
        '体験': { color: '#db2777', icon: 'fa-hiking' },        // Pink
        '進撃の巨人': { color: '#EF4123', icon: 'fa-fist-raised' }, // Disaster/Titan Red
        '文化': { color: '#7c3aed', icon: 'fa-palette' },       // Violet
        'ショッピング': { color: '#e11d48', icon: 'fa-shopping-bag' }, // Rose
        '公園': { color: '#16a34a', icon: 'fa-tree' },          // Green
        'キャンプ': { color: '#15803d', icon: 'fa-campground' },    // Green
        'スポーツ': { color: '#c026d3', icon: 'fa-flag-checkered' }, // Fuchsia
        '観光地': { color: '#2563eb', icon: 'fa-camera' },       // Blue
        '指定緊急避難場所': { color: '#EF4123', icon: 'fa-running' },
        '指定避難所': { color: '#9333ea', icon: 'fa-house-user' },
        '福祉避難所': { color: '#2563eb', icon: 'fa-hand-holding-heart' }
    };

    // Find the Japanese category key that matches the current spot's category
    const jaKeys = Object.keys(i18n.ja);
    const originalCat = jaKeys.find(key => i18n[currentLang][key] === spot.カテゴリ) || spot.カテゴリ;

    return styles[originalCat] || { color: '#64748b', icon: 'fa-map-marker-alt' };
}

function updateList() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const list = document.getElementById('spot-list');
    list.innerHTML = ''; markers.forEach(m => map.removeLayer(m)); markers = [];
    const data = allData[currentLang][currentMode] || [];
    const items = data.map(s => ({
        ...s, dist: calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度),
        sel: selectedSpots.some(x => x.No === s.No)
    }));
    const filtered = items.filter(s => {
        const mSearch = s.スポット名.toLowerCase().includes(search) || s.説明.toLowerCase().includes(search) || s.カテゴリ.toLowerCase().includes(search);
        const mCat = currentCategory === 'all' || s.カテゴリ === currentCategory;
        const mDist = !filter1km || s.dist <= 1.0;
        const mOpen = !filterOpen || isOpen(s.営業時間);
        return (mSearch && mCat && mDist && mOpen) || s.sel;
    }).sort((a, b) => {
        if (a.sel !== b.sel) return a.sel ? -1 : 1;
        if (currentSort === 'dist') return a.dist - b.dist;
        if (currentSort === 'cat') return a.カテゴリ.localeCompare(b.カテゴリ, 'ja');
        if (currentSort === 'name') return a.スポット名.localeCompare(b.スポット名, 'ja');
        return 0;
    });

    filtered.forEach(spot => {
        const st = getSpotStyle(spot);
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({ className: 'm-icon', html: `<div style="color: ${st.color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" class="${spot.sel ? 'animate-bounce' : ''}"><i class="fas ${st.icon} ${spot.sel ? 'fa-3x' : 'fa-2x'}"></i></div>`, iconSize: spot.sel?[40,40]:[30,30], iconAnchor: spot.sel?[20,40]:[15,30] })
        }).addTo(map);
        marker.on('click', () => { showDetail(spot); setBottomSheetPos('low'); });
        markers.push(marker);
        
        const card = document.createElement('div');
        const activeCardClass = currentMode === 'tourism' 
            ? 'bg-brand-50 border-brand-300 shadow-md ring-1 ring-brand-500/10' 
            : 'bg-disaster-50 border-disaster-300 shadow-md ring-1 ring-disaster-500/10';
        card.className = `p-5 rounded-[32px] border transition-all ${spot.sel ? activeCardClass : 'bg-white border-slate-100 shadow-sm'}`;
        
        const btnT = currentMode === 'tourism' ? (spot.sel ? t('remove') : t('go_here')) : (spot.sel ? t('remove') : t('go_dis'));
        const btnColor = spot.sel 
            ? 'bg-disaster-500 text-white shadow-lg shadow-disaster-200' 
            : (currentMode === 'tourism' ? 'bg-slate-50 text-slate-600' : 'bg-disaster-50 text-disaster-600 border border-disaster-100');
        
        const dBtnColor = currentMode === 'tourism' ? 'bg-slate-50 text-slate-400' : 'bg-disaster-50 text-disaster-400 border border-disaster-100';
        
        card.innerHTML = `<div class="flex justify-between items-start mb-1"><div class="flex-1 pr-2"><h4 class="font-black text-slate-800 text-sm leading-tight">${spot.スポット名}</h4><p class="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">${spot.説明.split(/[。！!？?]/)[0]}。</p></div><div class="text-right flex-none"><span class="text-[9px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500 block mb-1">${spot.dist.toFixed(1)}km</span><span class="text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 text-slate-400 block truncate max-w-[60px]">${t(spot.カテゴリ.toLowerCase())}</span></div></div><div class="flex gap-2 mt-4"><button class="s-btn flex-1 py-2.5 rounded-2xl text-[10px] font-black transition-all ${btnColor}">${btnT}</button><button class="d-btn px-4 py-2.5 rounded-2xl ${dBtnColor} transition-all"><i class="fas fa-chevron-right text-xs"></i></button></div>`;
        card.onclick = () => { map.flyTo([spot.緯度, spot.経度], 15); };
        card.querySelector('.s-btn').onclick = (e) => { e.stopPropagation(); toggleSelect(spot); };
        card.querySelector('.d-btn').onclick = (e) => { e.stopPropagation(); showDetail(spot); };
        list.appendChild(card);
    });
}

function showDetail(spot) {
    const btn = document.getElementById('modal-select-btn');
    btn.classList.remove('hidden');
    document.getElementById('detail-title').innerText = spot.スポット名;
    document.getElementById('detail-desc').innerText = spot.説明;
    const isSel = selectedSpots.some(s => s.No === spot.No);
    btn.innerText = currentMode === 'tourism' ? (isSel ? t('remove') : t('add_modal_tour')) : (isSel ? t('remove') : t('add_modal_dis'));
    btn.className = `w-full py-4 rounded-2xl text-sm font-bold shadow-lg ${isSel ? 'bg-disaster-500' : (currentMode==='tourism'?'bg-brand-500':'bg-disaster-600')} text-white`;
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
    if (selectedSpots.length < 1) return alert(t('find'));
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
    const accentColor = currentMode === 'tourism' ? 'text-brand-500' : 'text-disaster-600';
    const bgColor = currentMode === 'tourism' ? 'bg-brand-50' : 'bg-disaster-50';
    const borderColor = currentMode === 'tourism' ? 'border-brand-100' : 'border-disaster-100';
    const bulletBg = currentMode === 'tourism' ? 'bg-brand-500' : 'bg-disaster-600';

    stats.innerHTML = `<div class="flex justify-between items-center bg-white/50 p-3 rounded-2xl mb-2"><div class="text-center flex-1 border-r ${borderColor}"><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${t('total_dist')}</div><div class="text-xs font-black ${accentColor}">${dist.toFixed(2)}km</div></div><div class="text-center flex-1"><div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">${t('total_time')}</div><div class="text-xs font-black ${accentColor}">${timeStr}</div></div></div><div class="space-y-1.5 mt-3">${route.map((s,i)=>`<div class="text-[11px] font-bold flex items-center gap-2"><span class="w-4 h-4 rounded-full ${bulletBg} text-white flex items-center justify-center text-[8px]">${i+1}</span>${s.スポット名}</div>`).join('')}</div>`;
    
    const routeInfo = document.getElementById('route-info');
    routeInfo.className = `${bgColor} p-5 rounded-[32px] border ${borderColor} shadow-sm space-y-4 w-full box-border`;
    routeInfo.classList.remove('hidden');
    
    document.getElementById('route-title-text').innerText = t('decide_tour');
    document.getElementById('route-title-text').parentElement.className = `${accentColor} font-black text-sm flex items-center gap-2`;

    const addBtn = document.getElementById('add-more-btn');
    addBtn.innerText = currentMode === 'tourism' ? t('add_tour') : t('add_dis');
    addBtn.className = `bg-white ${currentMode === 'tourism' ? 'text-brand-500 border-brand-100' : 'text-disaster-600 border-disaster-100'} border py-3 rounded-2xl text-[10px] font-bold shadow-sm`;

    document.getElementById('reset-route-btn').innerText = t('reset');
    document.getElementById('gmaps-link-btn').innerText = currentMode === 'tourism' ? t('gmaps_tour') : t('gmaps_dis');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${route[route.length-1].緯度},${route[route.length-1].経度}&waypoints=${route.slice(0,-1).map(s=>`${s.緯度},${s.経度}`).join('|')}&travelmode=${currentMode==='tourism'?'driving':'walking'}`;
    document.getElementById('gmaps-link-btn').onclick = () => window.open(url, '_blank');
    if (window.polyline) map.removeLayer(window.polyline);
    window.polyline = L.polyline([userLocation, ...route.map(s=>[s.緯度,s.経度])], {color: currentMode==='tourism'?'#1b4353':'#EF4123', weight: 5, opacity: 0.5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(window.polyline.getBounds(), { padding: [60, 60] });
    switchTab('info');
}

function isOpen(hours) {
    if (!hours || hours === "終日") return true;
    try {
        const now = new Date();
        const [start, end] = hours.split('-').map(h => {
            const [hh, mm] = h.trim().split(':').map(Number);
            const d = new Date(); d.setHours(hh, mm, 0); return d;
        });
        return now >= start && now <= end;
    } catch(e) { return true; }
}

async function callGemini() {
    const key = document.getElementById('gemini-key').value;
    if (!key) return alert("API Key required");
    const thinking = document.getElementById('ai-thinking');
    thinking.classList.remove('hidden');
    try {
        const interests = Array.from(document.querySelectorAll('.interest-chip.bg-brand-500, .interest-chip.bg-disaster-600')).map(b => b.innerText);
        const req = document.getElementById('ai-request').value;
        const in1 = document.getElementById('ai-input-1').value;
        const in2 = document.getElementById('ai-input-2').value;
        
        const prompt = `日田市の観光プランを提案してください。\n言語: ${currentLang}\n興味: ${interests.join(', ')}\n要望: ${req}\n滞在時間: ${in1}\n予算: ${in2}\n選択中のスポット: ${selectedSpots.map(s=>s.スポット名).join(', ')}`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const json = await res.json();
        alert(json.candidates[0].content.parts[0].text);
    } catch(e) {
        alert(t('error') + e.message);
    } finally {
        thinking.classList.add('hidden');
    }
}

function renderEvents() {
    const pane = document.getElementById('pane-extra');
    pane.innerHTML = `<h3 class="text-brand-500 font-black text-sm mb-4 uppercase tracking-wider">${t('event').toUpperCase()}</h3>` + 
        [1,2,3,4].map(i => `<div class="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-4"><h4 class="font-black text-slate-800 text-sm mb-1">${t('event_'+i)}</h4><p class="text-[10px] text-slate-500 leading-relaxed font-medium">${t('event_desc_'+i)}</p></div>`).join('');
}

const disasterLinks = {
    h_map: "https://www.city.hita.oita.jp/site/bousai/2380.html",
    d_portal: "https://www.city.hita.oita.jp/site/bousai/",
    oita_bousai: "https://www.pref.oita.jp/site/bosainotishiki/",
    emergency_contact: "https://www.city.hita.oita.jp/soshiki/25/1824.html"
};

function renderDisasterInfo() {
    const pane = document.getElementById('pane-extra');
    pane.innerHTML = `<h3 class="text-disaster-600 font-black text-sm mb-4 uppercase tracking-wider">${t('info').toUpperCase()}</h3>` + 
        ['h_map', 'd_portal', 'oita_bousai', 'emergency_contact'].map(k => `
            <div class="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm mb-4 cursor-pointer active:scale-[0.98] transition-all" onclick="window.open('${disasterLinks[k]}', '_blank')">
                <h4 class="font-black text-slate-800 text-sm mb-1">${t(k)}</h4>
                <p class="text-[10px] text-slate-500 leading-relaxed font-medium mb-3">${t(k+'_desc')}</p>
                <button class="w-full py-2.5 rounded-xl bg-disaster-50 text-disaster-600 border border-disaster-100 text-[10px] font-bold transition-all hover:bg-disaster-100">
                    <i class="fas fa-external-link-alt mr-2"></i>OPEN
                </button>
            </div>`).join('');
}
