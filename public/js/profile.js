import { databases, account, Query, storage } from "../lib/appwrite.js";

// Hamburger menü változók
const hamburger = document.getElementById("hamburger");
const bal = document.getElementById("bal-oldal");
const jobb = document.getElementById("jobb-oldal");
const hamburgerIcon = document.getElementById("hamburger-icon");
const xIcon = document.getElementById("x-icon");

// Overlay elem létrehozása
const overlay = document.createElement('div');
overlay.className = 'menu-overlay';
document.body.appendChild(overlay);

let csukva = false;
let currentUser = null;
let userTeams = [];

// ALAPÁLLAPOT - Teljesen új logika
function alapAllapotBeallitasa() {
    const isMobile = window.innerWidth <= 600;
    
    if (isMobile) {
        // MOBIL: alapból csukva
        bal.style.display = 'none';
        hamburgerIcon.style.display = 'block';
        xIcon.style.display = 'none';
        overlay.style.display = 'none';
        jobb.style.gridColumn = '1 / -1';
        csukva = true;
    } else {
        // DESKTOP: alapból nyitva
        bal.style.display = 'hidden';
        hamburgerIcon.style.display = 'none';
        xIcon.style.display = 'block';
        overlay.style.display = 'none';
        jobb.style.gridColumn = '2';
        csukva = false;
    }
}

// HAMBURGER GOMB - Egyszerű és gyors
hamburger.addEventListener("click", () => {
    const isMobile = window.innerWidth <= 600;
    
    if (csukva) {
        // MEGNYITÁS
        if (isMobile) {
            bal.style.display = 'grid';
            overlay.style.display = 'block';
            setTimeout(() => {overlay.classList.add('lathato'); bal.style.left = '0%';}, 10);
        } else {
            bal.style.display = 'grid';
            jobb.style.gridColumn = '2';
        }
        
        hamburgerIcon.style.display = 'none';
        xIcon.style.display = 'block';
        csukva = false;
        
    } else {
        // BEZÁRÁS
        if (isMobile) {
            bal.style.left = '-100%';
            overlay.classList.remove('lathato');
            setTimeout(() => {
                bal.style.display = 'none';
                overlay.style.display = 'none';
            }, 10);
        } else {
            bal.style.display = 'none';
            jobb.style.gridColumn = '1 / -1';
        }
        
        hamburgerIcon.style.display = 'block';
        xIcon.style.display = 'none';
        csukva = true;
    }
});

// OVERLAY - Csak mobil
overlay.addEventListener('click', () => {
    if (window.innerWidth <= 600 && !csukva) {
        hamburger.click();
    }
});

// ESCAPE - Csak mobil
document.addEventListener('keydown', (e) => {
    if (window.innerWidth <= 600 && e.key === 'Escape' && !csukva) {
        hamburger.click();
    }
});

// RESIZE - Debounced és egyszerű
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const isMobile = window.innerWidth <= 600;
        const wasMobile = !(window.innerWidth > 600); // Ellenőrizzük az előző állapotot
        
        if (isMobile && !wasMobile) {
            // Desktop → Mobil váltás
            if (!csukva) hamburger.click(); // Bezárjuk ha nyitva volt
            alapAllapotBeallitasa();
        } else if (!isMobile && wasMobile) {
            // Mobil → Desktop váltás  
            if (csukva) hamburger.click(); // Kinyitjuk ha csukva volt
            alapAllapotBeallitasa();
        }
    }, 100);
});

// PROFIL FUNKCIÓK
// Oldal betöltése
document.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await account.get();
        alapAllapotBeallitasa(); // Hamburger menü inicializálása
        await initializeProfile();
    } catch (error) {
        console.error('Nincs bejelentkezve:', error);
        window.location.href = '/login.html';
    }
});

async function initializeProfile() {
    await loadUserTeams();
    setupEventListeners();
    showProfileView(); // Alapértelmezetten a profil nézet
}

// Felhasználó csapatainak betöltése
async function loadUserTeams() {
    try {
        // Csapatok betöltése, ahol a user szerkeszthet (email alapján)
        const response = await databases.listDocuments(
            '68fe32ea0008ab84b709',
            'csapatok',
            [Query.contains('szerkeszto', currentUser.email)]
        );
        
        userTeams = response.documents;
        renderTeamButtons();
    } catch (error) {
        console.error('Hiba a csapatok betöltésekor:', error);
    }
}

