import { databases, account, Query, storage } from "./lib/appwrite.js";

// TÖLTŐANIMÁCIÓ
const GROUND_Y = 75;
const INITIAL_Y = 25;
const GRAVITY = .5;
const FALL_DISTANCE = GROUND_Y - INITIAL_Y;
const MAX_VELOCITY = Math.sqrt(2 * GRAVITY * FALL_DISTANCE);
const ELASTICITY = 0.7;

// Deformációs paraméterek
const MAX_SQUASH = 0.6; // Maximális összenyomódás (60% magasság)
const SQUASH_DURATION = 0.05; // Másodperc

const ball = document.getElementById('labda');
const football = document.getElementById('Football');
const baseball = document.getElementById('Baseball');
const volleyball = document.getElementById('Volleyball');
const basketball = document.getElementById('Basketball');

baseball.style.display = 'none';
volleyball.style.display = 'none';
basketball.style.display = 'none';
football.style.display = 'block';

let position = INITIAL_Y;
let velocity = 0;
let isAnimating = false;
let animationId;
let isSquashing = false;
let squashStartTime = 0;
let ballChanged = false;

function startAnimation() {
    if (isAnimating) return;
    
    isAnimating = true;
    position = INITIAL_Y;
    velocity = 0;
    
    function animate(timestamp) {
        // Gravitáció
        velocity += GRAVITY;
        position += velocity;
        
        // Ütközés detektálása
        if (position >= GROUND_Y) {
            position = GROUND_Y;
            
            // Ütközéskor indítsd az összenyomódást
            if (!isSquashing) {
                isSquashing = true;
                squashStartTime = timestamp;
            }
            
            velocity = -velocity;
            position += velocity;
        }
        
        // Labda pozíció
        ball.style.transform = `translateY(${position - 100}%)`;

        // Deformáció kezelése
        if (isSquashing) {
            const elapsed = (timestamp - squashStartTime) / 1000; // másodpercben
            
            if (elapsed < SQUASH_DURATION) {
                // Összenyomódás fázis
                const progress = elapsed / SQUASH_DURATION;
                const squash = 1 - (progress * (1 - MAX_SQUASH));
                ball.style.transform = `translateY(${position - 100}%) scaleY(${squash})`;
            } else if (elapsed >= SQUASH_DURATION && elapsed < SQUASH_DURATION * 2 && ballChanged == false) {
                if (football.style.display == 'block' && ballChanged == false) {
                    football.style.display = 'none';
                    volleyball.style.display = 'block';
                    ballChanged = true;
                } else if (volleyball.style.display == 'block' && ballChanged == false) {
                    volleyball.style.display = 'none';
                    baseball.style.display = 'block';
                    ballChanged = true;
                } else if (baseball.style.display == 'block' && ballChanged == false) {
                    baseball.style.display = 'none';
                    basketball.style.display = 'block';
                    ballChanged = true;
                } else if (basketball.style.display == 'block' && ballChanged == false) {
                    basketball.style.display = 'none';
                    football.style.display = 'block';
                    ballChanged = true;
                }
            } else if (elapsed < SQUASH_DURATION * 2) {
                // Visszatérés fázis
                const progress = (elapsed - SQUASH_DURATION) / SQUASH_DURATION;
                const squash = MAX_SQUASH + (progress * (1 - MAX_SQUASH));
                ball.style.transform = `translateY(${position - 100}%) scaleY(${squash})`;
            } else {
                // Vissza normál állapotba
                isSquashing = false;
                ballChanged = false;
                ball.style.transform = `translateY(${position - 100}%) scaleY(1)`;
            }
        }
        
        // Animáció folytatása
        if (isAnimating && (Math.abs(velocity) > 0.5 || position < GROUND_Y)) {
            animationId = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
        }
    }
    
    animationId = requestAnimationFrame(animate);
}

document.addEventListener('click', startAnimation);
window.addEventListener('load', () => {
    setTimeout(startAnimation, 0);
});

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
        document.getElementById('loadingOverlay').style.display = 'none';
    } catch (error) {
        setTimeout( function () {
        console.error('Nincs bejelentkezve:', error);
        window.location.href = '/login.html';}, 500);
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

// Eseményfigyelők beállítása
function setupEventListeners() {
    // Profil gomb
    const profilGomb = document.getElementById('profile-btn');
    if (profilGomb) {
        profilGomb.addEventListener('click', (e) => {
            showProfileView();
            if (window.innerWidth <= 600) {
                closeMenu();
            }
        });
    }
    
    // Új csapat gomb
    const ujCsapatGomb = document.getElementById('new-team-btn');
    if (ujCsapatGomb) {
        ujCsapatGomb.addEventListener('click', (e) => {
            showNewTeamView();
            if (window.innerWidth <= 600) {
                closeMenu();
            }
        });
    }
    
    // Kijelentkezés gomb
    const kijelentkezesGomb = document.getElementById('logout-btn');
    if (kijelentkezesGomb) {
        kijelentkezesGomb.addEventListener('click', (e) => {
            if (window.innerWidth <= 600) {
                closeMenu();
            }
            setTimeout(() => logout(), 300);
        });
    }
    
    // Csapat gombok (delegált eseménykezelés)
    document.getElementById('site-btn-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('team-btn')) {
            const teamId = e.target.dataset.teamId;
            showTeamEditView(teamId);
            
            if (window.innerWidth <= 600) {
                closeMenu();
            }
        }
    });
}

