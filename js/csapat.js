import { databases, ID, account } from "./lib/appwrite.js";

// Globális változók a térképhez
let teamData = null; // A csapat adatait itt tároljuk
let map = null;      // A térkép objektum
let marker = null;   // A marker a térképen

async function getIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('id') || window.location.href.split('?id=')[1];
                
        if (teamId) {
            // 1. Pageview rögzítése (közvetlen Appwrite)
            await trackPageView(teamId);
            
            // 2. Csapat adatainak betöltése
            await showTeamView(teamId);
        } else {
            console.error('Nincs teamId az URL-ben');
            document.getElementById('content').innerHTML = '<p class="error">Érvénytelen link</p>';
            setTimeout(() => window.location = '/', 2000);
        }
    } catch (error) {
        console.error('Hiba az URL feldolgozásában:', error);
        setTimeout(() => window.location = '/', 2000);
    }
}

// Pageview rögzítése KÖZVETLENÜL Appwrite-ba
async function trackPageView(teamId) {
    try {        
        // IP cím lekérése külső API-ról (opcionális)
        let ip = 'unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ip = ipData.ip;
        } catch (ipError) {
            console.log('IP cím lekérése sikertelen, default érték használata');
        }
        
        // IP anonimizálás
        let anonymizedIp = ip;
        if (ip.includes('.') && ip !== 'unknown') {
            const parts = ip.split('.');
            if (parts.length === 4) {
                anonymizedIp = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
            }
        }
        
        // Dokumentum létrehozása Appwrite-ban
        const document = await databases.createDocument(
            '68fe32ea0008ab84b709',
            'pageviews',
            ID.unique(),
            {
                teamId: teamId,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                ipAddress: anonymizedIp,
                userAgent: navigator.userAgent || 'unknown',
                source: window.location.search.includes('ref=') ? 'link' : 'direct'
            }
        );
        
        return document;
        
    } catch (error) {
        console.error('⚠️ Failed to track pageview:', error);
        return null;
    }
}

