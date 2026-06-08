// ==================== TÖLTŐANIMÁCIÓ ====================

const GROUND_Y = 75;
const INITIAL_Y = 25;
const GRAVITY = 0.5;
const FALL_DISTANCE = GROUND_Y - INITIAL_Y;
const MAX_VELOCITY = Math.sqrt(2 * GRAVITY * FALL_DISTANCE);
const ELASTICITY = 0.7;

const MAX_SQUASH = 0.6;
const SQUASH_DURATION = 0.05;

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

function cycleBall() {
    if (football.style.display === 'block') {
        football.style.display = 'none';
        volleyball.style.display = 'block';
    } else if (volleyball.style.display === 'block') {
        volleyball.style.display = 'none';
        baseball.style.display = 'block';
    } else if (baseball.style.display === 'block') {
        baseball.style.display = 'none';
        basketball.style.display = 'block';
    } else if (basketball.style.display === 'block') {
        basketball.style.display = 'none';
        football.style.display = 'block';
    }
    ballChanged = true;
}

function applySquash(timestamp) {
    const elapsed = (timestamp - squashStartTime) / 1000;

    if (elapsed < SQUASH_DURATION) {
        const progress = elapsed / SQUASH_DURATION;
        const squash = 1 - progress * (1 - MAX_SQUASH);
        ball.style.transform = `translateY(${position - 100}%) scaleY(${squash})`;
    } else if (elapsed >= SQUASH_DURATION && elapsed < SQUASH_DURATION * 2 && !ballChanged) {
        cycleBall();
    } else if (elapsed < SQUASH_DURATION * 2) {
        const progress = (elapsed - SQUASH_DURATION) / SQUASH_DURATION;
        const squash = MAX_SQUASH + progress * (1 - MAX_SQUASH);
        ball.style.transform = `translateY(${position - 100}%) scaleY(${squash})`;
    } else {
        isSquashing = false;
        ballChanged = false;
        ball.style.transform = `translateY(${position - 100}%) scaleY(1)`;
    }
}

function startAnimation() {
    if (isAnimating) return;

    isAnimating = true;
    position = INITIAL_Y;
    velocity = 0;

    function animate(timestamp) {
        velocity += GRAVITY;
        position += velocity;

        if (position >= GROUND_Y) {
            position = GROUND_Y;

            if (!isSquashing) {
                isSquashing = true;
                squashStartTime = timestamp;
            }

            velocity = -velocity;
            position += velocity;
        }

        ball.style.transform = `translateY(${position - 100}%)`;

        if (isSquashing) {
            applySquash(timestamp);
        }

        if (isAnimating && (Math.abs(velocity) > 0.5 || position < GROUND_Y)) {
            animationId = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
        }
    }

    animationId = requestAnimationFrame(animate);
}

document.addEventListener('click', startAnimation);
window.addEventListener('load', () => setTimeout(startAnimation, 0));

// ==================== HAMBURGER MENÜ ====================

import { account, Query } from "./lib/appwrite.js";

const menuContainer = document.querySelector('.menu-container');
const hamburger = document.getElementById("hamburger");
const bal = document.getElementById("bal-oldal");
const jobb = document.getElementById("jobb-oldal");
const hamburgerIcon = document.getElementById("hamburger-icon");
const xIcon = document.getElementById("x-icon");

const overlay = document.createElement('div');
overlay.className = 'menu-overlay';
document.body.appendChild(overlay);

let csukva = false;

function isMobile() {
    return window.innerWidth <= 600;
}

export function alapAllapotBeallitasa() {
    if (isMobile()) {
        bal.style.display = 'none';
        hamburgerIcon.style.display = 'block';
        xIcon.style.display = 'none';
        overlay.style.display = 'none';
        jobb.style.gridColumn = '1 / -1';
        csukva = true;
    } else {
        bal.style.display = 'hidden';
        hamburgerIcon.style.display = 'none';
        menuContainer.style.display = 'none';
        xIcon.style.display = 'none';
        overlay.style.display = 'none';
        jobb.style.gridColumn = '2';
        csukva = false;
    }
}

export function closeMenu() {
    if (csukva) return;

    if (isMobile()) {
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

function openMenu() {
    if (isMobile()) {
        bal.style.display = 'grid';
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('lathato');
            bal.style.left = '0%';
        }, 10);
        hamburgerIcon.style.display = 'none';
        xIcon.style.display = 'block';
    } else {
        bal.style.display = 'grid';
        jobb.style.gridColumn = '2';
    }
    csukva = false;
}

hamburger.addEventListener("click", () => {
    if (csukva) {
        openMenu();
    } else {
        closeMenu();
    }
});

overlay.addEventListener('click', () => {
    if (isMobile() && !csukva) hamburger.click();
});

document.addEventListener('keydown', (e) => {
    if (isMobile() && e.key === 'Escape' && !csukva) hamburger.click();
});

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const mobile = isMobile();
        const wasMobile = !(window.innerWidth > 600);

        if (mobile && !wasMobile) {
            if (!csukva) hamburger.click();
            alapAllapotBeallitasa();
        } else if (!mobile && wasMobile) {
            if (csukva) hamburger.click();
            alapAllapotBeallitasa();
        }
    }, 100);
});

// ==================== DASHBOARD ====================

import { databases } from "./lib/appwrite.js";

const teamCharts = {};

// ---------- Segédfüggvények ----------

function formatChartDate(dateString) {
    return new Date(dateString).toLocaleDateString('hu-HU', {
        month: 'short',
        day: 'numeric'
    });
}

// ---------- Statisztikák ----------