// Menü bezárása
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
                <div id="profile-email">${currentUser.email}</div>
            </div>
            <button type="submit" class="profile-save-btn">Profil mentése</button>
        </form>

        <!-- JELSZÓ VÁLTOZTATÁS SZAKASZ -->
        <div class="fullwidth" id="accordion">
            <div id="accordion-item">
                <button type="button" id="accordion-header">
                    <span>Jelszó megváltoztatása</span>
                    <svg id="accordion-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="5 12 12 19 19 12" />
                    </svg>
                </button>

                <div id="accordion-content">
                        <form id="password-form" class="form">
                            <div class="form-group">
                                <label>Jelenlegi jelszó*</label>
                                <div class="password-input-group">
                                    <input type="password" id="current-password" placeholder="Jelenlegi jelszó" required>
                                    <button type="button" class="password-toggle-btn" data-target="current-password">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
                                            <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                                                d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
                                            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Új jelszó*</label>
                                <div class="password-input-group">
                                    <input type="password" id="new-password" placeholder="Új jelszó" required>
                                    <button type="button" class="password-toggle-btn" data-target="new-password">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
                                            <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                                                d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
                                            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Új jelszó megerősítése*</label>
                                <div class="password-input-group">
                                    <input type="password" id="confirm-password" placeholder="Új jelszó megerősítése" required>
                                    <button type="button" class="password-toggle-btn" data-target="confirm-password">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
                                            <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                                                d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
                                            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                        </svg>
                                    </button>
                                </div>
                                <div id="password-match" style="font-size: 0.8rem; margin-top: 0.25rem;"></div>
                            </div>

                            <small class="fullwidth" style="margin-bottom: 1rem">* A mező kitöltése kötelező</small>
                            
                            <button type="submit" id="password-submit-btn" class="profile-save-btn" disabled>
                                Jelszó megváltoztatása
                            </button>
                            <div id="password-message-container" style="margin-top: 1rem;"></div>
                        </form>
                </div>
            </div>
        </div>
    `;
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', saveProfile);
    setupPasswordChangeHandlers();
    disableEnterSubmission();
    initializeAccordions();
}

// Üzenet megjelenítése
function showPasswordMessage(text, type = 'success') {
    const messageContainer = document.getElementById('password-message-container');
    if (!messageContainer) return;
    
    const existingMessage = messageContainer.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    messageContainer.insertAdjacentHTML('beforeend', `<div class="message ${type}">${text}</div>`);
    
    if (type === 'success') {
        setTimeout(() => {
            const message = messageContainer.querySelector('.message');
            if (message) message.remove();
        }, 3000);
    }
}

// Jelszó változtatás eseménykezelők
function setupPasswordChangeHandlers() {
    const passwordForm = document.getElementById('password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // TOGGLE GOMBOK KEZELÉSE
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                
                if (type === 'password') {
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
                            <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                                d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                        </svg>
                        `;
                } else {
                    this.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Rejtsd a jelszót">
                            <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                                d="M1.5 12s4.5-7.5 10.5-7.5 10.5 7.5 10.5 7.5-1.8 3-5.7 4.8M3 3l18 18"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                        </svg>                        
                    `;
                }
            }
        });
    });
    
    // Jelszó egyezés ellenőrzése
    if (newPasswordInput && confirmPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordMatch);
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Form elküldése
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }
}

// Jelszó egyezés ellenőrzése
function checkPasswordMatch() {
    const newPassword = document.getElementById('new-password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';
    const matchIndicator = document.getElementById('password-match');
    
    if (!matchIndicator) return;
    
    if (!newPassword || !confirmPassword) {
        matchIndicator.textContent = '';
        matchIndicator.style.color = '';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        matchIndicator.textContent = '✗ A jelszavak nem egyeznek';
        matchIndicator.style.color = '#e74c3c';
    } else {
        matchIndicator.textContent = '';
        matchIndicator.style.color = '';
    }
    
    updatePasswordSubmitButton();
}

// Submit gomb frissítése
function updatePasswordSubmitButton() {
    const submitBtn = document.getElementById('password-submit-btn');
    const newPassword = document.getElementById('new-password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';
    
    if (!submitBtn) return;
    
    const passwordsMatch = newPassword === confirmPassword && newPassword !== '';
    submitBtn.disabled = !passwordsMatch;
}

// JELSZÓ MEGVÁLTOZTATÁSA
async function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const submitBtn = document.getElementById('password-submit-btn');
    
    if (!currentPassword || !newPassword) {
        showPasswordMessage('Kérjük, töltsd ki mindkét jelszó mezőt!', 'error');
        return;
    }
    
    if (!submitBtn) return;
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Feldolgozás...';
    submitBtn.disabled = true;
    
    try {
        await account.updatePassword(newPassword, currentPassword);
        showPasswordMessage('✅ Jelszó sikeresen megváltoztatva!', 'success');
        
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.reset();
        }
        
        const matchIndicator = document.getElementById('password-match');
        if (matchIndicator) {
            matchIndicator.textContent = '';
        }
        
    } catch (error) {
        console.error('Jelszó változtatás hiba:', error);
        const translatedMessage = await translateErrorMessage(error);
        showPasswordMessage(`❌ ${translatedMessage}`, 'error');
        
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// FORDÍTÁS
async function translateText(text, targetLang = 'hu') {
    try {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        
        if (!response.ok) {
            throw new Error('Fordítási hiba');
        }
        
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            return data[0][0][0];
        }
        
        return text;
    } catch (error) {
        console.error('Fordítási hiba:', error);
        return text;
    }
}

// HIBÁK FORDÍTÁSA
async function translateErrorMessage(error) {
    const originalMessage = error.message || error.toString();
    const builtInTranslation = translateCommonErrors(originalMessage);
    if (builtInTranslation !== originalMessage) {
        return builtInTranslation;
    }
    
    try {
        const translated = await translateText(originalMessage, 'hu');
        return translated;
    } catch {
        return originalMessage;
    }
}

// BEPÉTETT GYAKORI HIBÁK
function translateCommonErrors(message) {
    const commonErrors = {
        'Invalid credentials': 'Érvénytelen hitelesítési adatok',
        'User not found': 'Felhasználó nem található',
        'Email already exists': 'Ez az email cím már regisztrálva van',
        'Password must be at least 8 characters': 'A jelszónak legalább 8 karakter hosszúnak kell lennie',
        'Passwords do not match': 'A jelszavak nem egyeznek',
        'Invalid email': 'Érvénytelen email cím',
        'Access denied': 'Hozzáférés megtagadva',
        'Session expired': 'A munkamenet lejárt',
        'Network error': 'Hálózati hiba',
        'Service unavailable': 'A szolgáltatás nem elérhető',
        'Too many requests': 'Túl sok kérés',
        'Internal server error': 'Belső szerverhiba'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(commonErrors)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            return value;
        }
    }
    
    return message;
}

// CSAPAT SZERKESZTŐ NÉZET megjelenítése
async function showTeamEditView(teamId) {
    const team = userTeams.find(t => t.$id === teamId);
    if (!team) return;
    
    // Sportok betöltése a sportok adatbázisból
    let allSports = [];
    try {
        const sportokResponse = await databases.listDocuments(
            '68fe32ea0008ab84b709',
            'sportok',
            [Query.limit(100)]
        );
        allSports = sportokResponse.documents.map(sport => sport.sport);
    } catch (error) {
        console.error('Hiba a sportok betöltésekor:', error);
        allSports = team.cimkek || [];
    }
    
    // Sportok HTML generálása dropdown-hoz
    const sportokHTML = allSports.map(sport => `
        <div class='dropdown-item'>${sport}</div>
    `).join('');
    
    const jobbOldal = document.getElementById('jobb-oldal');
    
    // Sport dropdown-ok generálása a már kiválasztott sportokkal
    const sportDropdownsHTML = generateSportDropdowns(team.cimkek || [], sportokHTML);
    
    // Szerkesztők HTML generálása
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

    // Leírás HTML tartalom
    let leirasHTML = team.leiras || '';
    if (!leirasHTML.trim()) {
        leirasHTML = '<br>';
    }
  
    jobbOldal.innerHTML = `
    <h2 style="margin-bottom: 1rem"><p style="font-size: 0.9rem">Csapat szerkesztése:</p> ${team.nev}</h2>
    
    <!-- KÉP MEGJELENÍTÉS ÉS GOMBOK -->
    <div id="csapat-logo-container">
        <img class="csapat-logo" src="${team.kep}" alt="${team.nev} logója" 
             onerror="this.style.display='none'" 
             style="${team.kep ? '' : 'display: none'}">
        ${!team.kep ? '<p class="no-image">Nincs feltöltött logó</p>' : ''}
        <div id="logo-edit-container">
            <button id="modify-image-btn" class="save-btn">Módosítás</button>
            <button id="delete-image-btn" class="delete-btn" ${!team.kep ? 'disabled' : ''}>Törlés</button>
        </div>
        
        <!-- REJTETT FILE INPUT -->
        <input type="file" id="hidden-file-input" accept="image/*" style="display: none;">
    </div>

    <form class="form" id="form">
        <!-- ACCORDION KEZDETE -->
        <div class="fullwidth" id="accordion">
            <div id="accordion-item">
                <button type="button" id="accordion-header">
                    <span>Adatok</span>
                    <svg id="accordion-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="5 12 12 19 19 12" />
                    </svg>
                </button>
                <div id="accordion-content">
                    <div class="form" id="osszecsuko">
                        <div class="form-group">
                            <label>Csapat neve*</label>
                            <input type="text" name="nev" value="${team.nev || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Email*</label>
                            <input type="email" name="email" value="${team.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Telefon*</label>
                            <input type="text" name="telefon" value="${team.telefon || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Weboldal</label>
                            <input type="text" name="weboldal" value="${team.weboldal || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Irányítószám*</label>
                            <input type="text" name="iranyitoszam" value="${team.iranyitoszam || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Város*</label>
                            <input type="text" name="varos" value="${team.varos || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Utca*</label>
                            <input type="text" name="utca" value="${team.utca || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Házszám*</label>
                            <input type="text" name="hazszam" value="${team.hazszam || ''}" required>
                        </div>
                        
                        <div class="form-group" style="margin: 0;">
                            <label>Tagdíj</label>
                            <input type="text" name="tagdij" value="${team.tagdij || ''}">
                            <span class="currency-text">Ft</span>
                        </div>
                        
                        <div class="fullwidth">
                            <label>Sportok</label>
                            <div class="fullwidth" id="cimkek-container">
                                ${sportDropdownsHTML}
                            </div>
                        </div>
                        
                        <div class="fullwidth">
                            <label>Leírás</label>
                            <div contenteditable="true" id="leiras" class="leiras-editor">${leirasHTML}</div>
                        </div>

                        <small class="fullwidth" style="margin-top: 1rem">* A mező kitöltése kötelező</small>
                    </div>
                </div>
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
    
    // Sport dropdown-ok inicializálása
    initializeAllDropdowns(sportokHTML, team.cimkek || []);
    
    // Képkezelés inicializálása
    initializeImageHandlers(teamId);
    
    // Szerkesztők kezelésének inicializálása
    initializeSzerkesztoHandlers(team);
    
    disableEnterSubmission();
    initializeAccordions();
    initializeTeamForm();

    // Form eseménykezelők
    document.querySelector('form').addEventListener('submit', (e) => saveTeam(e, teamId, sportokHTML));
    document.getElementById('delete-team').addEventListener('click', () => deleteTeam(teamId));
}