// Csapat gombok renderelése a bal oldali menübe
function renderTeamButtons() {
    const siteBtnContainer = document.getElementById('site-btn-container');
    
    if (userTeams.length === 0) {
        siteBtnContainer.innerHTML = '<p>Nincsenek csapataid</p>';
        return;
    }
    
    const teamButtons = userTeams.map(team => `
        <button class="team-btn" data-team-id="${team.$id}">
            ${team.nev}
        </button>
    `).join('');
    
    siteBtnContainer.innerHTML = teamButtons;
}

// Eseményfigyelők beállítása - TELJESEN JAVÍTOTT
function setupEventListeners() {
    // Profil gomb
    const profilGomb = document.getElementById('profile-btn');
    if (profilGomb) {
        profilGomb.addEventListener('click', (e) => {
            showProfileView();
            // Mobil esetén automatikusan bezárjuk a menüt
            if (window.innerWidth <= 600) {
                closeMenu(); // Új függvény a menü bezárására
            }
        });
    }
    
    // Új csapat gomb
    const ujCsapatGomb = document.getElementById('new-team-btn');
    if (ujCsapatGomb) {
        ujCsapatGomb.addEventListener('click', (e) => {
            showNewTeamView();
            // Mobil esetén automatikusan bezárjuk a menüt
            if (window.innerWidth <= 600) {
                closeMenu();
            }
        });
    }
    
    // Kijelentkezés gomb
    const kijelentkezesGomb = document.getElementById('logout-btn');
    if (kijelentkezesGomb) {
        kijelentkezesGomb.addEventListener('click', (e) => {
            // Mobil esetén először bezárjuk a menüt
            if (window.innerWidth <= 600) {
                closeMenu();
            }
            // Utána indítjuk a kijelentkezést
            setTimeout(() => logout(), 300);
        });
    }
    
    // Csapat gombok (delegált eseménykezelés)
    document.getElementById('site-btn-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('team-btn')) {
            const teamId = e.target.dataset.teamId;
            showTeamEditView(teamId);
            
            // Mobil esetén automatikusan bezárjuk a menüt
            if (window.innerWidth <= 600) {
                closeMenu();
            }
        }
    });
}

// ÚJ FÜGGVÉNY: Menü bezárása
// MENÜ BEZÁRÁSA - JAVÍTOTT
function closeMenu() {
    const isMobile = window.innerWidth <= 600;
    
    if (!csukva) {
        if (isMobile) {
            bal.style.left = '-100%';
            overlay.classList.remove('lathato');
            setTimeout(() => {
                bal.style.display = 'none';
                overlay.style.display = 'none';
            }, 300);
        } else {
            bal.style.display = 'none';
            jobb.style.gridColumn = '1 / -1';
        }
        
        hamburgerIcon.style.display = 'block';
        xIcon.style.display = 'none';
        csukva = true;
    }
}

// PROFIL NÉZET megjelenítése
function showProfileView() {
    const jobbOldal = document.getElementById('jobb-oldal');
    
    jobbOldal.innerHTML = `
        <h2>Szia, ${currentUser.name}!</h2>
        <form id="profile-form">
            <div class="form-group">
                <label>Név:</label>
                <input type="text" id="profile-name" value="${currentUser.name}" required>
            </div>
            <div class="form-group">
                <label>Email:</label>
                <div id="profile-email"">${currentUser.email}</div>
            </div>
            <button type="submit" class="profile-save-btn">Mentés</button>
        </form>
    `;
    
    // Profil form eseménykezelő
    document.getElementById('profile-form').addEventListener('submit', saveProfile);
}

