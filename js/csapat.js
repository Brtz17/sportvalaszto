import { client, databases, Query, ID, account } from "./lib/appwrite.js";

let teamData = null;
let map = null;
let marker = null;

const ICONS = {
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l1.56-1.56a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    web:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    map:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    money: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
};

function infoRow(iconSvg, labelText, valueHTML) {
    return `
        <div class="info-row">
            <div class="info-row-icon" aria-hidden="true">${iconSvg}</div>
            <div>
                <div class="info-row-label">${labelText}</div>
                <div class="info-row-val">${valueHTML}</div>
            </div>
        </div>`;
}

async function getIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('id') || window.location.href.split('?id=')[1];
        if (teamId) {
            await trackPageView(teamId);
            await showTeamView(teamId);
        } else {
            document.getElementById('content').innerHTML = '<p class="error">Érvénytelen link</p>';
            setTimeout(() => window.location = '/', 2000);
        }
    } catch (error) {
        console.error('Hiba az URL feldolgozásában:', error);
        setTimeout(() => window.location = '/', 2000);
    }
}

async function trackPageView(teamId) {
    try {
        let ip = 'unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ip = ipData.ip;
        } catch {}

        let anonymizedIp = ip;
        if (ip.includes('.') && ip !== 'unknown') {
            const parts = ip.split('.');
            if (parts.length === 4) anonymizedIp = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        }

        await databases.createDocument(
            '68fe32ea0008ab84b709',
            'pageviews',
            ID.unique(),
            {
                teamId,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                ipAddress: anonymizedIp,
                userAgent: navigator.userAgent || 'unknown',
                source: window.location.search.includes('ref=') ? 'link' : 'direct'
            }
        );
    } catch (error) {
        console.error('Failed to track pageview:', error);
    }
}

async function showTeamView(teamId) {
    try {
        teamData = await databases.getDocument('68fe32ea0008ab84b709', 'csapatok', teamId);

        if (!teamData) {
            document.getElementById('content').innerHTML = '<p class="error">Csapat nem található</p>';
            return;
        }

        document.title = `${teamData.nev} - Sportválasztó`;

        const content = document.getElementById('content');

        // Fejléc cimkék
        const fejlecCimkekHTML = teamData.cimkek?.length
            ? `<div class="fejlec-cimkek">${teamData.cimkek.map(c => `<span class="cimke-display">${c}</span>`).join('')}</div>`
            : '';

        // Logo
        const logoHTML = teamData.kep
            ? `<div class="csapat-logo-wrap"><img class="csapat-logo" src="${teamData.kep}" alt="${teamData.nev} logója" onerror="this.parentElement.style.display='none'"></div>`
            : '';

        // Cím
        const teljesCim = (teamData.iranyitoszam && teamData.varos && teamData.utca && teamData.hazszam)
            ? `${teamData.iranyitoszam} ${teamData.varos}, ${teamData.utca} ${teamData.hazszam}`
            : '';

        // Info sorok összeállítása (csak kitöltött mezők)
        const rows = [];

        if (teamData.email)
            rows.push(infoRow(ICONS.email, 'Email', `<a href="mailto:${teamData.email}">${teamData.email}</a>`));

        if (teamData.telefon)
            rows.push(infoRow(ICONS.phone, 'Telefon', `<a href="tel:${teamData.telefon}">${teamData.telefon}</a>`));

        if (teamData.weboldal)
            rows.push(infoRow(ICONS.web, 'Weboldal', `<a href="${teamData.weboldal}" target="_blank" rel="noopener noreferrer">${teamData.weboldal}</a>`));

        if (teljesCim)
            rows.push(infoRow(ICONS.map, 'Cím',
                `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(teljesCim)}" target="_blank" rel="noopener noreferrer">${teljesCim}</a>`
            ));

        if (teamData.tagdij && teamData.tagdij !== '0')
            rows.push(infoRow(ICONS.money, 'Tagdíj', `<span class="tagdij">${teamData.tagdij} Ft</span>`));

        // Térkép
        const mapHTML = teljesCim
            ? `<div id="map-container"><div id="map"></div></div>`
            : '';

        // Leírás
        const hasLeiras = teamData.leiras && teamData.leiras.trim() && teamData.leiras.trim() !== '<br>';
        const leirasHTML = hasLeiras
            ? `<div class="leiras-block" id="info-leiras">
                <label>Leírás</label>
                <div id="leiras">${teamData.leiras}</div>
               </div>`
            : '';

        content.innerHTML = `
            <div id="fejlec">
                ${logoHTML}
                <div class="fejlec-info">
                    <p class="fejlec-eyebrow">Sportcsapat</p>
                    <h2>${teamData.nev}</h2>
                    ${fejlecCimkekHTML}
                </div>
            </div>

            ${rows.length ? `<div class="info-block">${rows.join('')}</div>` : ''}
            ${mapHTML}
            ${leirasHTML}

            <div class="button-group">
                <button class="btn-primary" id="edit-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>
                        <line x1="15" y1="5" x2="19" y2="9"/>
                    </svg>
                    Jelentkezés szerkesztőnek
                </button>
                <button id="report-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                    Jelentés
                </button>
            </div>
        `;

        if (teljesCim) initLeaflet();

        // Modal kezelők
        const modal = document.getElementById('modal');
        const closeModal = () => { modal.style.display = 'none'; };
        const reportForm = document.getElementById('report-form');
        const editForm = document.getElementById('edit-form');
        const modalTitle = document.getElementById('modal-title');

        document.getElementById('report-btn').addEventListener('click', () => { 
            modal.style.display = 'block'; 
            reportForm.style.display = 'flex'; 
            editForm.style.display = 'none'; 
            modalTitle.innerHTML = `Jelentés beküldése`;
        });
        
        document.getElementById('edit-btn').addEventListener('click', () => {
            modal.style.display = 'block'; 
            reportForm.style.display = 'none'; 
            editForm.style.display = 'flex';
            modalTitle.innerHTML = `Jelentkezés szerkesztőnek`; 
        });
        
        document.querySelector('.close').addEventListener('click', closeModal);
        document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape') closeModal(); 
        });

        // Jelentés beküldése
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
                } catch {}
                
                await databases.createDocument(
                    '68fe32ea0008ab84b709', 
                    'reports', 
                    ID.unique(), 
                    {
                        teamId, 
                        userId, 
                        reason, 
                        description
                    }
                );
                alert('Jelentés elküldve!');
                closeModal();
                document.getElementById('report-form').reset();
            } catch (error) {
                console.error('Hiba a jelentés küldésekor:', error);
                alert('Hiba történt a jelentés küldésekor.');
            }
        });

        // Szerkesztői jelentkezés
        document.getElementById('edit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('editor-email').value.trim().toLowerCase();
            const description = document.getElementById('edit-description').value.trim();
            
            if (!email) { 
                alert('Kérjük, adja meg email címét!'); 
                return; 
            }
            
            // Ellenőrizzük, létezik-e már az email
            try {
                const response = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'jelentkezes',
                    [
                        Query.equal('jelentkezoEmail', email),
                        Query.equal('csapat', teamId)
                    ]
                );

                if (response.total > 0) {
                    alert('Ezzel az email címmel már létezik jelentkezés!');
                    return;
                }
                
                // Ha nem létezik, létrehozzuk az új dokumentumot
                await databases.createDocument(
                    '68fe32ea0008ab84b709',
                    'jelentkezes',
                    ID.unique(),
                    {
                        csapat: teamId,
                        jelentkezoEmail: email,
                        description: description
                    }
                );
                
                alert('Jelentkezés elküldve! Jelentkezzen be a csapat szerkesztéséhez!');
                closeModal();
                document.getElementById('edit-form').reset();
                
            } catch (error) {
                console.error('Hiba történt:', error);
                alert('Hiba történt a jelentkezés küldésekor: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Hiba a csapat betöltésekor:', error);
        document.getElementById('content').innerHTML = `
            <div class="error">
                <p>Hiba történt a csapat betöltésekor</p>
                <p><small>${error.message}</small></p>
            </div>`;
    }
}