// Csapat adatainak betöltése és megjelenítése
async function showTeamView(teamId) {
    try {
        // Csapat adatainak lekérése Appwrite-ból
        teamData = await databases.getDocument(
            '68fe32ea0008ab84b709', 
            'csapatok', 
            teamId
        );
        
        if (!teamData) {
            console.error('Csapat nem található');
            document.getElementById('content').innerHTML = '<p class="error">Csapat nem található</p>';
            return;
        }
        
        // Oldal címének beállítása
        document.title = `${teamData.nev} - SportVálasztó`;

        const content = document.getElementById('content');
        
        // Címkék (sportok) generálása
        const cimkekHTML = teamData.cimkek && teamData.cimkek.length > 0 
            ? teamData.cimkek.map(cimke => `
                <div class="cimke-display">${cimke}</div>
            `).join('')
            : '<div class="no-data">Nincsenek sportok megadva</div>';
        
        // Leírás - üres esetén üres string
        let leirasHTML = teamData.leiras || '';
        
        // Cím összeállítása
        const teljesCim = teamData.iranyitoszam && teamData.varos && teamData.utca && teamData.hazszam 
            ? `${teamData.iranyitoszam} ${teamData.varos}, ${teamData.utca} ${teamData.hazszam}`
            : '';
        
        // HTML tartalom generálása
        content.innerHTML = `
            <div id="fejlec">
                <h2 style="margin-bottom: 1rem">${teamData.nev}</h2>
                
                <div id="csapat-logo-container" style="grid-template-columns: 1fr;">
                    <img class="csapat-logo" src="${teamData.kep}" alt="${teamData.nev} logója" 
                        onerror="this.style.display='none'" 
                        style="${teamData.kep ? '' : 'display: none'}">
                </div>
            </div>

            <div class="info-container">
                    <div class="info-item" id="info-email">
                        <label>Email</label>
                        <span>${teamData.email ? `<a href="mailto:${teamData.email}">${teamData.email}</a>` : '-'}</span>
                    </div>
                    <div class="info-item" id="info-telefon">
                        <label>Telefon</label>
                        <span>${teamData.telefon ? `<a href="tel:${teamData.telefon}">${teamData.telefon}</a>` : '-'}</span>
                    </div>
                    <div class="info-item" id="info-web">
                        <label>Weboldal</label>
                        <span>${teamData.weboldal ? `<a href="${teamData.weboldal}" target="_blank" rel="noopener noreferrer">${teamData.weboldal}</a>` : '-'}</span>
                    </div>

                    <div class="info-item" id="info-cim">
                        <label>Cím</label>
                        <span id="cim-szoveg">
                            ${teljesCim ? `
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(teljesCim)}" 
                                   target="_blank" 
                                   rel="noopener noreferrer">
                                    ${teljesCim}
                                </a>
                            ` : '-'}
                        </span>                 
                    </div>

                    ${screen.width <= 400 ? `                    <div id="map-container">
                        <div id="map"></div>
                    </div>` : ''}

                    <div class="info-item" id="info-tagdij">
                        <label>Tagdíj</label>
                        <span class="tagdij">${teamData.tagdij ? teamData.tagdij + ' Ft' : ''}</span>
                    </div>
                    
                    ${screen.width > 401 ? `                    <div id="map-container">
                        <div id="map"></div>
                    </div>` : ''}

                    <div class="cimkek-container">
                        <label>Sportok</label>
                        ${cimkekHTML}
                    </div>

                    <div class="leiras-content" id="info-leiras">
                        <label>Leírás</label>
                        <div id="leiras">${leirasHTML}</div>
                    </div>
            </div>

            <div class="button-group">
                <button id="report-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                    Jelentés
                </button>
            </div>
        `;
        
        // Üres mezők elrejtése
        setTimeout(() => {
            hideEmptyFields(teamData);
        }, 10);
        
        // Kép hibakezelés
        const logoImg = document.querySelector('.csapat-logo');
        if (logoImg) {
            logoImg.onerror = function() {
                this.style.display = 'none';
            };
        }
        
        // Térkép inicializálása, ha van cím
        if (teljesCim) {
            initLeaflet();
        } else {
            // Ha nincs cím, elrejtjük a térképet
            const mapItem = document.getElementById('info-terkep');
            if (mapItem) {
                mapItem.style.display = 'none';
            }
        }

        // Report button event listener
        document.getElementById('report-btn').addEventListener('click', () => {
            document.getElementById('report-modal').style.display = 'block';
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('report-modal').style.display = 'none';
        });

        // Close modal on outside click
        window.addEventListener('click', (event) => {
            if (event.target == document.getElementById('report-modal')) {
                document.getElementById('report-modal').style.display = 'none';
            }
        });

        // Report form submit
        document.getElementById('report-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const reason = document.getElementById('report-reason').value;
            const description = document.getElementById('report-description').value;
            if (!reason) {
                alert('Kérjük, válassz egy okot!');
                return;
            }
            try {
                let userId = null;
                try {
                    const user = await account.get();
                    userId = user.$id;
                } catch {
                    // User not logged in
                }
                await databases.createDocument(
                    '68fe32ea0008ab84b709',
                    'reports', // Collection name for reports
                    ID.unique(),
                    {
                        teamId: teamId,
                        userId: userId,
                        reason: reason,
                        description: description,
                    }
                );
                alert('Jelentés elküldve!');
                document.getElementById('report-modal').style.display = 'none';
                document.getElementById('report-form').reset();
            } catch (error) {
                console.error('Hiba a jelentés küldésekor:', error);
                alert('Hiba történt a jelentés küldésekor.');
            }
        });

    } catch (error) {
        console.error('❌ Hiba a csapat betöltésekor:', error);
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="error">
                    <p>Hiba történt a csapat betöltésekor</p>
                    <p><small>${error.message}</small></p>
                </div>
            `;
        }
    }
}

// Üres mezők elrejtése
function hideEmptyFields(team) {
    const fields = [
        { key: 'weboldal', id: 'info-web' },
        { key: 'telefon', id: 'info-telefon' },
        { key: 'tagdij', id: 'info-tagdij' },
        { key: 'leiras', id: 'info-leiras' }
    ];
        
    fields.forEach(field => {
        const value = team[field.key];
        const isEmpty = !value || 
                       (typeof value === 'string' && value.trim() === "") || 
                       value === "0" || 
                       value === 0 ||
                       value == "<br>";
        
        if (isEmpty) {
            const element = document.getElementById(field.id);
            if (element) {
                element.style.display = 'none';
            }
        }
    });

    
    // Email cím ellenőrzése
    const emailElement = document.getElementById('info-email');
    if (emailElement && (!team.email || team.email.trim() === "")) {
        emailElement.style.display = 'none';
    }
}

// Térkép inicializálása
function initLeaflet() {
    const mapContainer = document.getElementById('map');
    const mapContainerContainer = document.querySelector('#map-container');
    const tagdijContainer = document.getElementById('info-tagdij');
    if (!mapContainer & !mapContainerContainer) {
        console.log('Térkép konténer nem található');
        return;
    }
    
    // Térkép konténer stílus beállítása
    mapContainer.style.borderRadius = '8px';
    mapContainer.style.border = '1px solid #ddd';
    
    // Betöltési állapot megjelenítése
    const loading = document.getElementById('map-loading');
    if (loading) loading.style.display = 'block';
    
    // Várakozás, hogy biztosan renderelődjön a div
    setTimeout(() => {
        if (!window.L) {
            // Leaflet CSS betöltése
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            css.onload = () => console.log('Leaflet CSS betöltve');
            document.head.appendChild(css);
            
            // Leaflet JS betöltése
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            
            script.onload = function() {
                console.log('Leaflet JS betöltve');
                if (loading) loading.style.display = 'none';
                setTimeout(() => initTerkep(), 100);
            };
            
            script.onerror = function() {
                console.error('Leaflet betöltése sikertelen');
                if (loading) loading.style.display = 'none';
                const errorDiv = document.getElementById('map-error');
                if (errorDiv) errorDiv.style.display = 'block';
            };
            
            document.body.appendChild(script);
        } else {
            console.log('Leaflet már betöltve');
            if (loading) loading.style.display = 'none';
            setTimeout(() => initTerkep(), 100);
        }
    }, 100);
}

// Térkép létrehozása és cím megjelenítése
function initTerkep() {
    try {
        // Ellenőrzés, hogy van-e térkép konténer
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Térkép konténer nem található');
            return;
        }
        
        // Ellenőrzés, hogy van-e cím
        if (!teamData || !teamData.iranyitoszam || !teamData.varos) {
            mapContainer.style.display = 'none';
            return;
        }
        
        // Cím összeállítása
        const teljesCim = `${teamData.iranyitoszam} ${teamData.varos}, ${teamData.utca || ''} ${teamData.hazszam || ''}`.trim();
        
        // Térkép létrehozása (alapértelmezett Budapest középponttal)
        map = L.map('map').setView([47.4979, 19.0402], 13);
        
        // OpenStreetMap csempék hozzáadása
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Cím keresése és megjelenítése
        showAddressOnMap(teljesCim);
        
    } catch (error) {
        console.error('Hiba a térkép létrehozásakor:', error);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.style.display = 'none';
        }
    }
}

// Cím megkeresése és megjelenítése a térképen
async function showAddressOnMap(address) {
    if (!address || address.trim() === '') {
        console.log('Üres cím, térkép nem frissül');
        return;
    }
    
    try {
        console.log('Cím keresése:', address);
        
        // Geocoding API hívása
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(address)}&` +
            `format=json&` +
            `limit=1&` +
            `countrycodes=hu&` +
            `accept-language=hu`
        );
        
        // Rate limiting tiszteletben tartása
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            // Térkép középre állítása
            map.setView([lat, lon], 12);
            
            // Régi marker törlése
            if (marker) {
                map.removeLayer(marker);
            }
            
            // Új marker hozzáadása
            marker = L.marker([lat, lon], {
                title: teamData.nev
            }).addTo(map);
            
            // Popup hozzáadása
            marker.bindPopup(`
                <div style="font-weight: bold;">${teamData.nev}</div>
                <div style="font-size: 12px; margin-top: 5px;">${address}</div>
            `);
            
            console.log('Cím megtalálva:', lat, lon);
        } else {
            console.log('Cím nem található:', address);
            
            // Hibaüzenet a térképen
            map.setView([47.4979, 19.0402], 8);
            
            if (marker) {
                map.removeLayer(marker);
            }
            
            marker = L.marker([47.4979, 19.0402])
                .addTo(map)
                .bindPopup(`
                    <div style="color: #d32f2f;">
                        Cím nem található<br>
                        <small>${address}</small>
                    </div>
                `)
                .openPopup();
        }
        
    } catch (error) {
        console.error('Hiba a cím keresésében:', error);
        
        // Hiba esetén is mutassunk valamit
        map.setView([47.4979, 19.0402], 8);
        
        if (marker) {
            marker.bindPopup(`
                <div style="color: #d32f2f;">
                    Hiba a cím keresésében<br>
                    <small>${error.message}</small>
                </div>
            `).openPopup();
        }
    }
}

// Oldal betöltésekor futtatjuk
document.addEventListener('DOMContentLoaded', getIdFromUrl);