// CSAPAT SZERKESZTŐ NÉZET megjelenítése - JAVÍTOTT (dinamikus címkékkel)
async function showTeamEditView(teamId) {
    const team = userTeams.find(t => t.$id === teamId);
    if (!team) return;
    
    const jobbOldal = document.getElementById('jobb-oldal');
    
    // Dinamikus címkék HTML generálása
    const cimkekHTML = team.cimkek && team.cimkek.length > 0 
        ? team.cimkek.map(cimke => `
            <input type="text" name="cimkek[]" value="${cimke}" placeholder="Sport">
        `).join('')
        : '<input type="text" name="cimkek[]" placeholder="Sport">';
    
    // Szerkesztők HTML generálása - EZ HIÁNYZOTT
    const szerkesztoHTML = team.szerkeszto && team.szerkeszto.length > 0 
        ? team.szerkeszto.map(email => `
            <div class="szerkeszto-item">
                <input type="email" name="szerkeszto[]" value="${email}" placeholder="Szerkesztő email" readonly>
                <button type="button" class="remove-szerkeszto-btn" ${team.szerkeszto.length <= 1 ? 'disabled' : ''}>✕</button>
            </div>
        `).join('')
        : `<div class="szerkeszto-item">
            <input type="email" name="szerkeszto[]" value="${currentUser.email}" placeholder="Szerkesztő email" readonly>
        </div>`;
  
    jobbOldal.innerHTML = `
        <h2 style="margin-bottom: 1rem"><p style="font-size: 0.9rem">Csapat szerkesztése:</p> ${team.nev}</h2>
        
        <!-- KÉP MEGJELENÍTÉS ÉS GOMBOK -->
        <div id="csapat-logo-container">
            <img class="csapat-logo" src="${team.kep}" alt="${team.nev} logója" 
                 onerror="this.style.display='none'" 
                 style="${team.kep ? '' : 'display: none'}">
            ${!team.kep ? '<p class="no-image">Nincs feltöltött kép</p>' : ''}
            <div id="logo-edit-container">
                <button id="modify-image-btn" class="save-btn">Módosítás</button>
                <button id="delete-image-btn" class="delete-btn" ${!team.kep ? 'disabled' : ''}>Törlés</button>
            </div>
            
            <!-- REJTETT FILE INPUT -->
            <input type="file" id="hidden-file-input" accept="image/*" style="display: none;">
        </div>

        <form class="form">
            <div class="form-group">
                <label>Csapat neve:</label>
                <input type="text" name="nev" value="${team.nev || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Email:</label>
                <input type="email" name="email" value="${team.email || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Telefon:</label>
                <input type="text" name="telefon" value="${team.telefon || ''}">
            </div>
            
            <div class="form-group">
                <label>Weboldal:</label>
                <input type="text" name="weboldal" value="${team.weboldal || ''}">
            </div>
            
            <div class="form-group">
                <label>Irányítószám:</label>
                <input type="text" name="iranyitoszam" value="${team.iranyitoszam || ''}">
            </div>
            
            <div class="form-group">
                <label>Város:</label>
                <input type="text" name="varos" value="${team.varos || ''}">
            </div>
            
            <div class="form-group">
                <label>Utca:</label>
                <input type="text" name="utca" value="${team.utca || ''}">
            </div>
            
            <div class="form-group">
                <label>Házszám:</label>
                <input type="text" name="hazszam" value="${team.hazszam || ''}">
            </div>
            
            <div class="fullwidth">
                <label>Sportok:</label>
                <div class="fullwidth" id="cimkek-container-edit">
                    ${cimkekHTML}
                </div>
            </div>
            
            <div class="fullwidth" id="szerkeszto-section">
                <label>Szerkesztők:</label>
                <div class="fullwidth" id="szerkeszto-container-edit">
                    ${szerkesztoHTML}
                </div>
                <button type="button" id="add-szerkeszto-btn" class="secondary-btn">+ Új szerkesztő hozzáadása</button>
            </div>

            <div class="button-group">
                <button type="submit" class="save-btn">Adatok mentése</button>
                <button type="button" id="delete-team" class="delete-btn">Csapat törlése</button>
            </div>
        </form>
    `;
    
    // Képkezelés inicializálása
    initializeImageHandlers(teamId);
    
    // Dinamikus címkék inicializálása
    initializeDynamicTagsForEdit();
    
    // Szerkesztők kezelésének inicializálása
    initializeSzerkesztoHandlers();
    
    // Form eseménykezelők
    document.querySelector('form').addEventListener('submit', (e) => saveTeam(e, teamId));
    document.getElementById('delete-team').addEventListener('click', () => deleteTeam(teamId));
}

