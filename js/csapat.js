import { databases, ID } from "./lib/appwrite.js";

async function getIdFromUrl() {
    try {
        const currentUrl = window.location.href;
        const teamId = currentUrl.split('?')[1];
        console.log('Team ID:', teamId);
        
        if (teamId) {
            await showTeamView(teamId);
        } else {
            console.error('Nincs teamId az URL-ben');
            document.getElementById('content').innerHTML = '<p class="error">Érvénytelen link</p>';
        }
    } catch (error) {
        console.error('Hiba az URL feldolgozásában:', error);
    }
}

async function showTeamView(teamId) {
    try {
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
        
        document.title = `${team.nev} - SportVálasztó`;

        const content = document.getElementById('content');
        
        const cimkekHTML = team.cimkek && team.cimkek.length > 0 
            ? team.cimkek.map(cimke => `
                <div class="cimke-display">${cimke}</div>
            `).join('')
            : '<div class="no-data">Nincsenek sportok megadva</div>';
        
        // Leírás HTML tartalom - üres esetén placeholder
        let leirasHTML = team.leiras || '';
  
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
                <span>${team.weboldal ? `<a href="${team.weboldal}" target="_blank">${team.weboldal}</a>` : '-'}</span>
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
    
    // VÁRJUNK EGY KICSIT, HOGY A HTML BETELEPÜLJÖN
    setTimeout(() => {
        hideEmptyFields(team);
    }, 10);

    } catch (error) {
        console.error('Hiba a csapat betöltésekor:', error);
        content.innerHTML = '<p class="error">Hiba történt a csapat betöltésekor</p>';
    }
}

function hideEmptyFields(team) {
    const fields = [
        { key: 'weboldal', id: 'info-web' },
        { key: 'telefon', id: 'info-telefon' },
        { key: 'tagdij', id: 'info-tagdij' },
        { key: 'leiras', id: 'info-leiras' }
    ];
    
    console.log('Team data for hiding:', team); // DEBUG
    
    fields.forEach(field => {
        const value = team[field.key];
        const isEmpty = !value || 
                       (typeof value === 'string' && value.trim() === "") || 
                       value === "0" || 
                       value === 0 ;
        
        console.log(`Field: ${field.key}, Value: "${value}", isEmpty: ${isEmpty}`); // DEBUG
        
        if (isEmpty) {
            const element = document.getElementById(field.id);
            console.log(`Element found for ${field.id}:`, element); // DEBUG
            if (element) {
                element.style.display = 'none';
                console.log(`Hiding element: ${field.id}`); // DEBUG
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', getIdFromUrl);

export default async function handler(req, res) {
    console.log("beléptünk a függvénybe")
  try {
    console.log("Létrehozás el lett kezdve");
    
    // Ellenőrizd a metódust
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Ellenőrizd, hogy van-e body
    if (!req.body) {
      return res.status(400).json({ error: 'Missing request body' });
    }
    
    const { teamId, userId = null, source = 'direct' } = req.body;
    
    // Kötelező mező ellenőrzése
    if (!teamId) {
      return res.status(400).json({ error: 'teamId is required' });
    }
    
    // IP anonimizálás
    let ip = 'unknown';
    if (req.headers['x-forwarded-for']) {
      ip = req.headers['x-forwarded-for'].split(',')[0].trim();
    } else if (req.socket && req.socket.remoteAddress) {
      ip = req.socket.remoteAddress;
    }
    
    // IPv4 cím anonimizálása (IPv6-ot kezelj külön)
    let anonymizedIp = 'unknown';
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        anonymizedIp = parts.slice(0, 3).join('.') + '.0';
      }
    }
    
    console.log(`Creating pageview for team: ${teamId}, IP: ${anonymizedIp}`);
    
    // Dokumentum létrehozása
    const document = await databases.createDocument(
      '68fe32ea0008ab84b709', // Database ID
      'pageviews', // Collection ID
      ID.unique(),
      {
        teamId,
        userId,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        ipAddress: anonymizedIp,
        userAgent: req.headers['user-agent'] || 'unknown',
        source
      }
    );
    
    console.log("Dokumentum sikeresen létrehozva:", document.$id);
    res.status(200).json({ success: true, documentId: document.$id });
    
  } catch (error) {
    console.error('Error tracking pageview:', error);
    
    // Részletes hiba információk
    res.status(500).json({ 
      error: 'Tracking failed',
      message: error.message,
      code: error.code || 'unknown'
    });
  }
}