function initLeaflet() {
    setTimeout(() => {
        if (!window.L) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(css);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => setTimeout(initTerkep, 100);
            document.body.appendChild(script);
        } else {
            setTimeout(initTerkep, 100);
        }
    }, 100);
}

function initTerkep() {
    try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer || !teamData?.varos) return;

        const teljesCim = `${teamData.iranyitoszam} ${teamData.varos}, ${teamData.utca || ''} ${teamData.hazszam || ''}`.trim();

        map = L.map('map').setView([47.4979, 19.0402], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        showAddressOnMap(teljesCim);
    } catch (error) {
        console.error('Hiba a térkép létrehozásakor:', error);
        const mc = document.getElementById('map-container');
        if (mc) mc.style.display = 'none';
    }
}

async function showAddressOnMap(address) {
    if (!address?.trim()) return;
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=hu&accept-language=hu`
        );
        await new Promise(r => setTimeout(r, 500));
        const data = await response.json();

        if (data?.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            map.setView([lat, lon], 14);
            if (marker) map.removeLayer(marker);
            marker = L.marker([lat, lon], { title: teamData.nev }).addTo(map);
            marker.bindPopup(`<strong>${teamData.nev}</strong><br><small>${address}</small>`);
        } else {
            map.setView([47.4979, 19.0402], 8);
        }
    } catch (error) {
        console.error('Hiba a cím keresésében:', error);
    }
}

document.addEventListener('DOMContentLoaded', getIdFromUrl);

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then(() => {
                console.log("Service Worker regisztrálva");
            })
            .catch(err => {
                console.error(err);
            });
    });
}

document.addEventListener('click', function(e) {
  const target = e.target.closest('.cimke-display');
  if (target) {
    const content = target.textContent; // vagy innerHTML, dataset stb.
    window.location.href = `/?sport=${encodeURIComponent(content)}`;
  }
});