async function getTeamStats(teamId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const pageviews = await databases.listDocuments(DB_ID, 'pageviews', [
            Query.equal('teamId', teamId),
            Query.greaterThanEqual('date', startDateStr),
            Query.orderAsc('date'),
            Query.limit(5000)
        ]);

        const dailyStats = {};
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dailyStats[date.toISOString().split('T')[0]] = 0;
        }

        pageviews.documents.forEach(doc => {
            if (dailyStats[doc.date] !== undefined) dailyStats[doc.date]++;
        });

        const dailyData = Object.keys(dailyStats).map(date => ({
            date,
            count: dailyStats[date],
            formattedDate: formatChartDate(date)
        }));

        return { dailyData };
    } catch (error) {
        console.error(`Hiba a ${teamId} statisztikáinál:`, error);
        return { dailyData: [] };
    }
}

export async function loadUserTeamsWithStats(currentUser, userTeams) {
    try {
        if (!currentUser?.email) {
            console.error('Nincs bejelentkezett felhasználó!');
            return [];
        }

        const response = await databases.listDocuments(DB_ID, 'csapatok', [
            Query.contains('szerkeszto', currentUser.email)
        ]);

        userTeams.length = 0;
        userTeams.push(...response.documents);

        return await Promise.all(
            userTeams.map(async (csapat) => ({
                ...csapat,
                stats: await getTeamStats(csapat.$id, 30)
            }))
        );
    } catch (error) {
        console.error('Hiba a csapatok betöltésekor:', error);
        return [];
    }
}

// ---------- Grafikon ----------

function renderTeamChart(teamId, dailyData) {
    const canvasId = `chart-${teamId.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (teamCharts[teamId]) teamCharts[teamId].destroy();

    teamCharts[teamId] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: dailyData.map(d => d.formattedDate),
            datasets: [{
                label: '',
                data: dailyData.map(d => d.count),
                borderColor: 'rgb(229, 184, 153)',
                backgroundColor: 'rgba(229, 183, 153, 0.34)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: (items) => dailyData[items[0].dataIndex].date,
                        label: (ctx) => `${ctx.parsed.y} megtekintés`
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: { maxRotation: 0, maxTicksLimit: 10, font: { size: 10 }, color: '#666' }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    ticks: { precision: 0, font: { size: 10 }, color: '#666' },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                }
            }
        }
    });
}

// ---------- Megjelenítés ----------

function renderDashboard(teamsData) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    if (teamsData.length === 0) {
        container.innerHTML = '<p class="no-teams-message">Nincsenek csapataid.</p>';
        return;
    }

    container.innerHTML = teamsData.map(team => {
        const canvasId = `chart-${team.$id.replace(/[^a-zA-Z0-9]/g, '-')}`;
        return `
            <div class="team-chart-container">
                <h3 class="team-chart-title">${team.nev}</h3>
                <div class="chart-wrapper">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
    }).join('');

    

    teamsData.forEach(team => {
        if (team.stats?.dailyData) {
            setTimeout(() => renderTeamChart(team.$id, team.stats.dailyData), 100);
        }
    });
}

// ---------- Inicializálás ----------

export async function initDashboard(currentUser, userTeams) {
    if (typeof databases === 'undefined') {
        console.error('Appwrite databases nincs definiálva!');
        return;
    }
    if (typeof Chart === 'undefined') {
        console.error('Chart.js nincs betöltve!');
        return;
    }

    try {
        const teamsData = await loadUserTeamsWithStats(currentUser, userTeams);
        renderDashboard(teamsData);
    } catch (error) {
        console.error('Hiba:', error);
        const container = document.getElementById('dashboard-container');
        if (container) container.innerHTML = '<p class="error-message">Hiba történt az adatok betöltésekor.</p>';
    }
}

window.initDashboard = initDashboard;


// ==================== KÖZÖS SEGÉDFÜGGVÉNYEK ====================

// ---------- Hibák fordítása ----------

const COMMON_ERRORS = {
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

export function translateCommonErrors(message) {
    const lower = message.toLowerCase();
    for (const [key, value] of Object.entries(COMMON_ERRORS)) {
        if (lower.includes(key.toLowerCase())) return value;
    }
    return message;
}

async function translateText(text, targetLang = 'hu') {
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error('Fordítási hiba');
        const data = await res.json();
        return data?.[0]?.[0]?.[0] ?? text;
    } catch {
        return text;
    }
}

export async function translateErrorMessage(error) {
    const original = error.message || error.toString();
    const builtin = translateCommonErrors(original);
    if (builtin !== original) return builtin;
    return translateText(original, 'hu');
}

// ---------- Validáció ----------

export function validateImage(file) {
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

// ---------- Üzenetek ----------

export function showMessage(container, message, type) {
    if (!container) return;
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 5000);
}

export function showPasswordMessage(text, type = 'success') {
    const container = document.getElementById('password-message-container');
    if (!container) return;

    container.querySelector('.message')?.remove();
    container.insertAdjacentHTML('beforeend', `<div class="message ${type}">${text}</div>`);

    if (type === 'success') {
        setTimeout(() => container.querySelector('.message')?.remove(), 3000);
    }
}

// ---------- Enter tiltása form-on belül ----------

export function disableEnterSubmission() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const el = document.activeElement;
        if (el.tagName === 'INPUT' && el.type !== 'submit' && el.type !== 'button') {
            if (el.closest('form')) e.preventDefault();
        }
    });
}

// ---------- Accordion ----------

export function initializeAccordions() {
    const accordionItem = document.getElementById('accordion-item');
    const accordionHeader = document.getElementById('accordion-header');
    const accordionContent = document.getElementById('accordion-content');
    const accordionIcon = document.getElementById('accordion-icon');
    let rotation = 0;

    if (!accordionItem || !accordionHeader || !accordionContent || !accordionIcon) return null;

    function updateAccordionHeight() {
        if (accordionItem.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        }
    }

    accordionHeader.addEventListener('click', () => {
        const isActive = accordionItem.classList.contains('active');
        rotation += 180;
        accordionIcon.style.transform = `rotate(${rotation}deg)`;

        if (isActive) {
            accordionItem.classList.remove('active');
            accordionHeader.classList.remove('active');
            accordionContent.style.maxHeight = '0';
        } else {
            accordionItem.classList.add('active');
            accordionHeader.classList.add('active');
            accordionContent.style.maxHeight = 'none';
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        }
    });

    window.addEventListener('resize', updateAccordionHeight);

    return { updateHeight: updateAccordionHeight };
}