// ÚJ FUNKCIÓ: Szerkesztők kezelése
function initializeSzerkesztoHandlers() {
    const szerkesztoContainer = document.getElementById('szerkeszto-container-edit');
    const addSzerkesztoBtn = document.getElementById('add-szerkeszto-btn');
    
    if (addSzerkesztoBtn) {
        addSzerkesztoBtn.addEventListener('click', () => {
            const newSzerkesztoInput = document.createElement('div');
            newSzerkesztoInput.className = 'szerkeszto-item';
            newSzerkesztoInput.innerHTML = `
                <input type="email" name="szerkeszto[]" placeholder="Új szerkesztő email" required>
                <button type="button" class="remove-szerkeszto-btn">✕</button>
            `;
            szerkesztoContainer.appendChild(newSzerkesztoInput);
            
            // Új törlés gomb eseményfigyelője
            newSzerkesztoInput.querySelector('.remove-szerkeszto-btn').addEventListener('click', function() {
                if (szerkesztoContainer.children.length > 1) {
                    szerkesztoContainer.removeChild(newSzerkesztoInput);
                }
            });
        });
    }
    
    // Meglévő törlés gombok eseményfigyelői
    const removeButtons = szerkesztoContainer.querySelectorAll('.remove-szerkeszto-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (szerkesztoContainer.children.length > 1) {
                const item = this.closest('.szerkeszto-item');
                szerkesztoContainer.removeChild(item);
            }
        });
    });
}

// MÓDOSÍTOTT CSAPAT MENTÉSE - most már a szerkesztőket is kezeli
async function saveTeam(e, teamId) {
    e.preventDefault();
    
    const form = e.target;
    const cimkekContainer = document.getElementById("cimkek-container-edit");
    const szerkesztoContainer = document.getElementById("szerkeszto-container-edit");
    
    // Címkék összegyűjtése
    const cimkek = [];
    if (cimkekContainer) {
        const cimkeInputs = cimkekContainer.querySelectorAll('input[name="cimkek[]"]');
        cimkeInputs.forEach(input => {
            if (input.value.trim() !== "") {
                cimkek.push(input.value.trim());
            }
        });
    }
    
    // Szerkesztők összegyűjtése
    const szerkesztok = [];
    if (szerkesztoContainer) {
        const szerkesztoInputs = szerkesztoContainer.querySelectorAll('input[name="szerkeszto[]"]');
        szerkesztoInputs.forEach(input => {
            if (input.value.trim() !== "") {
                szerkesztok.push(input.value.trim());
            }
        });
    }
    
    // Ellenőrizzük, hogy a jelenlegi user benne van-e a szerkesztők között
    if (!szerkesztok.includes(currentUser.email)) {
        szerkesztok.push(currentUser.email);
    }
    
    const formData = new FormData(form);
    
    const updatedData = {
        nev: formData.get('nev'),
        email: formData.get('email'),
        telefon: formData.get('telefon'),
        weboldal: formData.get('weboldal'),
        iranyitoszam: formData.get('iranyitoszam'),
        varos: formData.get('varos'),
        utca: formData.get('utca'),
        hazszam: formData.get('hazszam'),
        cimkek: cimkek,
        szerkeszto: szerkesztok  // Szerkesztők hozzáadása
    };
    
    try {
        await databases.updateDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId,
            updatedData
        );
        
        // Lokális adatok frissítése
        const teamIndex = userTeams.findIndex(t => t.$id === teamId);
        if (teamIndex !== -1) {
            userTeams[teamIndex] = { ...userTeams[teamIndex], ...updatedData };
        }
        
        alert('Csapat adatai sikeresen frissítve!');
        
    } catch (error) {
        console.error('Hiba a csapat mentésekor:', error);
        alert('Hiba történt a csapat mentésekor');
    }
}

// KÉPKEZELŐ ESEMÉNYFIGYELŐK
function initializeImageHandlers(teamId) {
    const modifyBtn = document.getElementById('modify-image-btn');
    const deleteBtn = document.getElementById('delete-image-btn');
    const fileInput = document.getElementById('hidden-file-input');
    const logoContainer = document.getElementById('csapat-logo-container');
    
    // MÓDOSÍTÁS gomb - file input megnyitása
    if (modifyBtn) {
        modifyBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // FILE INPUT változás - új kép feltöltése
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    validateImage(file);
                    await uploadNewTeamImage(file, teamId);
                } catch (error) {
                    alert(`Hiba: ${error.message}`);
                }
            }
        });
    }
    
    // TÖRLÉS gomb - kép eltávolítása
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Biztosan törölni szeretnéd a képet?')) {
                await deleteTeamImage(teamId);
            }
        });
    }
}

