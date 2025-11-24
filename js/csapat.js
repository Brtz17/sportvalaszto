import { databases} from "./lib/appwrite.js";

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
        
        const content = document.getElementById('content');
        
        const cimkekHTML = team.cimkek && team.cimkek.length > 0 
            ? team.cimkek.map(cimke => `
                <div class="cimke-display">${cimke}</div>
            `).join('')
            : '<div class="no-data">Nincsenek sportok megadva</div>';
        
        const szerkesztoHTML = team.szerkeszto && team.szerkeszto.length > 0 
            ? team.szerkeszto.map(email => `
                <div class="szerkeszto-display">${email}</div>
            `).join('')
            : '<div class="no-data">Nincsenek szerkesztők</div>';

        // Leírás HTML tartalom - üres esetén placeholder
        let leirasHTML = team.leiras || '';
        if (!leirasHTML.trim()) {
            leirasHTML = '<br>'; // Üres div helyett br tag
        }
  
        content.innerHTML = `
    <div id="fejlec">
        <h2 style="margin-bottom: 1rem">${team.nev}</h2>
        
        <div id="csapat-logo-container" style="grid-template-columns: 1fr;">
            <img class="csapat-logo" src="${team.kep}" alt="${team.nev} logója" 
                onerror="this.style.display='none'" 
                style="${team.kep ? '' : 'display: none'}">
            ${!team.kep ? '<p class="no-image">Nincs feltöltött kép</p>' : ''}
        </div>
    </div>

    <div class="info-container">
            <div class="info-item">
                <label>Email</label>
                <span>${team.email || '-'}</span>
            </div>
            <div class="info-item">
                <label>Telefon</label>
                <span>${team.telefon || '-'}</span>
            </div>
            <div class="info-item">
                <label>Weboldal</label>
                <span>${team.weboldal ? `<a href="${team.weboldal}" target="_blank">${team.weboldal}</a>` : '-'}</span>
            </div>

            <div class="info-item">
                <label>Cím</label>
                <span>${team.iranyitoszam} ${team.varos} ${team.utca} ${team.hazszam}</span>
            </div>

            <div class="info-item">
                <label>Tagdíj</label>
                <span class="tagdij">${team.tagdij ? team.tagdij + ' Ft' : '-'}</span>
            </div>

            <div class="cimkek-container">
                <label>Sportok</label>
                ${cimkekHTML}
            </div>

            <div class="leiras-content">
                <label>Leírás</label>
                <div id="leiras">${leirasHTML}</div>
            </div>
    </div>
`;

    } catch (error) {
        console.error('Hiba a csapat betöltésekor:', error);
        content.innerHTML = '<p class="error">Hiba történt a csapat betöltésekor</p>';
    }
}

document.addEventListener('DOMContentLoaded', getIdFromUrl);