// ---------- Jelszó toggle SVG ----------

const EYE_OPEN_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
        <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
            d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
    </svg>`;

const EYE_CLOSED_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Rejtsd a jelszót">
        <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
            d="M1.5 12s4.5-7.5 10.5-7.5 10.5 7.5 10.5 7.5-1.8 3-5.7 4.8M3 3l18 18"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
    </svg>`;

export function setupPasswordToggleButtons() {
    document.querySelectorAll('.password-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = document.getElementById(this.getAttribute('data-target'));
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            this.innerHTML = isPassword ? EYE_CLOSED_SVG : EYE_OPEN_SVG;
        });
    });
}

// ---------- Dropdown pozicionálás ----------

export function adjustDropdownToForm(dropdown) {
    const content = dropdown.querySelector('.search-dropdown-content');
    const searchContainer = dropdown.querySelector('.search-container');
    const dropdownList = dropdown.querySelector('.dropdown-list');
    const accordion = document.querySelector('#accordion');
    const form = dropdown.closest('.form, #form, form');

    if (!content || !form) return;

    if (!accordion) {
        content.style.maxHeight = '200px';
        dropdownList.style.maxHeight = 200 - searchContainer.offsetHeight + 'px';
        return;
    }

    const dropdownRect = dropdown.getBoundingClientRect();
    const formRect = form.getBoundingClientRect();
    const spaceBelow = formRect.bottom - dropdownRect.bottom;
    const spaceAbove = dropdownRect.top - formRect.top;

    let maxHeight, position;
    if (spaceBelow > 100) {
        maxHeight = Math.min(spaceBelow - 10, 400);
        position = 'below';
    } else if (spaceAbove > 100) {
        maxHeight = Math.min(spaceAbove - 10, 400);
        position = 'above';
    } else {
        maxHeight = Math.min(Math.max(spaceBelow, spaceAbove) - 10, 400);
        position = spaceBelow >= spaceAbove ? 'below' : 'above';
    }

    content.style.top = position === 'below' ? '100%' : 'auto';
    content.style.bottom = position === 'above' ? '100%' : 'auto';
    content.style.maxHeight = maxHeight + 'px';

    if (searchContainer && dropdownList) {
        const styles = window.getComputedStyle(content);
        const available = maxHeight
            - parseInt(styles.paddingTop || 0)
            - parseInt(styles.paddingBottom || 0)
            - searchContainer.offsetHeight;

        dropdownList.style.maxHeight = Math.max(available, 0) + 'px';

        const listHeight = Array.from(dropdownList.children).reduce((t, c) => t + c.offsetHeight, 0);
        dropdownList.style.overflowY = listHeight <= available ? 'hidden' : 'auto';
    }

    content.style.maxWidth = (formRect.width - dropdownRect.left + formRect.left) + 'px';
    content.style.left = '0';
    content.style.right = 'auto';
}

// ==================== PROFIL FŐMODUL ====================

import { storage } from "./lib/appwrite.js";


const DB_ID = '68fe32ea0008ab84b709';
const STORAGE_BUCKET_ID = '68fe4c27001b6bb17091';
const PROJECT_ID = '68fe2fae00030619f0a5';

let currentUser = null;
let userTeams = [];

// ==================== INICIALIZÁLÁS ====================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        currentUser = await account.get();
        alapAllapotBeallitasa();
        await initializeProfile();
        document.getElementById('loadingOverlay').style.display = 'none';
    } catch (error) {
        setTimeout(() => {
            console.error('Nincs bejelentkezve:', error);
            window.location.href = '/login.html';
        }, 500);
    }
});

async function initializeProfile() {
    await loadUserTeams();
    setupEventListeners();
    showMyTeamsView();
}

// ==================== CSAPATOK BETÖLTÉSE ====================

async function loadUserTeams() {
    try {
        const response = await databases.listDocuments(DB_ID, 'csapatok', [
            Query.contains('szerkeszto', currentUser.email)
        ]);
        userTeams = response.documents;
        renderTeamButtons();
    } catch (error) {
        console.error('Hiba a csapatok betöltésekor:', error);
    }
}

function renderTeamButtons() {
    const container = document.getElementById('site-btn-container');
    if (userTeams.length === 0) {
        container.innerHTML = '<p>Nincsenek csapataid</p>';
        return;
    }
    container.innerHTML += userTeams.map(team => `
        <button class="team-btn" data-team-id="${team.$id}">${team.nev}</button>
    `).join('');
}

// ==================== ESEMÉNYFIGYELŐK ====================

function setupEventListeners() {
    document.getElementById('my-teams-btn')?.addEventListener('click', () => {
        showMyTeamsView();
        if (window.innerWidth <= 600) closeMenu();
    });

    document.getElementById('new-team-btn')?.addEventListener('click', () => {
        showNewTeamView();
        if (window.innerWidth <= 600) closeMenu();
    });

    document.getElementById('profile-btn')?.addEventListener('click', () => {
        showProfileView();
        if (window.innerWidth <= 600) closeMenu();
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (window.innerWidth <= 600) closeMenu();
        setTimeout(logout, 300);
    });

    document.getElementById('site-btn-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('team-btn')) {
            showTeamEditView(e.target.dataset.teamId);
            if (window.innerWidth <= 600) closeMenu();
        }
    });
}

// ==================== CSAPATAIM NÉZET ====================

function showMyTeamsView() {
    document.getElementById('jobb-oldal').innerHTML = `
        <h2>Szia, ${currentUser.name}!</h2>
        <div class="container">
            <div id="dashboard-container">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Dashboard betöltése...</p>
                </div>
            </div>
        </div>
    `;

    initDashboard(currentUser, userTeams);

    document.getElementById('dashboard-container').addEventListener('click', (e) => {
    const card = e.target.closest('.team-chart-container');
    if (card) {
        const teamId = card.querySelector('canvas').id.replace('chart-', '');
        showTeamEditView(teamId);
    }
    });
}