// Sport dropdown-ok generálása
function generateSportDropdowns(selectedSports, sportokHTML) {
    if (!selectedSports || selectedSports.length === 0) {
        return `
            <div class="search-dropdown" id="dropdown3">
                <button class="search-dropdown-btn" type="button">Válassz sportot</button>
                <div class="search-dropdown-content">
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Keresés...">
                    </div>
                    <div class="dropdown-list">
                        ${sportokHTML}
                    </div>
                </div>
            </div>
        `;
    }
    
    let dropdownsHTML = '';
    
    selectedSports.forEach((sport, index) => {
        const dropdownId = index === 0 ? 'dropdown3' : `dropdown-${Date.now()}-${index}`;
        dropdownsHTML += `
            <div class="search-dropdown" id="${dropdownId}">
                <button class="search-dropdown-btn" type="button">${sport}</button>
                <div class="search-dropdown-content">
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Keresés...">
                    </div>
                    <div class="dropdown-list">
                        ${sportokHTML}
                    </div>
                </div>
            </div>
        `;
    });
    
    const emptyDropdownId = `dropdown-${Date.now()}-empty`;
    dropdownsHTML += `
        <div class="search-dropdown" id="${emptyDropdownId}">
            <button class="search-dropdown-btn" type="button">Válassz sportot</button>
            <div class="search-dropdown-content">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Keresés...">
                </div>
                <div class="dropdown-list">
                    ${sportokHTML}
                </div>
            </div>
        </div>
    `;
    
    return dropdownsHTML;
}

