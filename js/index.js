import { databases } from './lib/appwrite.js';

const userCardTemplate = document.querySelector("[data-user-template]");
const userCardContainer = document.querySelector("[data-user-cards-container]");
const searchInput = document.querySelector("[data-search]");

// Panel elemek
const filterToggleBtn = document.getElementById("filter-toggle-btn");
const filterPanel = document.getElementById("filter-panel");
const filterOverlay = document.getElementById("filter-overlay");
const filterCloseBtn = document.getElementById("filter-close-btn");
const filterApplyBtn = document.getElementById("filter-apply-btn");
const filterClearAllBtn = document.getElementById("filter-clear-all-btn");
const filterBadge = document.getElementById("filter-badge");

// Aktív sáv
const activeFilterBar = document.getElementById("active-filter-bar");
const activeChipsContainer = document.getElementById("active-chips");
const filterResetBtn = document.getElementById("filter-reset-btn");

// Szekció törlők
const sportClearBtn = document.querySelector('[data-section="sport"]');
const varosClearBtn = document.querySelector('[data-section="varos"]');
const tagdijClearBtn = document.querySelector('[data-section="tagdij"]');

// Tagdíj inputok
const tagdijMinInput = document.getElementById("tagdij-min");
const tagdijMaxInput = document.getElementById("tagdij-max");
const tagdijHint = document.getElementById("tagdij-hint");

// ==================== ÁLLAPOT ====================

let users = [];

// "pending" = a panelben beállított, de még nem alkalmazott szűrők
// "active"  = ténylegesen alkalmazott szűrők
let pendingSports = new Set();
let pendingVaros = new Set();
let pendingTagdijMin = null;
let pendingTagdijMax = null;

let activeSports = new Set();
let activeVaros = new Set();
let activeTagdijMin = null;
let activeTagdijMax = null;

// ==================== PANEL NYIT / ZÁRÁS ====================

function openPanel() {
    // Pending állapot = jelenleg aktív szűrők másolata
    pendingSports = new Set(activeSports);
    pendingVaros = new Set(activeVaros);
    pendingTagdijMin = activeTagdijMin;
    pendingTagdijMax = activeTagdijMax;

    syncChipsToPending();
    syncTagdijInputs();

    filterPanel.classList.remove("hide");
    filterOverlay.classList.remove("hide");
    // Trigger transition
    requestAnimationFrame(() => {
        filterPanel.classList.add("visible");
        filterOverlay.classList.add("visible");
    });
    filterToggleBtn.setAttribute("aria-expanded", "true");
    filterToggleBtn.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closePanel() {
    filterPanel.classList.remove("visible");
    filterOverlay.classList.remove("visible");
    filterToggleBtn.setAttribute("aria-expanded", "false");
    filterToggleBtn.classList.remove("active");
    document.body.style.overflow = "";
    setTimeout(() => {
        filterPanel.classList.add("hide");
        filterOverlay.classList.add("hide");
    }, 300);
}

filterToggleBtn.addEventListener("click", openPanel);
filterCloseBtn.addEventListener("click", closePanel);
filterOverlay.addEventListener("click", closePanel);
document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });

// ==================== SZINKRON: pending → chip megjelenés ====================

function syncChipsToPending() {
    document.querySelectorAll("#sport-chips .filter-chip").forEach(chip => {
        chip.classList.toggle("active", pendingSports.has(chip.dataset.value));
    });
    document.querySelectorAll("#varos-chips .filter-chip").forEach(chip => {
        chip.classList.toggle("active", pendingVaros.has(chip.dataset.value));
    });
    updateSectionClearBtns();
}

function syncTagdijInputs() {
    tagdijMinInput.value = pendingTagdijMin !== null ? pendingTagdijMin : "";
    tagdijMaxInput.value = pendingTagdijMax !== null ? pendingTagdijMax : "";
    tagdijHint.textContent = "";
}

function updateSectionClearBtns() {
    sportClearBtn.classList.toggle("hide", pendingSports.size === 0);
    varosClearBtn.classList.toggle("hide", pendingVaros.size === 0);
    const hasTagdij = pendingTagdijMin !== null || pendingTagdijMax !== null;
    tagdijClearBtn.classList.toggle("hide", !hasTagdij);
}

// ==================== CHIP KATTINTÁS (pending módosítás) ====================

function onSportChipClick(chip) {
    const val = chip.dataset.value;
    if (pendingSports.has(val)) { pendingSports.delete(val); chip.classList.remove("active"); }
    else { pendingSports.add(val); chip.classList.add("active"); }
    updateSectionClearBtns();
}