// ÚJ KÉP FELTÖLTÉSE
async function uploadNewTeamImage(file, teamId) {
    try {
        const team = userTeams.find(t => t.$id === teamId);
        
        // Régi kép törlése (ha volt)
        if (team.kep) {
            await deleteOldImageFromStorage(team.kep);
        }
        
        // Új kép feltöltése
        const fileResponse = await storage.createFile(
            '68fe4c27001b6bb17091',
            'unique()',
            file
        );
        
        const kepUrl = `https://cloud.appwrite.io/v1/storage/buckets/68fe4c27001b6bb17091/files/${fileResponse.$id}/view?project=68fe2fae00030619f0a5`;
        
        // Csapat frissítése új képpel
        await databases.updateDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId,
            { kep: kepUrl }
        );
        
        // Lokális adatok frissítése
        const teamIndex = userTeams.findIndex(t => t.$id === teamId);
        if (teamIndex !== -1) {
            userTeams[teamIndex].kep = kepUrl;
        }
        
        // UI frissítése
        updateTeamImageUI(kepUrl);
        
        alert('Kép sikeresen frissítve!');
        
    } catch (error) {
        console.error('Hiba a kép feltöltésekor:', error);
        alert('Hiba történt a kép feltöltésekor');
    }
}

// KÉP TÖRLÉSE
async function deleteTeamImage(teamId) {
    try {
        const team = userTeams.find(t => t.$id === teamId);
        
        // Kép törlése Appwrite storage-ból
        if (team.kep) {
            await deleteOldImageFromStorage(team.kep);
        }
        
        // Csapat frissítése (kép mező ürítése)
        await databases.updateDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId,
            { kep: "" }
        );
        
        // Lokális adatok frissítése
        const teamIndex = userTeams.findIndex(t => t.$id === teamId);
        if (teamIndex !== -1) {
            userTeams[teamIndex].kep = "";
        }
        
        // UI frissítése
        updateTeamImageUI("");
        
        alert('Kép sikeresen törölve!');
        
    } catch (error) {
        console.error('Hiba a kép törlésekor:', error);
        alert('Hiba történt a kép törlésekor');
    }
}

// RÉGI KÉP TÖRLÉSE APPWRITE-BÓL
async function deleteOldImageFromStorage(oldImageUrl) {
    if (!oldImageUrl) return;
    
    try {
        const fileId = oldImageUrl.split('/files/')[1]?.split('/view')[0];
        if (fileId) {
            await storage.deleteFile('68fe4c27001b6bb17091', fileId);
            console.log('Régi kép törölve:', fileId);
        }
    } catch (error) {
        console.error('Hiba a régi kép törlésekor:', error);
    }
}

// UI FRISSÍTÉSE KÉP CSERE/TÖRLÉS UTÁN
function updateTeamImageUI(imageUrl) {
    const logoImg = document.querySelector('.csapat-logo');
    const noImageText = document.querySelector('.no-image');
    const deleteBtn = document.getElementById('delete-image-btn');
    
    if (imageUrl) {
        // Új kép megjelenítése
        if (logoImg) {
            logoImg.src = imageUrl;
            logoImg.style.display = 'block';
        }
        if (noImageText) noImageText.style.display = 'none';
        if (deleteBtn) deleteBtn.disabled = false;
    } else {
        // Kép eltávolítása
        if (logoImg) logoImg.style.display = 'none';
        if (noImageText) {
            noImageText.style.display = 'block';
        } else {
            // Ha nincs "nincs kép" szöveg, létrehozzuk
            const logoContainer = document.getElementById('csapat-logo-container');
            if (logoContainer && !logoContainer.querySelector('.no-image')) {
                const noImageP = document.createElement('p');
                noImageP.className = 'no-image';
                noImageP.textContent = 'Nincs feltöltött kép';
                logoContainer.insertBefore(noImageP, document.getElementById('logo-edit-container'));
            }
        }
        if (deleteBtn) deleteBtn.disabled = true;
    }
    
    // File input reset
    const fileInput = document.getElementById('hidden-file-input');
    if (fileInput) fileInput.value = '';
}