// ÖSSZES dropdown inicializálása már kiválasztott sportokkal
function initializeAllDropdowns(sportokHTML, preSelectedSports = []) {
    console.log("✅ initializeAllDropdowns függvény elindult");
    
    const dropdowns = document.querySelectorAll('.search-dropdown');
    console.log(`Talált dropdown-ok: ${dropdowns.length}`);
    
    dropdowns.forEach((dropdown, index) => {
        const preSelectedSport = preSelectedSports[index] || null;
        initializeSingleDropdown(dropdown, sportokHTML, preSelectedSport);
    });
}

// EGY dropdown inicializálása már kiválasztott sporttal - JAVÍTOTT
function initializeSingleDropdown(dropdown, sportokHTML, preSelectedSport = null) {
    console.log(`✅ Dropdown inicializálása: ${dropdown.id}, preSelected: ${preSelectedSport}`);
    
    const dropdownBtn = dropdown.querySelector('.search-dropdown-btn');
    const dropdownContent = dropdown.querySelector('.search-dropdown-content');
    
    if (!dropdownBtn || !dropdownContent) {
        console.error('Dropdown alElemek nem találhatók');
        return;
    }
    
    const searchInput = dropdownContent.querySelector('.search-input');
    const items = dropdownContent.querySelectorAll('.dropdown-item');
    const categories = dropdownContent.querySelectorAll('.category-header');

    if (!searchInput) {
        console.error('Search input nem található');
        return;
    }

    // TÖRLÉS GOMB LÉTREHOZÁSA
    let clearBtn = dropdownBtn.querySelector('.clear-selection-btn');
    if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'clear-selection-btn';
        clearBtn.type = 'button';
        clearBtn.innerHTML = '✕';
        clearBtn.title = 'Kiválasztás törlése';
        dropdownBtn.appendChild(clearBtn);
    }

    // NYÍL IKON
    let arrowIcon = dropdownBtn.querySelector('.dropdown-arrow');
    if (!arrowIcon) {
        arrowIcon = document.createElement('div');
        arrowIcon.className = 'dropdown-arrow';
        dropdownBtn.appendChild(arrowIcon);
    }

    // Szöveg inicializálása (X-et eltávolítjuk ha van)
    const currentBtnText = dropdownBtn.childNodes[0]?.nodeType === 3 ? dropdownBtn.childNodes[0].nodeValue : dropdownBtn.textContent;
    const cleanText = currentBtnText ? currentBtnText.trim() : 'Válassz sportot';
    
    console.log(`Dropdown szöveg: "${cleanText}"`);

    // Ha van előre kiválasztott sport, beállítjuk
    if (preSelectedSport && (cleanText === 'Válassz sportot' || cleanText === '')) {
        console.log(`Előre kiválasztott sport beállítva: ${preSelectedSport}`);
        
        // Text node frissítése
        if (dropdownBtn.childNodes[0]?.nodeType === 3) {
            dropdownBtn.childNodes[0].nodeValue = preSelectedSport;
        } else {
            // Ha nincs text node, létrehozunk
            const textNode = document.createTextNode(preSelectedSport);
            dropdownBtn.insertBefore(textNode, clearBtn);
        }
        
        dropdownBtn.classList.add('has-selection');
        
    } else {
        // Ellenőrizzük a jelenlegi állapotot
        if (cleanText !== 'Válassz sportot' && cleanText !== '') {
            dropdownBtn.classList.add('has-selection');
            console.log(`Dropdown már van kiválasztva: "${cleanText}"`);
        } else {
            dropdownBtn.classList.remove('has-selection');
            console.log(`Dropdown üres: "${cleanText}"`);
        }
    }

    // DEBUG: Ellenőrizzük az elemeket
    console.log('ClearBtn állapota:', {
        exists: !!clearBtn,
        parent: clearBtn.parentElement === dropdownBtn,
        style: clearBtn.style.cssText,
        computedStyle: window.getComputedStyle(clearBtn).display
    });

    // TÖRLÉS GOMB ESEMÉNYE - ÚJ MÓDSZER
    clearBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        console.log('Törlés gomb megnyomva');
        
        // Text node frissítése
        if (dropdownBtn.childNodes[0]?.nodeType === 3) {
            dropdownBtn.childNodes[0].nodeValue = 'Válassz sportot';
        } else {
            // Ha nincs text node, létrehozunk
            const textNode = document.createTextNode('Válassz sportot');
            dropdownBtn.insertBefore(textNode, clearBtn);
        }
        
        dropdownBtn.classList.remove('has-selection');
        dropdown.classList.remove('active');
        
        // Frissítjük a dropdown-okat
        setTimeout(() => {
            handleDynamicTags(sportokHTML);
        }, 50);
        
        return false;
    };

    // DROPDOWN GOMB - Megnyitás/zárás
    dropdownBtn.addEventListener('click', function(e) {
        // Ha a törlés gombra kattintunk, ne nyíljon ki a dropdown
        if (e.target === clearBtn || clearBtn.contains(e.target)) {
            return;
        }
        
        console.log(`Dropdown button klikkelve: ${dropdown.id}`);
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
            setTimeout(() => {
                adjustDropdownToForm(dropdown);
                searchInput.focus();
            }, 10);
        }
    });

    // KERESÉS FUNKCIÓ
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase().trim();
        const items = dropdownContent.querySelectorAll('.dropdown-item');
        let visibleItems = 0;

        // Összes item szűrése
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = filter === '' || text.includes(filter);
            
            item.style.display = isVisible ? 'flex' : 'none';
            if (isVisible) visibleItems++;
        });

        // "Nincs találat" üzenet kezelése
        const noResults = dropdownContent.querySelector('.no-results');
        
        if (filter !== '' && visibleItems === 0) {
            if (!noResults) {
                const msg = document.createElement('div');
                msg.className = 'no-results';
                msg.textContent = 'Nincs találat';
                dropdownContent.querySelector('.dropdown-list').appendChild(msg);
            }
        } else {
            if (noResults) {
                noResults.remove();
            }
        }
        
        // Opcionális: ha nincs szűrés, visszaállítjuk az összes elemet
        if (filter === '') {
            items.forEach(item => {
                item.style.display = 'flex';
            });
        }
    });

    // SPORTOK KLIKKELÉSE
    items.forEach(item => {
        item.addEventListener('click', () => {
            const selectedText = item.textContent;
            
            // Csak akkor válasszunk, ha még nincs kiválasztva
            const currentText = dropdownBtn.childNodes[0]?.nodeType === 3 ? 
                dropdownBtn.childNodes[0].nodeValue.trim() : 
                dropdownBtn.textContent.trim();
            
            if (currentText !== selectedText) {
                // Text node frissítése
                if (dropdownBtn.childNodes[0]?.nodeType === 3) {
                    dropdownBtn.childNodes[0].nodeValue = selectedText;
                } else {
                    // Ha nincs text node, létrehozunk
                    const textNode = document.createTextNode(selectedText);
                    dropdownBtn.insertBefore(textNode, clearBtn);
                }
                
                dropdownBtn.classList.add('has-selection');
                dropdown.classList.remove('active');
                
                console.log(`Sport kiválasztva: ${selectedText} (${dropdown.id})`);
                
                // Új dropdown hozzáadása kiválasztás után
                setTimeout(() => {
                    handleDynamicTags(sportokHTML);
                }, 0);
            }
        });
    });

    // KÜLSŐ KLIKK - Dropdown bezárása
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-dropdown')) {
            dropdown.classList.remove('active');
        }
    });

    console.log(`✅ ${dropdown.id} dropdown sikeresen inicializálva`);
}