function buildPasswordField(id, label, placeholder, withMatchIndicator = false) {
    const eyeSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img" aria-label="Mutasd a jelszót">
            <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z"/>
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
        </svg>`;

    return `
        <div class="form-group">
            <label>${label}</label>
            <div class="password-input-group">
                <input type="password" id="${id}" placeholder="${placeholder}" required>
                <button type="button" class="password-toggle-btn" data-target="${id}">${eyeSVG}</button>
            </div>
            ${withMatchIndicator ? '<div id="password-match" style="font-size: 0.8rem; margin-top: 0.25rem;"></div>' : ''}
        </div>`;
}

// ==================== JELSZÓ KEZELŐK ====================

function setupPasswordChangeHandlers() {
    setupPasswordToggleButtons();

    const newPass = document.getElementById('new-password');
    const confirmPass = document.getElementById('confirm-password');
    if (newPass && confirmPass) {
        newPass.addEventListener('input', checkPasswordMatch);
        confirmPass.addEventListener('input', checkPasswordMatch);
    }

    document.getElementById('password-form')?.addEventListener('submit', changePassword);
}

function checkPasswordMatch() {
    const newPassword = document.getElementById('new-password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';
    const indicator = document.getElementById('password-match');
    if (!indicator) return;

    if (!newPassword || !confirmPassword) {
        indicator.textContent = '';
        indicator.style.color = '';
    } else if (newPassword !== confirmPassword) {
        indicator.textContent = '✗ A jelszavak nem egyeznek';
        indicator.style.color = '#e74c3c';
    } else {
        indicator.textContent = '';
        indicator.style.color = '';
    }

    updatePasswordSubmitButton();
}

function updatePasswordSubmitButton() {
    const submitBtn = document.getElementById('password-submit-btn');
    if (!submitBtn) return;
    const newPassword = document.getElementById('new-password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';
    submitBtn.disabled = !(newPassword === confirmPassword && newPassword !== '');
}

async function changePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const submitBtn = document.getElementById('password-submit-btn');
    if (!currentPassword || !newPassword || !submitBtn) return;

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Feldolgozás...';
    submitBtn.disabled = true;

    try {
        await account.updatePassword(newPassword, currentPassword);
        showPasswordMessage('✅ Jelszó sikeresen megváltoztatva!', 'success');
        document.getElementById('password-form')?.reset();
        document.getElementById('password-match').textContent = '';
    } catch (error) {
        const msg = await translateErrorMessage(error);
        showPasswordMessage(`❌ ${msg}`, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ==================== CSAPAT SZERKESZTŐ NÉZET ====================

async function showTeamEditView(teamId) {
    const team = userTeams.find(t => t.$id === teamId);
    if (!team) return;

    let allSports = [];
    try {
        const res = await databases.listDocuments(DB_ID, 'sportok', [Query.limit(100)]);
        allSports = res.documents.map(s => s.sport);
    } catch (error) {
        console.error('Hiba a sportok betöltésekor:', error);
        allSports = team.cimkek || [];
    }

    const sportokHTML = allSports.map(s => `<div class='dropdown-item'>${s}</div>`).join('');
    const sportDropdownsHTML = generateSportDropdowns(team.cimkek || [], sportokHTML);

    const szerkesztoHTML = (team.szerkeszto?.length > 0 ? team.szerkeszto : [currentUser.email])
        .map(email => `
            <div class="szerkeszto-item">
                <input type="email" name="szerkeszto[]" value="${email}" placeholder="Szerkesztő email" readonly>
                <button type="button" class="remove-szerkeszto-btn" ${team.szerkeszto?.length <= 1 ? 'disabled' : ''}>✕</button>
            </div>
        `).join('');

    document.getElementById('jobb-oldal').innerHTML = `
        <h2 style="margin-bottom: 1rem"><p style="font-size: 0.9rem">Csapat szerkesztése:</p> ${team.nev}</h2>

        <div id="csapat-logo-container">
            <img class="csapat-logo" src="${team.kep}" alt="${team.nev} logója"
                 onerror="this.style.display='none'"
                 style="${team.kep ? '' : 'display: none'}">
            ${!team.kep ? '<p class="no-image">Nincs feltöltött logó</p>' : ''}
            <div id="logo-edit-container">
                <button id="modify-image-btn" class="save-btn">Módosítás</button>
                <button id="delete-image-btn" class="delete-btn" ${!team.kep ? 'disabled' : ''}>Törlés</button>
            </div>
            <input type="file" id="hidden-file-input" accept="image/*" style="display: none;">
        </div>

        <form class="form" id="form">
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
                            ${buildTeamFields(team)}
                            <div class="fullwidth">
                                <label>Sportok</label>
                                <div class="fullwidth" id="cimkek-container">${sportDropdownsHTML}</div>
                            </div>
                            <div class="fullwidth">
                                <label>Leírás</label>
                                <div contenteditable="true" id="leiras" class="leiras-editor">${team.leiras || ''}</div>
                            </div>
                            <small class="fullwidth" style="margin-top: 1rem">* A mező kitöltése kötelező</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="fullwidth" id="szerkeszto-section">
                <label>Szerkesztők:</label>
                <div class="fullwidth" id="szerkeszto-container-edit">${szerkesztoHTML}</div>
                <button type="button" id="add-szerkeszto-btn" class="secondary-btn">+ Új szerkesztő</button>
            </div>

            <div class="button-group">
                <button type="submit" id="save-team" class="save-btn">Adatok mentése</button>
                <button type="button" id="delete-team" class="delete-btn">Csapat törlése</button>
            </div>
        </form>
    `;

    initializeAllDropdowns(sportokHTML, team.cimkek || []);
    initializeImageHandlers(teamId);
    initializeSzerkesztoHandlers(team);
    disableEnterSubmission();
    initializeAccordions();
    initializeTeamForm();

    document.querySelector('form').addEventListener('submit', (e) => saveTeam(e, team, teamId, sportokHTML));
    document.getElementById('delete-team').addEventListener('click', () => deleteTeam(teamId));
}

function buildTeamFields(team) {
    const fields = [
        { label: 'Csapat neve*', name: 'nev', type: 'text', required: true },
        { label: 'Email*', name: 'email', type: 'email', required: true },
        { label: 'Telefon*', name: 'telefon', type: 'text', required: true },
        { label: 'Weboldal', name: 'weboldal', type: 'text' },
        { label: 'Irányítószám*', name: 'iranyitoszam', type: 'text', required: true },
        { label: 'Város*', name: 'varos', type: 'text', required: true },
        { label: 'Utca*', name: 'utca', type: 'text', required: true },
        { label: 'Házszám*', name: 'hazszam', type: 'text', required: true },
    ];

    const regularFields = fields.map(f => `
        <div class="form-group">
            <label>${f.label}</label>
            <input type="${f.type}" name="${f.name}" value="${team[f.name] || ''}" ${f.required ? 'required' : ''}>
        </div>
    `).join('');

    return regularFields + `
        <div class="form-group" style="margin: 0;">
            <label>Tagdíj</label>
            <input type="text" name="tagdij" value="${team.tagdij || ''}">
            <span class="currency-text">Ft</span>
        </div>
    `;
}

// ==================== CSAPAT MENTÉSE / TÖRLÉSE ====================

async function saveTeam(e, team, teamId, sportokHTML) {
    if(team.szerkeszto.includes(currentUser.email)) {
        e.preventDefault();
        const form = e.target;

        const selectedSports = Array.from(document.querySelectorAll('.search-dropdown-btn'))
            .map(btn => btn.textContent.trim())
            .filter(t => t && !t.includes('Válassz sportot'));
        const uniqueSports = [...new Set(selectedSports)];

        const szerkesztok = Array.from(document.querySelectorAll('input[name="szerkeszto[]"]'))
            .map(i => i.value.trim())
            .filter(Boolean);


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
            leiras: document.getElementById('leiras').innerHTML,
            szerkeszto: szerkesztok
        };

        try {
            await databases.updateDocument(DB_ID, 'csapatok', teamId, updatedData);
            const idx = userTeams.findIndex(t => t.$id === teamId);
            if (idx !== -1) userTeams[idx] = { ...userTeams[idx], ...updatedData };
            alert('Csapat adatai sikeresen frissítve!');
            showTeamEditView(teamId);
        } catch (error) {
            console.error('Hiba a csapat mentésekor:', error);
            alert('Hiba történt a csapat mentésekor');
        }
    } else {
        alert('Nincs jogosultságod a csapat adatait módosítani!');
    }
}

async function deleteTeam(teamId) {
    if (!confirm('Biztosan törölni szeretnéd ezt a csapatot? Ez a művelet nem visszavonható!')) return;

    try {
        const team = userTeams.find(t => t.$id === teamId);
        if (team?.kep) await deleteOldImageFromStorage(team.kep);

        await databases.deleteDocument(DB_ID, 'csapatok', teamId);
        userTeams = userTeams.filter(t => t.$id !== teamId);
        renderTeamButtons();
        showMyTeamsView();
        alert('Csapat sikeresen törölve!');
    } catch (error) {
        console.error('Hiba a csapat törlésekor:', error);
        alert('Hiba történt a csapat törlésekor');
    }
}

// ==================== KÉP KEZELŐK ====================

function initializeImageHandlers(teamId) {
    const modifyBtn = document.getElementById('modify-image-btn');
    const deleteBtn = document.getElementById('delete-image-btn');
    const fileInput = document.getElementById('hidden-file-input');
    if (!modifyBtn || !deleteBtn || !fileInput) return;

    modifyBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            validateImage(file);
            await uploadNewTeamImage(file, teamId);
        } catch (error) {
            alert(`Hiba: ${error.message}`);
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (confirm('Biztosan törölni szeretnéd a képet?')) await deleteTeamImage(teamId);
    });
}

async function uploadNewTeamImage(file, teamId) {
    try {
        const team = userTeams.find(t => t.$id === teamId);
        if (team.kep) await deleteOldImageFromStorage(team.kep);

        const fileResponse = await storage.createFile(STORAGE_BUCKET_ID, 'unique()', file);
        const kepUrl = `https://cloud.appwrite.io/v1/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileResponse.$id}/view?project=${PROJECT_ID}`;

        await databases.updateDocument(DB_ID, 'csapatok', teamId, { kep: kepUrl });

        const idx = userTeams.findIndex(t => t.$id === teamId);
        if (idx !== -1) userTeams[idx].kep = kepUrl;

        updateTeamImageUI(kepUrl);
        alert('Kép sikeresen frissítve!');
    } catch (error) {
        console.error('Hiba a kép feltöltésekor:', error);
        alert('Hiba történt a kép feltöltésekor');
    }
}

