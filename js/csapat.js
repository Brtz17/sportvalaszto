import { databases } from "./lib/appwrite.js";

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