function adjustDropdownToForm(dropdown) {
    const content = dropdown.querySelector('.search-dropdown-content');
    const searchContainer = dropdown.querySelector('.search-container')
    const dropdownList = dropdown.querySelector('.dropdown-list')
    const form = dropdown.closest('.form, #form, form');
    
    if (!content || !form) return;
    
    // 1. Számold ki a maximális elérhető magasságot
    const dropdownRect = dropdown.getBoundingClientRect();
    const formRect = form.getBoundingClientRect();
    
    // 2. Mennyi hely van alul?
    const spaceBelow = formRect.bottom - dropdownRect.bottom;
    
    // 3. Mennyi hely van felül? (ha nem fér el alul)
    const spaceAbove = dropdownRect.top - formRect.top;
    
    // 4. Válaszd ki a nagyobbat, de ne lépd túl a form határait
    let maxHeight;
    if (spaceBelow > 100) { // Minimum 100px alul
        maxHeight = Math.min(spaceBelow - 10, 400); // 10px margó, max 400px
        content.style.top = '100%';
        content.style.bottom = 'auto';
    } else {
        maxHeight = Math.min(spaceAbove - 10, 400);
        content.style.top = 'auto';
        content.style.bottom = '100%';
    }
    
    // 5. Alkalmazd a számolt magasságot
    content.style.maxHeight = maxHeight + 'px';
    dropdownList.style.maxHeight = maxHeight - searchContainer.offsetHeight + 'px';
    
    // 6. Korlátozd a szélességet is
    content.style.maxWidth = (formRect.width - dropdownRect.left + formRect.left) + 'px';
    content.style.left = '0';
    content.style.right = 'auto';
}

// Szerkesztők kezelése
function initializeSzerkesztoHandlers(team) {
    const szerkesztoContainer = document.getElementById('szerkeszto-container-edit');
    const addSzerkesztoBtn = document.getElementById('add-szerkeszto-btn');
    
    if (!szerkesztoContainer || !addSzerkesztoBtn) return;
    
    addSzerkesztoBtn.addEventListener('click', () => {
        const newSzerkesztoInput = document.createElement('div');
        newSzerkesztoInput.className = 'szerkeszto-item';
        newSzerkesztoInput.innerHTML = `
            <input type="email" name="szerkeszto[]" placeholder="Új szerkesztő email" required>
            <button type="button" class="remove-szerkeszto-btn">✕</button>
        `;
        szerkesztoContainer.appendChild(newSzerkesztoInput);
        
        newSzerkesztoInput.querySelector('.remove-szerkeszto-btn').addEventListener('click', function() {
            if (szerkesztoContainer.children.length > 1) {
                szerkesztoContainer.removeChild(newSzerkesztoInput);
            }
        });
    });
    
    const removeButtons = szerkesztoContainer.querySelectorAll('.remove-szerkeszto-btn');
    removeButtons.forEach(button => {
        const item = button.closest('.szerkeszto-item');
        const input = item.querySelector('input');
        if (input.value !== currentUser.email) {
            button.disabled = false;
            button.addEventListener('click', function() {
                if (szerkesztoContainer.children.length > 1) {
                    szerkesztoContainer.removeChild(item);
                }
            });
        } else {
            button.disabled = true;
            button.title = "A létrehozót nem lehet eltávolítani";
        }
    });
}

// Képkezelő eseményfigyelők
function initializeImageHandlers(teamId) {
    const modifyBtn = document.getElementById('modify-image-btn');
    const deleteBtn = document.getElementById('delete-image-btn');
    const fileInput = document.getElementById('hidden-file-input');
    
    if (!modifyBtn || !deleteBtn || !fileInput) return;
    
    modifyBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
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
    
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Biztosan törölni szeretnéd a képet?')) {
            await deleteTeamImage(teamId);
        }
    });
}