// DINAMIKUS CÍMKÉK INICIALIZÁLÁSA SZERKESZTÉSHEZ
function initializeDynamicTagsForEdit() {
    const cimkekContainer = document.getElementById("cimkek-container-edit");
    
    if (cimkekContainer) {
        cimkekContainer.addEventListener("input", handleDynamicTagsEdit);
    }
}

// DINAMIKUS CÍMKÉK KEZELÉSE SZERKESZTÉSHEZ
function handleDynamicTagsEdit() {
    const cimkekContainer = document.getElementById("cimkek-container-edit");
    const inputs = cimkekContainer.querySelectorAll('input[name="cimkek[]"]');
    const last = inputs[inputs.length - 1];
    const secondLast = inputs[inputs.length - 2];
    
    // Új mező hozzáadása, ha az utolsó mező nem üres
    if (last.value.trim() !== "") {
        const newInput = document.createElement("input");
        newInput.type = "text";
        newInput.name = "cimkek[]";
        newInput.placeholder = "Sport";
        cimkekContainer.appendChild(newInput);
    }

    // Üres mezők eltávolítása (de legalább 1 maradjon)
    if (inputs.length > 1 && last.value.trim() === "" && secondLast?.value.trim() === "") {
        cimkekContainer.removeChild(last);
    }
}



// ÚJ CSAPAT NÉZET megjelenítése
function showNewTeamView() {
    const jobbOldal = document.getElementById('jobb-oldal');
    
    jobbOldal.innerHTML = `
        <div id="form-wrapper">
            <h2>Új csapat hozzáadása</h2>
            <div id="message-container"></div>
            <form class="form" enctype="multipart/form-data">
                <input type="text" name="nev" placeholder="Név" required>
                <input type="email" name="email" placeholder="Email" required>
                <input type="text" name="telefon" id="telefon" pattern="^\\S+$" placeholder="Telefon" maxlength="12" required>
                <input type="text" name="weboldal" placeholder="Weboldal">
                <input type="text" name="iranyitoszam" placeholder="Irányítószám" minlength="4" maxlength="4" required>
                <input type="text" name="varos" placeholder="Város" required>
                <input type="text" name="utca" placeholder="Utca" required>
                <input type="text" name="hazszam" placeholder="Házszám" required>

                <!-- Dinamikus címkék -->
                <div class="fullwidth" id="cimkek-container">
                    <input type="text" name="cimkek[]" placeholder="Sport">
                </div>

                <div class="text">Kép feltöltése:</div>

                <!-- Kép feltöltés -->
                <div class="fullwidth" id="kep-feltoltes">
                    <input type="file" name="kep" accept="image/*" id="kepInput">
                    <img id="kepPreview" src="" alt="" style="display:none;">
                </div>


                <button type="submit" id="submit-btn">Hozzáadás</button>
            </form>
        </div>
    `;
    
    // Inicializáljuk a form funkcionalitást
    initializeTeamForm();
}