async function deleteTeamImage(teamId) {
    try {
        const team = userTeams.find(t => t.$id === teamId);
        if (team?.kep) await deleteOldImageFromStorage(team.kep);

        await databases.updateDocument(DB_ID, 'csapatok', teamId, { kep: "" });

        const idx = userTeams.findIndex(t => t.$id === teamId);
        if (idx !== -1) userTeams[idx].kep = "";

        updateTeamImageUI("");
        alert('Kép sikeresen törölve!');
    } catch (error) {
        console.error('Hiba a kép törlésekor:', error);
        alert('Hiba történt a kép törlésekor');
    }
}

async function deleteOldImageFromStorage(oldImageUrl) {
    if (!oldImageUrl) return;
    try {
        const fileId = oldImageUrl.split('/files/')[1]?.split('/view')[0];
        if (fileId) await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
    } catch (error) {
        console.error('Hiba a régi kép törlésekor:', error);
    }
}

function updateTeamImageUI(imageUrl) {
    const logoImg = document.querySelector('.csapat-logo');
    const noImageText = document.querySelector('.no-image');
    const deleteBtn = document.getElementById('delete-image-btn');

    if (imageUrl) {
        if (logoImg) { logoImg.src = imageUrl; logoImg.style.display = 'block'; }
        if (noImageText) noImageText.style.display = 'none';
        if (deleteBtn) deleteBtn.disabled = false;
    } else {
        if (logoImg) logoImg.style.display = 'none';
        if (noImageText) {
            noImageText.style.display = 'block';
        } else {
            const container = document.getElementById('csapat-logo-container');
            if (container && !container.querySelector('.no-image')) {
                const p = document.createElement('p');
                p.className = 'no-image';
                p.textContent = 'Nincs feltöltött kép';
                container.insertBefore(p, document.getElementById('logo-edit-container'));
            }
        }
        if (deleteBtn) deleteBtn.disabled = true;
    }

    const fileInput = document.getElementById('hidden-file-input');
    if (fileInput) fileInput.value = '';
}