function onVarosChipClick(chip) {
    const val = chip.dataset.value;
    if (pendingVaros.has(val)) { pendingVaros.delete(val); chip.classList.remove("active"); }
    else { pendingVaros.add(val); chip.classList.add("active"); }
    updateSectionClearBtns();
}

// ==================== TAGDÍJ VALIDÁCIÓ ====================

function validateTagdij() {
    const min = tagdijMinInput.value !== "" ? Number(tagdijMinInput.value) : null;
    const max = tagdijMaxInput.value !== "" ? Number(tagdijMaxInput.value) : null;

    if (min !== null && min < 0) {
        tagdijHint.textContent = "A minimum nem lehet negatív.";
        return false;
    }
    if (max !== null && max < 0) {
        tagdijHint.textContent = "A maximum nem lehet negatív.";
        return false;
    }
    if (min !== null && max !== null && min > max) {
        tagdijHint.textContent = "A minimum nem lehet nagyobb a maximumnál.";
        return false;
    }
    tagdijHint.textContent = "";
    pendingTagdijMin = min;
    pendingTagdijMax = max;
    updateSectionClearBtns();
    return true;
}

tagdijMinInput.addEventListener("input", validateTagdij);
tagdijMaxInput.addEventListener("input", validateTagdij);

// ==================== SZEKCIÓ TÖRLÉS ====================

sportClearBtn.addEventListener("click", () => {
    pendingSports.clear();
    syncChipsToPending();
});

varosClearBtn.addEventListener("click", () => {
    pendingVaros.clear();
    syncChipsToPending();
});

tagdijClearBtn.addEventListener("click", () => {
    pendingTagdijMin = null;
    pendingTagdijMax = null;
    syncTagdijInputs();
    updateSectionClearBtns();
});

// ==================== ÖSSZES TÖRLÉSE (panelen belül) ====================

filterClearAllBtn.addEventListener("click", () => {
    pendingSports.clear();
    pendingVaros.clear();
    pendingTagdijMin = null;
    pendingTagdijMax = null;
    syncChipsToPending();
    syncTagdijInputs();
});

// ==================== ALKALMAZ ====================

filterApplyBtn.addEventListener("click", () => {
    if (!validateTagdij()) return;

    activeSports = new Set(pendingSports);
    activeVaros = new Set(pendingVaros);
    activeTagdijMin = pendingTagdijMin;
    activeTagdijMax = pendingTagdijMax;

    applyFilters();
    renderActiveBar();
    updateBadge();
    closePanel();
});

// ==================== AKTÍV SÁV ====================

function renderActiveBar() {
    activeChipsContainer.innerHTML = "";

    const addChip = (label, onRemove) => {
        const chip = document.createElement("div");
        chip.className = "active-chip";
        chip.innerHTML = `${label}<button class="active-chip-remove" type="button" aria-label="Szűrő eltávolítása">✕</button>`;
        chip.querySelector(".active-chip-remove").addEventListener("click", onRemove);
        activeChipsContainer.appendChild(chip);
    };

    activeSports.forEach(s => addChip(s, () => {
        activeSports.delete(s);
        applyFilters(); renderActiveBar(); updateBadge();
    }));

    activeVaros.forEach(v => addChip(v, () => {
        activeVaros.delete(v);
        applyFilters(); renderActiveBar(); updateBadge();
    }));

    if (activeTagdijMin !== null || activeTagdijMax !== null) {
        const minLabel = activeTagdijMin !== null ? `${activeTagdijMin.toLocaleString("hu")} Ft` : "0 Ft";
        const maxLabel = activeTagdijMax !== null ? `${activeTagdijMax.toLocaleString("hu")} Ft` : "∞";
        addChip(`${minLabel} – ${maxLabel}`, () => {
            activeTagdijMin = null;
            activeTagdijMax = null;
            applyFilters(); renderActiveBar(); updateBadge();
        });
    }

    const hasAny = activeSports.size > 0 || activeVaros.size > 0 ||
                   activeTagdijMin !== null || activeTagdijMax !== null;
    activeFilterBar.classList.toggle("hide", !hasAny);
}

filterResetBtn.addEventListener("click", () => {
    activeSports.clear();
    activeVaros.clear();
    activeTagdijMin = null;
    activeTagdijMax = null;
    searchInput.value = "";
    applyFilters();
    renderActiveBar();
    updateBadge();
});