// Új kép feltöltése
async function uploadNewTeamImage(file, teamId) {
    try {
        const team = userTeams.find(t => t.$id === teamId);
        
        if (team.kep) {
            await deleteOldImageFromStorage(team.kep);
        }
        
        const fileResponse = await storage.createFile(
            '68fe4c27001b6bb17091',
            'unique()',
            file
        );
        
        const kepUrl = `https://cloud.appwrite.io/v1/storage/buckets/68fe4c27001b6bb17091/files/${fileResponse.$id}/view?project=68fe2fae00030619f0a5`;
        
        await databases.updateDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId,
            { kep: kepUrl }
        );
        
        const teamIndex = userTeams.findIndex(t => t.$id === teamId);
        if (teamIndex !== -1) {
            userTeams[teamIndex].kep = kepUrl;
        }
        
        updateTeamImageUI(kepUrl);
        alert('Kép sikeresen frissítve!');
        
    } catch (error) {
        console.error('Hiba a kép feltöltésekor:', error);
        alert('Hiba történt a kép feltöltésekor');
    }
}

// Kép törlése
async function deleteTeamImage(teamId) {
    try {
        const team = userTeams.find(t => t.$id === teamId);
        
        if (team.kep) {
            await deleteOldImageFromStorage(team.kep);
        }
        
        await databases.updateDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId,
            { kep: "" }
        );
        
        const teamIndex = userTeams.findIndex(t => t.$id === teamId);
        if (teamIndex !== -1) {
            userTeams[teamIndex].kep = "";
        }
        
        updateTeamImageUI("");
        alert('Kép sikeresen törölve!');
        
    } catch (error) {
        console.error('Hiba a kép törlésekor:', error);
        alert('Hiba történt a kép törlésekor');
    }
}

// Régi kép törlése Appwrite-ból
async function deleteOldImageFromStorage(oldImageUrl) {
    if (!oldImageUrl) return;
    
    try {
        const fileId = oldImageUrl.split('/files/')[1]?.split('/view')[0];
        if (fileId) {
            await storage.deleteFile('68fe4c27001b6bb17091', fileId);
        }
    } catch (error) {
        console.error('Hiba a régi kép törlésekor:', error);
    }
}