// ==================== SZERKESZTŐK ====================

function initializeSzerkesztoHandlers(team) {
    const container = document.getElementById('szerkeszto-container-edit');
    const addBtn = document.getElementById('add-szerkeszto-btn');
    if (!container || !addBtn) return;

    addBtn.addEventListener('click', () => {
        const item = document.createElement('div');
        item.className = 'szerkeszto-item';
        item.innerHTML = `
            <input type="email" name="szerkeszto[]" placeholder="Új szerkesztő email" required>
            <button type="button" class="remove-szerkeszto-btn">✕</button>
        `;
        container.appendChild(item);
        item.querySelector('.remove-szerkeszto-btn').addEventListener('click', () => {
            if (container.children.length > 1) container.removeChild(item);
        });
    });

    container.querySelectorAll('.remove-szerkeszto-btn').forEach(btn => {
        const item = btn.closest('.szerkeszto-item');
        const input = item.querySelector('input');
        if (input.value !== team.userEmail) {
            btn.disabled = false;
            btn.addEventListener('click', () => {
                if (container.children.length > 1) container.removeChild(item);
                document.getElementById('save-team').click();
            });
        } else {
            btn.disabled = true;
            btn.title = "A létrehozót nem lehet eltávolítani";
        }
    });
}

// ==================== ÚJ CSAPAT NÉZET ====================

async function showNewTeamView() {
    const jobbOldal = document.getElementById('jobb-oldal');
    let sportokHTML = '';

    try {
        let allDocs = [], offset = 0;
        while (true) {
            const res = await databases.listDocuments(DB_ID, 'sportok', [
                Query.limit(100), Query.offset(offset)
            ]);
            allDocs = [...allDocs, ...res.documents];
            if (res.documents.length < 100) break;
            offset += 100;
        }
        sportokHTML = allDocs.map(s => `<div class='dropdown-item'>${s.sport}</div>`).join('');
    } catch (error) {
        console.error('Hiba a sportok betöltésekor:', error);
        jobbOldal.innerHTML = `<div class="error">Hiba történt az adatok betöltése során: ${error.message}</div>`;
        return;
    }

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
                            <div class="dropdown-list">${sportokHTML}</div>
                        </div>
                    </div>
                </div>

                <div class="text">Logó feltöltése:</div>
                <div class="fullwidth" id="kep-feltoltes">
                    <input type="file" name="kep" accept="image/*" id="kepInput">
                    <img id="kepPreview" src="" alt="" style="display:none;">
                </div>

                <small>* A mező kitöltése kötelező</small>
            </form>
            <button type="submit" id="submit-btn">Hozzáadás</button>
        </div>
    `;

    initializeAllDropdowns(sportokHTML);
    initializeTeamForm();
}

// ==================== FORM INICIALIZÁLÁS ====================

async function initializeTeamForm() {
    const form = document.querySelector("form");
    if (!form) {
        setTimeout(initializeTeamForm, 100);
        return;
    }

    const hasPermission = await checkUserPermission();
    if (!hasPermission) return;

    const telefonInput = document.getElementById("telefon");
    if (telefonInput) {
        telefonInput.addEventListener("keydown", e => { if (e.key === " ") e.preventDefault(); });
        telefonInput.addEventListener("input", e => { e.target.value = e.target.value.replace(/\s/g, ''); });
    }

    const iranyitoszamInput = document.querySelector('input[name="iranyitoszam"]');
    if (iranyitoszamInput) {
        iranyitoszamInput.addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, ''); });
    }

    const kepInput = document.getElementById("kepInput");
    const kepPreview = document.getElementById("kepPreview");
    if (kepInput && kepPreview) {
        kepInput.addEventListener("change", e => handleImagePreview(e, kepPreview));
    }

    document.getElementById('submit-btn')?.addEventListener("click", e => {
        e.preventDefault();
        handleFormSubmit(e, form, document.getElementById("message-container"));
    });
}

function handleImagePreview(event, kepPreview) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        kepPreview.src = e.target.result;
        kepPreview.style.display = 'block';

        const container = document.getElementById('kep-feltoltes');
        container.style.position = 'relative';

        document.getElementById('kep-delete-icon')?.remove();

        const deleteIcon = document.createElement('div');
        deleteIcon.id = 'kep-delete-icon';
        deleteIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="4" x2="20" y2="20"/>
                <line x1="20" y1="4" x2="4" y2="20"/>
            </svg>`;
        deleteIcon.style.cssText = `
            position: absolute; top: 24px; background: #dc3545; border-radius: 50%;
            padding: 4px; cursor: pointer; z-index: 100; width: 24px; height: 24px;
            display: flex; align-items: center; justify-content: center;`;
        deleteIcon.style.left = kepPreview.clientWidth + 'px';
        deleteIcon.onclick = () => {
            kepPreview.src = '';
            kepPreview.style.display = 'none';
            event.target.value = '';
            deleteIcon.remove();
        };

        container.appendChild(deleteIcon);
    };
    reader.readAsDataURL(file);
}