// FORM INICIALIZÁLÁS
async function initializeTeamForm() {
    setTimeout(async () => {
        const form = document.querySelector("form");
        const kepInput = document.getElementById("kepInput");
        const kepPreview = document.getElementById("kepPreview");
        const cimkekContainer = document.getElementById("cimkek-container");
        const submitBtn = document.getElementById("submit-btn");
        const messageContainer = document.getElementById("message-container");

        if (!form) return;

        // Tiltás ellenőrzése
        const hasPermission = await checkUserPermission();
        if (!hasPermission) return;

        // Telefon szóköz letiltása
        const telefonInput = document.getElementById("telefon");
        if (telefonInput) {
            telefonInput.addEventListener("keydown", e => {
                if (e.key === " ") e.preventDefault();
            });
        }

        // Irányítószám csak szám
        const iranyitoszamInput = document.querySelector('input[name="iranyitoszam"]');
        if (iranyitoszamInput) {
            iranyitoszamInput.addEventListener("input", function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }

        // Kép előnézet
        if (kepInput && kepPreview) {
            kepInput.addEventListener("change", handleImagePreview);
        }

        // Dinamikus címkék
        if (cimkekContainer) {
            cimkekContainer.addEventListener("input", handleDynamicTags);
        }

        // Form elküldése
        form.addEventListener("submit", handleFormSubmit);
    }, 100);
}

// FORM HELPER FUNKCIÓK
async function checkUserPermission() {
    const DATABASE_ID = "68fe32ea0008ab84b709";
    const TILTOTT_FELHASZNALOK_ID = "tiltott_felhasznalok";

    try {
        const tiltottFelhasznalok = await databases.listDocuments(
            DATABASE_ID,
            TILTOTT_FELHASZNALOK_ID,
            [Query.equal("userEmail", currentUser.email)]
        );

        if (tiltottFelhasznalok.documents.length > 0) {
            const messageContainer = document.getElementById("message-container");
            const submitBtn = document.getElementById('submit-btn');
            
            if (messageContainer) {
                messageContainer.innerHTML = `<div class="message error">❌ Ez a felhasználó nem regisztrálhat csapatot.</div>`;
            }
            
            if (submitBtn) submitBtn.disabled = true;
            return false;
        }
        
        return true;
    } catch (error) {
        return error.code === 404;
    }
}

function validateImage(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Csak JPG, PNG, GIF és WebP formátumok engedélyezettek');
    }
    
    if (file.size > maxSize) {
        throw new Error('A kép mérete nem haladhatja meg az 5MB-ot');
    }
    
    return true;
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    const kepPreview = document.getElementById("kepPreview");
    
    if (file) {
        try {
            validateImage(file);
            const reader = new FileReader();
            reader.onload = () => {
                kepPreview.src = reader.result;
                kepPreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } catch (error) {
            uzenetMegjelenitese(`❌ ${error.message}`, 'error');
            e.target.value = '';
            kepPreview.style.display = 'none';
        }
    }
}

function handleDynamicTags() {
    const cimkekContainer = document.getElementById("cimkek-container");
    const inputs = cimkekContainer.querySelectorAll('input[name="cimkek[]"]');
    const last = inputs[inputs.length - 1];
    const secondLast = inputs[inputs.length - 2];
    
    if (last.value.trim() !== "") {
        const newInput = document.createElement("input");
        newInput.type = "text";
        newInput.name = "cimkek[]";
        newInput.placeholder = "Sport";
        cimkekContainer.appendChild(newInput);
    }

    if (inputs.length > 1 && last.value.trim() === "" && secondLast?.value.trim() === "") {
        cimkekContainer.removeChild(last);
    }
}

function validateFormData(formData) {
    const errors = [];
    
    // Név validáció
    const nev = formData.get("nev").trim();
    if (nev.length < 2) {
        errors.push("A név legalább 2 karakter hosszú kell legyen");
    }
    
    // Email validáció
    const email = formData.get("email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push("Érvényes email címet adjon meg");
    }
    
    // Irányítószám validáció
    const iranyitoszam = formData.get("iranyitoszam");
    if (!/^\d{4}$/.test(iranyitoszam)) {
        errors.push("Az irányítószám 4 számjegyű kell legyen");
    }
    
    // Címkék validáció
    const cimkek = formData.getAll("cimkek[]").map(v => v.trim()).filter(v => v);
    if (cimkek.length === 0) {
        errors.push("Legalább egy sport címke megadása kötelező");
    }
    
    return errors;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById("submit-btn");
    const form = e.target;
    const messageContainer = document.getElementById("message-container");
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Küldés...";
    }

    try {
        const formData = new FormData(form);
        
        // Form validáció
        const validationErrors = validateFormData(formData);
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => uzenetMegjelenitese(`❌ ${error}`, 'error'));
            return;
        }

        const csapatNeve = formData.get("nev");
        const csapatEmail = formData.get("email");
        
        // Duplikáció ellenőrzés
        const [letezoCsapatok, letezoEmail] = await Promise.all([
            databases.listDocuments('68fe32ea0008ab84b709', 'csapatok', [Query.equal("nev", csapatNeve)]),
            databases.listDocuments('68fe32ea0008ab84b709', 'csapatok', [Query.equal("email", csapatEmail)])
        ]);

        if (letezoCsapatok.documents.length > 0) {
            uzenetMegjelenitese(`❌ Már létezik "${csapatNeve}" nevű csapat!`, 'error');
            return;
        }

        if (letezoEmail.documents.length > 0) {
            uzenetMegjelenitese(`❌ Már létezik ${csapatEmail} emaillel csapat!`, 'error');
            return;
        }

        const kepFile = formData.get("kep");
        let kepUrl = "";

        // Kép feltöltés
        if (kepFile && kepFile.size > 0) {
            try {
                validateImage(kepFile);
                const fileResponse = await storage.createFile(
                    '68fe4c27001b6bb17091',
                    'unique()',
                    kepFile
                );
                
                kepUrl = `https://cloud.appwrite.io/v1/storage/buckets/68fe4c27001b6bb17091/files/${fileResponse.$id}/view?project=68fe2fae00030619f0a5`;
            } catch (fileError) {
                uzenetMegjelenitese(`❌ ${fileError.message}`, 'error');
                return;
            }
        }

        // Csapat létrehozása
        const dokumentumAdatok = {
            userEmail: currentUser.email,
            nev: formData.get("nev"),
            email: formData.get("email"),
            telefon: formData.get("telefon") || "",
            weboldal: formData.get("weboldal") || "",
            iranyitoszam: formData.get("iranyitoszam") || "",        
            varos: formData.get("varos") || "",
            utca: formData.get("utca") || "",
            hazszam: formData.get("hazszam") || "",
            cimkek: formData.getAll("cimkek[]").map(v => v.trim()).filter(v => v),
            kep: kepUrl,
            szerkeszto: [currentUser.email],
        };

        await databases.createDocument('68fe32ea0008ab84b709', 'csapatok', 'unique()', dokumentumAdatok);
        
        uzenetMegjelenitese(`✅ Sikeresen hozzáadva: ${dokumentumAdatok.nev}`, 'success');
        
        // Frissítjük a csapat listát
        await loadUserTeams();
        
        // Form reset
        form.reset();
        const kepPreview = document.getElementById("kepPreview");
        if (kepPreview) kepPreview.style.display = "none";
        const cimkekContainer = document.getElementById("cimkek-container");
        if (cimkekContainer) cimkekContainer.innerHTML = `<input type="text" name="cimkek[]" placeholder="Sport">`;
        
    } catch (error) {
        console.error("❌ Hiba:", error);
        uzenetMegjelenitese(`❌ Hiba: ${error.message}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Hozzáadás";
        }
    }
}

function uzenetMegjelenitese(szoveg, tipus = 'success') {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
        messageContainer.innerHTML = `<div class="message ${tipus}">${szoveg}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 2000);
    }
}