// UI frissítése kép csere/törlés után
function updateTeamImageUI(imageUrl) {
    const logoImg = document.querySelector('.csapat-logo');
    const noImageText = document.querySelector('.no-image');
    const deleteBtn = document.getElementById('delete-image-btn');
    
    if (imageUrl) {
        if (logoImg) {
            logoImg.src = imageUrl;
            logoImg.style.display = 'block';
        }
        if (noImageText) noImageText.style.display = 'none';
        if (deleteBtn) deleteBtn.disabled = false;
    } else {
        if (logoImg) logoImg.style.display = 'none';
        if (noImageText) {
            noImageText.style.display = 'block';
        } else {
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
    
    const fileInput = document.getElementById('hidden-file-input');
    if (fileInput) fileInput.value = '';
}

// Csapat mentése
async function saveTeam(e, teamId, sportokHTML) {
    e.preventDefault();
    
    const form = e.target;
    
    const selectedSports = Array.from(document.querySelectorAll('.search-dropdown-btn'))
        .map(btn => btn.textContent)
        .filter(text => text !== 'Válassz sportot' && text.trim() !== '');
    
    const uniqueSports = [...new Set(selectedSports)];
    
    const szerkesztok = [];
    const szerkesztoInputs = document.querySelectorAll('input[name="szerkeszto[]"]');
    szerkesztoInputs.forEach(input => {
        if (input.value.trim() !== "") {
            szerkesztok.push(input.value.trim());
        }
    });
    
    if (!szerkesztok.includes(currentUser.email)) {
        szerkesztok.push(currentUser.email);
    }
    
    const leirasDiv = document.getElementById('leiras');
    const leirasHTML = leirasDiv.innerHTML;
    
    const updatedData = {
        nev: form.querySelector('input[name="nev"]').value,
        email: form.querySelector('input[name="email"]').value,
        telefon: form.querySelector('input[name="telefon"]').value,
        weboldal: form.querySelector('input[name="weboldal"]').value,
        iranyitoszam: form.querySelector('input[name="iranyitoszam"]').value,
        varos: form.querySelector('input[name="varos"]').value,
        utca: form.querySelector('input[name="utca"]').value,
        hazszam: form.querySelector('input[name="hazszam"]').value,
        tagdij: form.querySelector('input[name="tagdij"]').value,
        cimkek: uniqueSports,
        leiras: leirasHTML,
        szerkeszto: szerkesztok
    };
    
    try {
        await databases.updateDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId,
            updatedData
        );
        
        const teamIndex = userTeams.findIndex(t => t.$id === teamId);
        if (teamIndex !== -1) {
            userTeams[teamIndex] = { ...userTeams[teamIndex], ...updatedData };
        }
        
        alert('Csapat adatai sikeresen frissítve!');
        showTeamEditView(teamId);
        
    } catch (error) {
        console.error('Hiba a csapat mentésekor:', error);
        alert('Hiba történt a csapat mentésekor');
    }
}

// Handle dynamic tags
function handleDynamicTags(sportokHTML) {
    const cimkekContainer = document.getElementById("cimkek-container");
    if (!cimkekContainer) return;
    
    const dropdowns = cimkekContainer.querySelectorAll('.search-dropdown');

    if (dropdowns.length >= 2) {
        for (let i = dropdowns.length - 1; i >= 1; i--) {
            const current = dropdowns[i];
            const previous = dropdowns[i - 1];
            
            const currentBtn = current.querySelector('.search-dropdown-btn');
            const previousBtn = previous.querySelector('.search-dropdown-btn');
            
            if (currentBtn && previousBtn) {
                const currentText = currentBtn.textContent;
                const previousText = previousBtn.textContent;
                
                const currentIsEmpty = currentText.includes("Válassz sportot") || currentText.trim() === "";
                const previousIsEmpty = previousText.includes("Válassz sportot") || previousText.trim() === "";
                
                if (currentIsEmpty && previousIsEmpty && current.id !== 'dropdown3') {
                    current.remove();
                    console.log(`Dropdown törölve (${current.id}) - két üres egymás után`);
                    break;
                }
            }
        }
    }
    
    const updatedDropdowns = cimkekContainer.querySelectorAll('.search-dropdown');
    
    if (updatedDropdowns.length > 0) {
        const lastDropdown = updatedDropdowns[updatedDropdowns.length - 1];
        const lastButton = lastDropdown.querySelector('.search-dropdown-btn');
        
        if (lastButton) {
            const lastText = lastButton.textContent;
            const lastIsEmpty = lastText.includes("Válassz sportot") || lastText.trim() === "";
            
            if (!lastIsEmpty) {
                addNewDropdown(sportokHTML);
                console.log("új dropdown hozzáadva");
            }
        }
    }
}

// Add new dropdown
function addNewDropdown(sportokHTML) {
    const cimkekContainer = document.getElementById("cimkek-container");
    const newDropdownId = `dropdown-${Date.now()}`;
    
    const newDropdownHTML = `
        <div class="search-dropdown" id="${newDropdownId}">
            <button class="search-dropdown-btn" type="button">Válassz sportot</button>
            <div class="search-dropdown-content">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Keresés...">
                </div>
                <div class="dropdown-list">
                    <div class="category-header">Sportok</div>
                    ${sportokHTML}
                </div>
            </div>
        </div>
    `;
    
    cimkekContainer.insertAdjacentHTML('beforeend', newDropdownHTML);
    
    const newDropdown = document.getElementById(newDropdownId);
    if (newDropdown) {
        initializeSingleDropdown(newDropdown, sportokHTML);
    }
}

function showNewTeamView() {
    const jobbOldal = document.getElementById('jobb-oldal');
    
    const exportAllDocuments = async () => {
        let allDocuments = [];
        let offset = 0;
        const limit = 100;
        
        try {
            console.log('Összes dokumentum betöltése...');
            
            while (true) {
                const response = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'sportok',
                    [
                        Query.limit(limit),
                        Query.offset(offset)
                    ]
                );
                
                allDocuments = [...allDocuments, ...response.documents];
                console.log(`Eddig betöltve: ${allDocuments.length} dokumentum`);
                
                if (response.documents.length < limit) {
                    break;
                }
                
                offset += limit;
            }
            
            console.log(`✅ Összesen ${allDocuments.length} dokumentum betöltve!`);
            
            const sportokHTML = allDocuments.map(sport => `
                <div class='dropdown-item'>${sport.sport}</div>
            `).join('');
            
            return { allDocuments, sportokHTML };
            
        } catch (error) {
            console.error('Hiba:', error);
            throw error;
        }
    };

    exportAllDocuments().then(({ allDocuments, sportokHTML }) => {
        
        jobbOldal.innerHTML = `
            <div id="form-wrapper">
                <h2>Új csapat hozzáadása</h2>
                <div id="message-container"></div>
                <form class="form" id="form" enctype="multipart/form-data">
                    <input type="text" name="nev" placeholder="Név*" required>
                    <input type="email" name="email" placeholder="Email*" required>
                    <input type="text" name="telefon" id="telefon" pattern="^\\S+$" placeholder="Telefon*" maxlength="12" required>
                    <input type="text" name="weboldal" placeholder="Weboldal">
                    <input type="text" name="iranyitoszam" placeholder="Irányítószám*" minlength="4" maxlength="4" required>
                    <input type="text" name="varos" placeholder="Város*" required>
                    <input type="text" name="utca" placeholder="Utca*" required>
                    <input type="text" name="hazszam" placeholder="Házszam*" required>

                    <div class="fullwidth" id="cimkek-container">
                        <div class="search-dropdown" id="dropdown3">
                            <button class="search-dropdown-btn" type="button">Válassz sportot</button>
                            <div class="search-dropdown-content">
                                <div class="search-container">
                                    <input type="text" class="search-input" placeholder="Keresés...">
                                </div>
                                <div class="dropdown-list">
                                    ${sportokHTML}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="text">Logó feltöltése:</div>

                    <div class="fullwidth" id="kep-feltoltes">
                        <input type="file" name="kep" accept="image/*" id="kepInput">
                        <img id="kepPreview" src="" alt="" style="display:none;">
                    </div>

                    <small>* A mező kitöltése kötelező</small>
                    <button type="submit" id="submit-btn">Hozzáadás</button>
                </form>
            </div>
        `;

        initializeAllDropdowns(sportokHTML);
        initializeTeamForm();

    }).catch(error => {
        console.error('Hiba a sportok betöltésekor:', error);
        jobbOldal.innerHTML = `<div class="error">Hiba történt az adatok betöltése során: ${error.message}</div>`;
    });
}