async function handleFormSubmit(event, form, messageContainer) {
    event.preventDefault();
    const submitBtn = document.querySelector('#submit-btn');
    if (!submitBtn) return;

    const fields = ['nev', 'email', 'telefon', 'iranyitoszam', 'varos', 'utca', 'hazszam'];
    const missing = fields.some(f => !form.querySelector(`input[name="${f}"]`)?.value.trim());
    if (missing) {
        showMessage(messageContainer, 'Minden kötelező mezőt tölts ki!', 'error');
        return;
    }

    const selectedSports = Array.from(document.querySelectorAll('.search-dropdown-btn'))
        .map(btn => btn.textContent.trim())
        .filter(t => t && !t.includes('Válassz sportot'));
    const uniqueSports = [...new Set(selectedSports)];

    if (uniqueSports.length === 0) {
        showMessage(messageContainer, 'Legalább egy sportot válassz ki!', 'error');
        return;
    }

    if (selectedSports.length !== uniqueSports.length) {
        showMessage(messageContainer, `Figyelem: ${selectedSports.length - uniqueSports.length} ismétlődő sport eltávolítva`, 'warning');
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Feldolgozás...';
    submitBtn.disabled = true;

    try {
        let kepUrl = '';
        const kepInput = document.getElementById('kepInput');
        if (kepInput?.files[0]) {
            const fileRes = await storage.createFile(STORAGE_BUCKET_ID, 'unique()', kepInput.files[0]);
            kepUrl = `https://cloud.appwrite.io/v1/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileRes.$id}/view?project=${PROJECT_ID}`;
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
            szerkeszto: [currentUser.email],
            ...(kepUrl && { kep: kepUrl })
        };

        await databases.createDocument(DB_ID, 'csapatok', 'unique()', formData);
        showMessage(messageContainer, 'Sikeresen létrehozva!', 'success');
        form.reset();

        const kepPreview = document.getElementById('kepPreview');
        if (kepPreview) { kepPreview.style.display = 'none'; kepPreview.src = ''; }

        document.getElementById('cimkek-container').innerHTML = `
            <div class="search-dropdown" id="dropdown3">
                <button class="search-dropdown-btn" type="button">Válassz sportot</button>
                <div class="search-dropdown-content">
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Keresés...">
                    </div>
                    <div class="dropdown-list"></div>
                </div>
            </div>`;
        initializeAllDropdowns('');

    } catch (error) {
        const msg = await translateErrorMessage(error);
        showMessage(messageContainer, `❌ ${msg}`, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ==================== JOGOSULTSÁG ====================

async function checkUserPermission() {
    try {
        const res = await databases.listDocuments(DB_ID, 'tiltott_felhasznalok', [
            Query.equal("userEmail", currentUser.email)
        ]);
        if (res.documents.length > 0) {
            const container = document.getElementById("message-container");
            if (container) container.innerHTML = `<div class="message error">❌ Ez a felhasználó nem regisztrálhat csapatot.</div>`;
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) submitBtn.disabled = true;
            return false;
        }
        return true;
    } catch (error) {
        return error.code === 404;
    }
}

// ==================== PROFIL NÉZET ====================

function showProfileView() {
    document.getElementById('jobb-oldal').innerHTML = `
        <h2>Beállítások</h2>
        <div id="profil-container">

            <div class="szekció">
                <h3>Személyes adatok</h3>
                <form class="form" id="name-form">
                    <div class="form-group">
                        <label>Név*</label>
                        <input type="text" id="profile-name" value="${currentUser.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" value="${currentUser.email}" disabled>
                    </div>
                    <button type="submit" id="name-submit-btn" class="profile-save-btn">Mentés</button>
                    <div id="name-message-container"></div>
                </form>
            </div>

            <div class="szekció">
                <h3>Jelszó megváltoztatása</h3>
                <form class="form" id="password-form">
                    ${buildPasswordField('current-password', 'Jelenlegi jelszó*', 'Jelenlegi jelszó')}
                    ${buildPasswordField('new-password', 'Új jelszó*', 'Új jelszó')}
                    ${buildPasswordField('confirm-password', 'Új jelszó megerősítése*', 'Új jelszó megerősítése', true)}
                    <button type="submit" id="password-submit-btn" class="profile-save-btn" disabled>
                        Jelszó megváltoztatása
                    </button>
                    <div id="password-message-container"></div>
                </form>
            </div>

            <div class="szekció fullwidth danger-zone">
                <h3>Veszélyzóna</h3>
                <p>A fiók törlése visszavonhatatlan. Minden adatod elvész.</p>
                <button type="button" id="delete-account-btn" class="delete-btn">Fiók törlése</button>
            </div>

        </div>
    `;

    setupPasswordChangeHandlers();
    setupNameChangeHandler();
    setupDeleteAccountHandler();
    disableEnterSubmission();
}


// ==================== KIJELENTKEZÉS ====================

async function logout() {
    try {
        await account.deleteSession('current');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Hiba a kijelentkezéskor:', error);
    }
}

// ==================== SPORT DROPDOWN ====================

function generateSportDropdowns(selectedSports, sportokHTML) {
    const makeDropdown = (id, label) => `
        <div class="search-dropdown" id="${id}">
            <button class="search-dropdown-btn" type="button">${label}</button>
            <div class="search-dropdown-content">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Keresés...">
                </div>
                <div class="dropdown-list">${sportokHTML}</div>
            </div>
        </div>`;

    if (!selectedSports?.length) return makeDropdown('dropdown3', 'Válassz sportot');

    const filled = selectedSports.map((sport, i) =>
        makeDropdown(i === 0 ? 'dropdown3' : `dropdown-${Date.now()}-${i}`, sport)
    ).join('');

    return filled + makeDropdown(`dropdown-${Date.now()}-empty`, 'Válassz sportot');
}

function initializeAllDropdowns(sportokHTML, preSelectedSports = []) {
    document.querySelectorAll('.search-dropdown').forEach((dropdown, i) => {
        initializeSingleDropdown(dropdown, sportokHTML, preSelectedSports[i] || null);
    });
}

function initializeSingleDropdown(dropdown, sportokHTML, preSelectedSport = null) {
    const dropdownBtn = dropdown.querySelector('.search-dropdown-btn');
    const dropdownContent = dropdown.querySelector('.search-dropdown-content');
    if (!dropdownBtn || !dropdownContent) return;

    const searchInput = dropdownContent.querySelector('.search-input');
    if (!searchInput) return;

    // Törlés gomb
    let clearBtn = dropdownBtn.querySelector('.clear-selection-btn');
    if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'clear-selection-btn';
        clearBtn.type = 'button';
        clearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/>
        </svg>`;
        clearBtn.title = 'Kiválasztás törlése';
        dropdownBtn.appendChild(clearBtn);
    }

    // Nyíl ikon
    if (!dropdownBtn.querySelector('.dropdown-arrow')) {
        const arrow = document.createElement('div');
        arrow.className = 'dropdown-arrow';
        dropdownBtn.appendChild(arrow);
    }

    function getButtonText() {
        return dropdownBtn.childNodes[0]?.nodeType === 3
            ? dropdownBtn.childNodes[0].nodeValue.trim()
            : dropdownBtn.textContent.trim();
    }

    function setButtonText(text) {
        if (dropdownBtn.childNodes[0]?.nodeType === 3) {
            dropdownBtn.childNodes[0].nodeValue = text;
        } else {
            dropdownBtn.insertBefore(document.createTextNode(text), clearBtn);
        }
    }

    // Előre kiválasztott sport
    const currentText = getButtonText();
    if (preSelectedSport && (currentText === 'Válassz sportot' || currentText === '')) {
        setButtonText(preSelectedSport);
        dropdownBtn.classList.add('has-selection');
    } else {
        dropdownBtn.classList.toggle('has-selection', currentText !== 'Válassz sportot' && currentText !== '');
    }

    // Törlés esemény
    clearBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setButtonText('Válassz sportot');
        dropdownBtn.classList.remove('has-selection');
        dropdown.classList.remove('active');
        setTimeout(() => {
            handleDynamicTags(sportokHTML);
            initializeAccordions()?.updateHeight();
        }, 50);
        return false;
    };

    // Megnyitás / zárás
    dropdownBtn.addEventListener('click', (e) => {
        if (e.target === clearBtn || clearBtn.contains(e.target)) return;
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
            setTimeout(() => { adjustDropdownToForm(dropdown); searchInput.focus(); }, 10);
        }
    });

    // Keresés
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase().trim();
        const items = dropdownContent.querySelectorAll('.dropdown-item');
        let visible = 0;

        items.forEach(item => {
            const show = filter === '' || item.textContent.toLowerCase().includes(filter);
            item.style.display = show ? 'flex' : 'none';
            if (show) visible++;
        });

        const noResults = dropdownContent.querySelector('.no-results');
        if (filter && visible === 0) {
            if (!noResults) {
                const msg = document.createElement('div');
                msg.className = 'no-results';
                msg.textContent = 'Nincs találat';
                dropdownContent.querySelector('.dropdown-list').appendChild(msg);
            }
        } else {
            noResults?.remove();
        }

        if (!filter) items.forEach(i => i.style.display = 'flex');
    });

    // Sport kiválasztás
    dropdownContent.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const selected = item.textContent;
            if (getButtonText() !== selected) {
                setButtonText(selected);
                dropdownBtn.classList.add('has-selection');
                dropdown.classList.remove('active');
                handleDynamicTags(sportokHTML);
                initializeAccordions()?.updateHeight();
            }
        });
    });

    // Külső klikk
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-dropdown')) dropdown.classList.remove('active');
    });
}

function handleDynamicTags(sportokHTML) {
    const container = document.getElementById("cimkek-container");
    if (!container) return;

    const dropdowns = container.querySelectorAll('.search-dropdown');

    if (dropdowns.length >= 2) {
        for (let i = dropdowns.length - 1; i >= 1; i--) {
            const curr = dropdowns[i];
            const prev = dropdowns[i - 1];
            const currText = curr.querySelector('.search-dropdown-btn')?.textContent || '';
            const prevText = prev.querySelector('.search-dropdown-btn')?.textContent || '';
            const currEmpty = currText.includes("Válassz sportot") || !currText.trim();
            const prevEmpty = prevText.includes("Válassz sportot") || !prevText.trim();

            if (currEmpty && prevEmpty && curr.id !== 'dropdown3') {
                curr.remove();
                break;
            }
        }
    }

    const updated = container.querySelectorAll('.search-dropdown');
    if (updated.length > 0) {
        const lastBtn = updated[updated.length - 1].querySelector('.search-dropdown-btn');
        const lastText = lastBtn?.textContent || '';
        const lastEmpty = lastText.includes("Válassz sportot") || !lastText.trim();
        if (!lastEmpty) addNewDropdown(sportokHTML);
    }
}

function addNewDropdown(sportokHTML) {
    const container = document.getElementById("cimkek-container");
    const id = `dropdown-${Date.now()}`;
    container.insertAdjacentHTML('beforeend', `
        <div class="search-dropdown" id="${id}">
            <button class="search-dropdown-btn" type="button">Válassz sportot</button>
            <div class="search-dropdown-content">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Keresés...">
                </div>
                <div class="dropdown-list">${sportokHTML}</div>
            </div>
        </div>`);
    initializeSingleDropdown(document.getElementById(id), sportokHTML);
}
