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
    map = L.map('map').setView(userLocation, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-location-icon',
            html: '<i class="fas fa-street-view fa-2x text-primary"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(map).bindPopup("現在地");
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

    // Search & Filter
    document.getElementById('search-input').addEventListener('input', updateList);
    document.getElementById('category-filter').addEventListener('change', updateList);

    // GPS
    document.getElementById('gps-btn').addEventListener('click', () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];
                map.setView(userLocation, 14);
                userMarker.setLatLng(userLocation);
                updateList(); // Refresh distances
            }, (error) => {
                alert("位置情報の取得に失敗しました。");
            });
        } else {
            alert("お使いのブラウザは位置情報をサポートしていません。");
        }
    });

    // Optimize Route
    document.getElementById('optimize-btn').addEventListener('click', optimizeRoute);
    document.getElementById('clear-btn').addEventListener('click', () => {
        selectedSpots = [];
        updateUI();
    });

    // Gemini AI
    document.getElementById('ai-btn').addEventListener('click', callGemini);
}

function updateUI() {
    // Update Category Filter
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

    // Clear old markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const filtered = allData[currentMode].filter(s => {
        const matchSearch = s.スポット名.toLowerCase().includes(searchTerm) || s.説明.toLowerCase().includes(searchTerm);
        const matchCat = category === 'all' || s.カテゴリ === category;
        return matchSearch && matchCat;
    });

    // Calculate distances
    filtered.forEach(s => {
        s.distance = calculateDistance(userLocation[0], userLocation[1], s.緯度, s.経度);
    });
    filtered.sort((a, b) => a.distance - b.distance);

    filtered.forEach(spot => {
        // Add Marker
        const isSelected = selectedSpots.some(s => s.No === spot.No);
        const markerColor = currentMode === 'tourism' ? (isSelected ? 'red' : 'blue') : (isSelected ? 'red' : 'orange');
        
        const marker = L.marker([spot.緯度, spot.経度], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<i class="fas fa-map-marker-alt fa-2x" style="color: ${markerColor};"></i>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            })
        }).addTo(map).bindPopup(`<b>${spot.スポット名}</b><br>${spot.カテゴリ}<br>${spot.distance.toFixed(2)}km`);
        
        marker.on('click', () => {
            showDetail(spot);
        });
        markers.push(marker);

        // Add to List
        const card = document.createElement('div');
        card.className = `spot-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <h6 class="mb-1">${spot.スポット名}</h6>
                <span class="badge ${currentMode === 'tourism' ? 'bg-primary' : 'bg-danger'} rounded-pill">${spot.distance.toFixed(1)}km</span>
            </div>
            <div class="small text-muted">${spot.カテゴリ}</div>
            <div class="mt-2 btn-group btn-group-sm w-100">
                <button class="btn btn-outline-secondary select-btn">${isSelected ? '解除' : '選択'}</button>
                <button class="btn btn-outline-primary detail-btn">詳細</button>
            </div>
        `;
        
        card.querySelector('.select-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelect(spot);
        });
        card.querySelector('.detail-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showDetail(spot);
        });
        card.addEventListener('click', () => {
            map.flyTo([spot.緯度, spot.経度], 15);
            showDetail(spot);
        });
        
        listContainer.appendChild(card);
    });

    document.getElementById('selected-count').textContent = `選択中: ${selectedSpots.length}箇所`;
}

function toggleSelect(spot) {
    const idx = selectedSpots.findIndex(s => s.No === spot.No);
    if (idx >= 0) {
        selectedSpots.splice(idx, 1);
    } else {
        selectedSpots.push(spot);
    }
    updateList();
}