// FORM INICIALIZÁLÁS
async function initializeTeamForm() {
    const form = document.querySelector("form");
    const kepInput = document.getElementById("kepInput");
    const kepPreview = document.getElementById("kepPreview");
    const messageContainer = document.getElementById("message-container");

    if (!form) {
        console.log("Form nem található, várok...");
        setTimeout(initializeTeamForm, 100);
        return;
    }

    console.log("✅ Team form inicializálása...");

    const hasPermission = await checkUserPermission();
    if (!hasPermission) {
        console.log("Nincs jogosultság");
        return;
    }

    const telefonInput = document.getElementById("telefon");
    if (telefonInput) {
        telefonInput.addEventListener("keydown", e => {
            if (e.key === " ") e.preventDefault();
        });
        
        telefonInput.addEventListener("input", function(e) {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    const iranyitoszamInput = document.querySelector('input[name="iranyitoszam"]');
    if (iranyitoszamInput) {
        iranyitoszamInput.addEventListener("input", function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    if (kepInput && kepPreview) {
        kepInput.addEventListener("change", function(e) {
            handleImagePreview(e, kepPreview);
        });
    }

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        handleFormSubmit(e, form, messageContainer);
    });

    console.log("✅ Team form inicializálva");
}

// Kép előnézet funkció
function handleImagePreview(event, kepPreview) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            kepPreview.src = e.target.result;
            kepPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Form elküldése
async function handleFormSubmit(event, form, messageContainer) {
    event.preventDefault();
    
    const submitBtn = form.querySelector('#submit-btn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Feldolgozás...';
        submitBtn.disabled = true;

        const selectedSports = Array.from(document.querySelectorAll('.search-dropdown-btn'))
            .map(btn => btn.textContent)
            .filter(text => text !== 'Válassz sportot' && text.trim() !== '');
        
        const uniqueSports = [...new Set(selectedSports)];
        
        console.log('Összes sport:', selectedSports);
        console.log('Egyedi sportok:', uniqueSports);
        
        if (uniqueSports.length === 0) {
            showMessage(messageContainer, 'Legalább egy sportot válassz ki!', 'error');
            return;
        }
        
        if (selectedSports.length !== uniqueSports.length) {
            const removedDuplicates = selectedSports.length - uniqueSports.length;
            showMessage(messageContainer, `Figyelem: ${removedDuplicates} ismétlődő sport eltávolítva`, 'warning');
        }

        let kepFileId = null;
        const kepInput = document.getElementById('kepInput');
        if (kepInput && kepInput.files[0]) {
            try {
                const file = kepInput.files[0];
                const response = await storage.createFile(
                    '68fe4c27001b6bb17091',
                    'unique()',
                    file
                );
                kepFileId = response.$id;
                console.log('Kép feltöltve, file ID:', kepFileId);
            } catch (fileError) {
                console.error('Hiba a kép feltöltésekor:', fileError);
                showMessage(messageContainer, 'Hiba a kép feltöltése során', 'error');
                return;
            }
        }

        const formData = {
            nev: form.querySelector('input[name="nev"]').value,
            email: form.querySelector('input[name="email"]').value,
            telefon: form.querySelector('input[name="telefon"]').value,
            weboldal: form.querySelector('input[name="weboldal"]').value || '',
            iranyitoszam: form.querySelector('input[name="iranyitoszam"]').value,
            varos: form.querySelector('input[name="varos"]').value,
            utca: form.querySelector('input[name="utca"]').value,
            hazszam: form.querySelector('input[name="hazszam"]').value,
            cimkek: uniqueSports,
            userEmail: currentUser.email,
            szerkeszto: [currentUser.email]
        };

        if (kepFileId) {
            formData.kep = `https://cloud.appwrite.io/v1/storage/buckets/68fe4c27001b6bb17091/files/${kepFileId}/view?project=68fe2fae00030619f0a5`;
        }

        console.log('Küldött adatok:', formData);

        const response = await databases.createDocument(
            '68fe32ea0008ab84b709',
            'csapatok', 
            'unique()',
            formData
        );

        showMessage(messageContainer, 'Sikeresen létrehozva!', 'success');
        form.reset();
        
        const kepPreview = document.getElementById('kepPreview');
        if (kepPreview) {
            kepPreview.style.display = 'none';
            kepPreview.src = '';
        }
        
        const cimkekContainer = document.getElementById('cimkek-container');
        if (cimkekContainer) {
            cimkekContainer.innerHTML = `
                <div class="search-dropdown" id="dropdown3">
                    <button class="search-dropdown-btn" type="button">Válassz sportot</button>
                    <div class="search-dropdown-content">
                        <div class="search-container">
                            <input type="text" class="search-input" placeholder="Keresés...">
                        </div>
                        <div class="dropdown-list">
                            <div class="category-header">Sportok</div>
                        </div>
                    </div>
                </div>
            `;
            initializeAllDropdowns('');
        }

    } catch (error) {
        console.error('Hiba:', error);
        showMessage(messageContainer, `Hiba: ${error.message}`, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Üzenet megjelenítése
function showMessage(container, message, type) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="message ${type}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

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
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Csak JPG, PNG, GIF és WebP formátumok engedélyezettek');
    }
    
    if (file.size > maxSize) {
        throw new Error('A kép mérete nem haladhatja meg az 5MB-ot');
    }
    
    return true;
}

// Accordion kezelő függvény
function initializeAccordions() {
    const accordionItem = document.getElementById('accordion-item');
    const accordionHeader = document.getElementById('accordion-header');
    const accordionContent = document.getElementById('accordion-content');
    const accordionIcon = document.getElementById('accordion-icon');
    let rotation = 0;
    
    if (!accordionItem || !accordionHeader || !accordionContent || !accordionIcon) {
        console.log('Nem találhatók az accordion elemek');
        return;
    }
    
    accordionHeader.addEventListener('click', () => {
        const isActive = accordionItem.classList.contains('active');
        
        if (isActive) {
            accordionItem.classList.remove('active');
            accordionHeader.classList.remove('active');
            accordionContent.style.maxHeight = '0';
            rotation += 180;
            accordionIcon.style.transform = `rotate(${rotation}deg)`;
        } else {
            accordionItem.classList.add('active');
            accordionHeader.classList.add('active');
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            rotation += 180;
            accordionIcon.style.transform = `rotate(${rotation}deg)`;
        }
    });
    
    window.addEventListener('resize', () => {
        if (accordionItem.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        };
        if (dropdown.classList.contains('active')) {
            adjustDropdownToForm(dropdown);
        }
    });
}

// CSAK FORM SUBMIT TILTÁS ENTERREL
function disableEnterSubmission() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            
            if (activeElement.tagName === 'INPUT' && 
                activeElement.type !== 'submit' && 
                activeElement.type !== 'button') {
                
                const form = activeElement.closest('form');
                if (form) {
                    e.preventDefault();
                }
            }
        }
    });
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
        const team = userTeams.find(t => t.$id === teamId);
        if (team && team.kep) {
            await deleteOldImageFromStorage(team.kep);
        }
        
        await databases.deleteDocument(
            '68fe32ea0008ab84b709',
            'csapatok',
            teamId
        );
        
        userTeams = userTeams.filter(t => t.$id !== teamId);
        renderTeamButtons();
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