// PROFIL MENTÉSE
async function saveProfile(e) {
    e.preventDefault();
    
    const name = document.getElementById('profile-name').value;
    
    try {
        await account.updateName(name);
        currentUser.name = name;
        alert('Profil sikeresen frissítve!');
    } catch (error) {
        console.error('Hiba a profil mentésekor:', error);
        alert('Hiba történt a profil mentésekor');
    }
}

// CSAPAT TÖRLÉSE
async function deleteTeam(teamId) {
    if (!confirm('Biztosan törölni szeretnéd ezt a csapatot? Ez a művelet nem visszavonható!')) {
        return;
    }
    
    try {
        // 1. ELŐSZÖR: Kép törlése (ha van)
        const team = userTeams.find(t => t.$id === teamId);
        if (team && team.kep) {
            await deleteOldImageFromStorage(team.kep);
        }
        
        // 2. UTÁNA: Csapat törlése az adatbázisból
        await databases.deleteDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId
        );
        
        // 3. Lokális adatok frissítése
        userTeams = userTeams.filter(t => t.$id !== teamId);
        renderTeamButtons();
        
        // 4. Vissza a profil nézetre
        showProfileView();
        
        alert('Csapat sikeresen törölve!');
        
    } catch (error) {
        console.error('Hiba a csapat törlésekor:', error);
        alert('Hiba történt a csapat törlésekor');
    }
}

// KIjelentkezés
async function logout() {
    try {
        await account.deleteSession('current');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Hiba a kijelentkezéskor:', error);
    }
}