function showDetail(spot) {
    document.getElementById('detail-title').textContent = spot.スポット名;
    document.getElementById('detail-desc').textContent = spot.説明;
    document.getElementById('spot-detail-view').classList.remove('d-none');
    
    // Switch to info tab
    const triggerEl = document.querySelector('#info-tab');
    bootstrap.Tab.getOrCreateInstance(triggerEl).show();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function optimizeRoute() {
    if (selectedSpots.length < 1) {
        alert("スポットを選択してください。");
        return;
    }

    let currentPos = [...userLocation];
    let unvisited = [...selectedSpots];
    let route = [];
    let totalDist = 0;

    while (unvisited.length > 0) {
        let nearestIdx = -1;
        let minDist = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
            const spot = unvisited[i];
            let dist = calculateDistance(currentPos[0], currentPos[1], spot.緯度, spot.経度);
            
            // In tourism mode, consider waiting time score (simplified ranking logic)
            if (currentMode === 'tourism') {
                // Simplified: distance + (waiting_time / 10)
                const waitScore = (spot.待ち時間 || 0) / 10;
                dist += waitScore;
            }

            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }

        const nextSpot = unvisited.splice(nearestIdx, 1)[0];
        route.push(nextSpot);
        totalDist += calculateDistance(currentPos[0], currentPos[1], nextSpot.緯度, nextSpot.経度);
        currentPos = [nextSpot.緯度, nextSpot.経度];
    }

    displayRoute(route, totalDist);
}

function displayRoute(route, totalDist) {
    const statsContainer = document.getElementById('route-stats');
    statsContainer.innerHTML = `
        <div class="mb-1">総距離: <b>${totalDist.toFixed(2)} km</b></div>
        <div class="small">順序:</div>
        <ol class="small mb-2 ps-3">
            ${route.map(s => `<li>${s.スポット名}</li>`).join('')}
        </ol>
    `;

    document.getElementById('route-info').classList.remove('d-none');
    
    // Google Maps Link
    const origin = `${userLocation[0]},${userLocation[1]}`;
    const destination = `${route[route.length-1].緯度},${route[route.length-1].経度}`;
    const waypoints = route.slice(0, -1).map(s => `${s.緯度},${s.経度}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=${currentMode === 'tourism' ? 'driving' : 'walking'}`;
    
    document.getElementById('gmaps-link-btn').onclick = () => window.open(url, '_blank');

    // Draw route on map
    const latlngs = [userLocation, ...route.map(s => [s.緯度, s.経度])];
    if (window.routePolyline) map.removeLayer(window.routePolyline);
    window.routePolyline = L.polyline(latlngs, {color: currentMode === 'tourism' ? 'blue' : 'red'}).addTo(map);
    map.fitBounds(window.routePolyline.getBounds());
}

async function callGemini() {
    const key = document.getElementById('gemini-key').value;
    if (!key) {
        alert("Gemini APIキーを入力してください。");
        return;
    }

    const time = document.getElementById('ai-time').value || "未指定";
    const budget = document.getElementById('ai-budget').value || "未指定";
    const responseContainer = document.getElementById('ai-response');
    
    responseContainer.textContent = "考え中...";
    responseContainer.classList.remove('d-none');

    const spotsSample = allData.tourism.slice(0, 10).map(s => `${s.スポット名}: ${s.説明}`).join('\n');
    
    const prompt = `あなたは日田市の観光コンシェルジュです。以下の情報を参考に、魅力的なプランを提案してください。
【条件】滞在時間: ${time}, 予算: ${budget}
【スポット情報】
${spotsSample}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        responseContainer.textContent = text;
    } catch (error) {
        responseContainer.textContent = "エラーが発生しました: " + error.message;
    }
}

function renderEvents() {
    const events = [
        { month: 2, name: "天領日田おひなまつり", desc: "豆田町一帯で雛人形を展示" },
        { month: 5, name: "日田川開き観光祭", desc: "九州最大級の花火大会" },
        { month: 7, name: "日田祇園祭", desc: "ユネスコ無形文化遺産" },
        { month: 10, name: "日田天領まつり", desc: "時代絵巻パレード" },
        { month: 11, name: "千年あかり", desc: "竹灯籠のライトアップ" }
    ];

    const container = document.getElementById('event-list');
    container.innerHTML = '<h6><i class="fas fa-calendar-alt"></i> 年間主要イベント</h6>';
    events.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'mb-2 p-1 border-bottom';
        div.innerHTML = `<strong>${ev.month}月: ${ev.name}</strong><br><span class="text-muted">${ev.desc}</span>`;
        container.appendChild(div);
    });
}