function updateBadge() {
    let count = activeSports.size + activeVaros.size;
    if (activeTagdijMin !== null || activeTagdijMax !== null) count++;
    if (searchInput.value.trim()) count++;
    filterBadge.textContent = count;
    filterBadge.classList.toggle("hide", count === 0);
}

// ==================== SZŰRÉS ====================

function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    users.forEach(user => {
        const matchesSearch =
            !query ||
            user.nev?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.varos?.toLowerCase().includes(query) ||
            user.cimkek?.some(t => t.toLowerCase().includes(query));

        const matchesSport =
            activeSports.size === 0 ||
            user.cimkek?.some(t => activeSports.has(t));

        const matchesVaros =
            activeVaros.size === 0 ||
            activeVaros.has(user.varos);

        const tagdij = user.tagdij;
        const matchesTagdijMin = activeTagdijMin === null || tagdij === null || tagdij >= activeTagdijMin;
        const matchesTagdijMax = activeTagdijMax === null || tagdij === null || tagdij <= activeTagdijMax;

        const visible = matchesSearch && matchesSport && matchesVaros && matchesTagdijMin && matchesTagdijMax;
        user.element.classList.toggle("hide", !visible);
        if (visible) visibleCount++;
    });

    // "Nincs találat" üzenet
    const existing = userCardContainer.querySelector(".no-results-msg");
    if (visibleCount === 0) {
        if (!existing) {
            const msg = document.createElement("div");
            msg.className = "no-results-msg";
            msg.textContent = "Nincs a szűrőknek megfelelő csapat.";
            userCardContainer.appendChild(msg);
        }
    } else {
        existing?.remove();
    }
}

// ==================== CHIP-EK FELÉPÍTÉSE ====================

function buildChips(containerId, values, clickHandler) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    const sorted = [...values].sort((a, b) => a.localeCompare(b, "hu"));
    sorted.forEach(val => {
        const chip = document.createElement("button");
        chip.className = "filter-chip";
        chip.type = "button";
        chip.textContent = val;
        chip.dataset.value = val;
        chip.addEventListener("click", () => clickHandler(chip));
        container.appendChild(chip);
    });
}

// ==================== ADATBETÖLTÉS ====================

async function loadUsers() {
    try {
        const response = await databases.listDocuments(
            "68fe32ea0008ab84b709",
            "csapatok"
        );

        if (!response.documents || response.documents.length === 0) {
            userCardContainer.innerHTML = '<div class="no-results-msg">Nincsenek csapatok</div>';
            return;
        }

        userCardContainer.innerHTML = "";

        const sportSet = new Set();
        const varosSet = new Set();

        users = response.documents.map(doc => {
            const card = userCardTemplate.content.cloneNode(true).children[0];
            const header = card.querySelector("[data-header]");
            const body = card.querySelector("[data-body]");
            const image = card.querySelector("[data-image]");

            header.textContent = doc.nev || "Név nélkül";

            // Tagdíj megjelenítés
            const tagdijText = doc.tagdij
                ? `${Number(doc.tagdij).toLocaleString("hu")} Ft/hó`
                : "Tagdíj: nincs adat";
            const varosText = doc.varos || "";
            body.textContent = [varosText, tagdijText, (doc.cimkek || []).join(", ")]
                .filter(Boolean).join(" · ");

            if (doc.kep) {
                image.style.display = "block";
                image.src = doc.kep;
                image.alt = `${doc.nev} logója`;
            } else {
                image.style.display = "none";
            }

            card.addEventListener("click", () => {
                window.location = `/csapat.html?id=${doc.$id}`;
            });

            userCardContainer.append(card);

            (doc.cimkek || []).forEach(t => sportSet.add(t));
            if (doc.varos) varosSet.add(doc.varos);

            return {
                nev: doc.nev,
                email: doc.email,
                varos: doc.varos || null,
                tagdij: doc.tagdij != null ? Number(doc.tagdij) : null,
                cimkek: doc.cimkek || [],
                element: card
            };
        });

        buildChips("sport-chips", sportSet, onSportChipClick);
        buildChips("varos-chips", varosSet, onVarosChipClick);

    } catch (error) {
        console.error("❌ Hiba:", error);
        userCardContainer.innerHTML = `<div class="no-results-msg"><strong>Hiba történt</strong><br>${error.message}</div>`;
    }
}

// ==================== INICIALIZÁLÁS ====================

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    searchInput?.addEventListener("input", () => {
        applyFilters();
        updateBadge();
    });
});