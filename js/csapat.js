import { databases, ID } from "./lib/appwrite.js";

async function getIdFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('id') || window.location.href.split('?')[1];
        
        console.log('Team ID from URL:', teamId);
        
        if (teamId) {
            // 1. Pageview rögzítése (közvetlen Appwrite)
            await trackPageView(teamId);
            
            // 2. Csapat adatainak betöltése
            await showTeamView(teamId);
        } else {
            console.error('Nincs teamId az URL-ben');
            document.getElementById('content').innerHTML = '<p class="error">Érvénytelen link</p>';
        }
    } catch (error) {
        console.error('Hiba az URL feldolgozásában:', error);
    }
}

// Pageview rögzítése KÖZVETLENÜL Appwrite-ba
async function trackPageView(teamId) {
    try {
        console.log('📊 Tracking pageview for team:', teamId);
        
        // IP cím lekérése külső API-ról (opcionális)
        let ip = 'unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ip = ipData.ip;
        } catch (ipError) {
            console.log('IP cím lekérése sikertelen, használom a default értéket');
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
        
        console.log('✅ Pageview tracked:', document.$id);
        return document;
        
    } catch (error) {
        console.error('⚠️ Failed to track pageview:', error);
        // Nem kritikus hiba - nem blokkoljuk a csapat megjelenítését
        return null;
    }
}

// Csapat adatainak betöltése és megjelenítése
async function showTeamView(teamId) {
    try {
        // Csapat adatainak lekérése Appwrite-ból
        const team = await databases.getDocument(
            '68fe32ea0008ab84b709', 
            'csapatok', 
            teamId
        );
        
        if (!team) {
            console.error('Csapat nem található');
            document.getElementById('content').innerHTML = '<p class="error">Csapat nem található</p>';
            return;
        }
        
        // Oldal címének beállítása
        document.title = `${team.nev} - SportVálasztó`;

        const content = document.getElementById('content');
        
        // Címkék (sportok) generálása
        const cimkekHTML = team.cimkek && team.cimkek.length > 0 
            ? team.cimkek.map(cimke => `
                <div class="cimke-display">${cimke}</div>
            `).join('')
            : '<div class="no-data">Nincsenek sportok megadva</div>';
        
        // Leírás - üres esetén üres string
        let leirasHTML = team.leiras || '';
        
        // HTML tartalom generálása
        content.innerHTML = `
    <div id="fejlec">
        <h2 style="margin-bottom: 1rem">${team.nev}</h2>
        
        <div id="csapat-logo-container" style="grid-template-columns: 1fr;">
            <img class="csapat-logo" src="${team.kep}" alt="${team.nev} logója" 
                onerror="this.style.display='none'" 
                style="${team.kep ? '' : 'display: none'}">
        </div>
    </div>

    <div class="info-container">
            <div class="info-item" id="info-email">
                <label>Email</label>
                <span>${team.email || '-'}</span>
            </div>
            <div class="info-item" id="info-telefon">
                <label>Telefon</label>
                <span>${team.telefon || '-'}</span>
            </div>
            <div class="info-item" id="info-web">
                <label>Weboldal</label>
                <span>${team.weboldal ? `<a href="${team.weboldal}" target="_blank" rel="noopener noreferrer">${team.weboldal}</a>` : '-'}</span>
            </div>

            <div class="info-item" id="info-cim">
                <label>Cím</label>
                <span>${team.iranyitoszam} ${team.varos}, ${team.utca} ${team.hazszam}</span>
            </div>

            <div class="info-item" id="info-tagdij">
                <label>Tagdíj</label>
                <span class="tagdij">${team.tagdij ? team.tagdij + ' Ft' : '-'}</span>
            </div>

            <div class="cimkek-container">
                <label>Sportok</label>
                ${cimkekHTML}
            </div>

            <div class="leiras-content" id="info-leiras">
                <label>Leírás</label>
                <div id="leiras">${leirasHTML}</div>
            </div>
    </div>
`;
        
        // Rövid várakozás, majd üres mezők elrejtése
        setTimeout(() => {
            hideEmptyFields(team);
        }, 10);
        
        // Kép hibakezelés
        const logoImg = document.querySelector('.csapat-logo');
        if (logoImg) {
            logoImg.onerror = function() {
                this.style.display = 'none';
                console.log('Logo image failed to load');
            };
        }

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
    
    console.log('Team data for hiding:', team);
    
    fields.forEach(field => {
        const value = team[field.key];
        const isEmpty = !value || 
                       (typeof value === 'string' && value.trim() === "") || 
                       value === "0" || 
                       value === 0;
        
        console.log(`Field: ${field.key}, Value: "${value}", isEmpty: ${isEmpty}`);
        
        if (isEmpty) {
            const element = document.getElementById(field.id);
            if (element) {
                element.style.display = 'none';
                console.log(`Hiding element: ${field.id}`);
            }
        }
    });
    
    // Email cím ellenőrzése
    const emailElement = document.getElementById('info-email');
    if (emailElement && (!team.email || team.email.trim() === "")) {
        emailElement.style.display = 'none';
        console.log('Hiding email (empty)');
    }
}

// Oldal betöltésekor futtatjuk
document.addEventListener('DOMContentLoaded', getIdFromUrl);
