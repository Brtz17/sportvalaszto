import { databases, Query } from "./lib/appwrite.js";

// DOM Elements
const elements = {
    // Stats cards
    totalViews: document.getElementById('total-views'),
    uniqueVisitors: document.getElementById('unique-visitors'),
    totalTeams: document.getElementById('total-teams'),
    viewsToday: document.getElementById('views-today'),
    
    // Charts
    trafficChart: document.getElementById('traffic-chart'),
    timeRangeSelect: document.getElementById('time-range'),
    
    // Top teams
    topTeamsList: document.getElementById('top-teams-list'),
    refreshTopTeamsBtn: document.getElementById('refresh-top-teams'),
    
    // Teams table
    teamsTableBody: document.getElementById('teams-table-body'),
    teamSearchInput: document.getElementById('team-search'),
    sortBySelect: document.getElementById('sort-by'),
    showingCount: document.getElementById('showing-count'),
    totalCount: document.getElementById('total-count'),
    currentPage: document.getElementById('current-page'),
    totalPages: document.getElementById('total-pages'),
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    
    // Modal
    modal: document.getElementById('team-details-modal'),
    modalTeamName: document.getElementById('modal-team-name'),
    modalTeamId: document.getElementById('detail-team-id'),
    modalTotalViews: document.getElementById('detail-total-views'),
    modalUniqueVisitors: document.getElementById('detail-unique-visitors'),
    modalViewsToday: document.getElementById('detail-views-today'),
    modalFirstView: document.getElementById('detail-first-view'),
    modalLastView: document.getElementById('detail-last-view'),
    modalCloseBtns: document.querySelectorAll('.modal-close'),
    viewTeamPageBtn: document.getElementById('view-team-page'),
    teamDetailChart: document.getElementById('team-detail-chart')
};

// Global variables
let allTeams = [];
let filteredTeams = [];
let currentPage = 1;
const itemsPerPage = 10;
let chartInstances = {
    traffic: null,
    teamDetail: null
};

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format number with thousand separators
function formatNumber(num) {
    return new Intl.NumberFormat('hu-HU').format(num);
}

// Show loading state
function showLoading(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.innerHTML = '<div class="loading">Betöltés...</div>';
    }
}

// Load overall statistics
async function loadOverallStats() {
    try {
        // Get all teams
        const teamsResponse = await databases.listDocuments(
            '68fe32ea0008ab84b709',
            'csapatok',
            [Query.limit(500)]
        );
        
        allTeams = teamsResponse.documents;
        elements.totalTeams.textContent = formatNumber(allTeams.length);
        
        // Get all pageviews for stats
        const today = new Date().toISOString().split('T')[0];
        let totalViews = 0;
        let viewsToday = 0;
        const allIPs = new Set();
        
        // We'll sample first 1000 pageviews for performance
        const pageviewsResponse = await databases.listDocuments(
            '68fe32ea0008ab84b709',
            'pageviews',
            [Query.limit(1000), Query.orderDesc('timestamp')]
        );
        
        pageviewsResponse.documents.forEach(view => {
            totalViews++;
            if (view.date === today) {
                viewsToday++;
            }
            if (view.ipAddress && view.ipAddress !== 'unknown') {
                allIPs.add(view.ipAddress);
            }
        });
        
        // Update stats cards
        elements.totalViews.textContent = formatNumber(totalViews);
        elements.uniqueVisitors.textContent = formatNumber(allIPs.size);
        elements.viewsToday.textContent = formatNumber(viewsToday);
        
    } catch (error) {
        console.error('Error loading overall stats:', error);
        showError('Nem sikerült betölteni a statisztikákat');
    }
}

// Load top teams
async function loadTopTeams(limit = 10) {
    showLoading('.top-teams-list');
    
    try {
        const teamsWithStats = await Promise.all(
            allTeams.map(async (team) => {
                const views = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'pageviews',
                    [Query.equal('teamId', team.$id)]
                );
                
                return {
                    id: team.$id,
                    name: team.nev,
                    views: views.total,
                    logo: team.kep || null
                };
            })
        );
        
        // Sort by views and take top N
        const topTeams = teamsWithStats
            .sort((a, b) => b.views - a.views)
            .slice(0, limit);
        
        // Render top teams list
        elements.topTeamsList.innerHTML = topTeams.map((team, index) => `
            <div class="top-team-item" data-team-id="${team.id}">
                <div class="team-rank">${index + 1}</div>
                <div class="team-name">${team.name}</div>
                <div class="team-views">${formatNumber(team.views)}</div>
            </div>
        `).join('');
        
        // Add click event to view details
        document.querySelectorAll('.top-team-item').forEach(item => {
            item.addEventListener('click', function() {
                const teamId = this.dataset.teamId;
                showTeamDetails(teamId);
            });
        });
        
    } catch (error) {
        console.error('Error loading top teams:', error);
        elements.topTeamsList.innerHTML = '<div class="error">Hiba a betöltés közben</div>';
    }
}

// Load all teams for table
async function loadAllTeams() {
    showLoading('#teams-table-body');
    
    try {
        const teamsWithStats = await Promise.all(
            allTeams.map(async (team) => {
                // Get total views
                const totalViews = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'pageviews',
                    [Query.equal('teamId', team.$id)]
                );
                
                // Get today's views
                const today = new Date().toISOString().split('T')[0];
                const todayViews = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'pageviews',
                    [
                        Query.equal('teamId', team.$id),
                        Query.equal('date', today)
                    ]
                );
                
                // Get unique visitors
                const allViews = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'pageviews',
                    [
                        Query.equal('teamId', team.$id),
                        Query.select(['ipAddress'])
                    ]
                );
                
                const uniqueIPs = new Set();
                allViews.documents.forEach(view => {
                    if (view.ipAddress && view.ipAddress !== 'unknown') {
                        uniqueIPs.add(view.ipAddress);
                    }
                });
                
                // Get last view date
                const lastView = await databases.listDocuments(
                    '68fe32ea0008ab84b709',
                    'pageviews',
                    [
                        Query.equal('teamId', team.$id),
                        Query.limit(1),
                        Query.orderDesc('timestamp')
                    ]
                );
                
                return {
                    id: team.$id,
                    name: team.nev,
                    email: team.email || '-',
                    totalViews: totalViews.total,
                    todayViews: todayViews.total,
                    uniqueVisitors: uniqueIPs.size,
                    lastView: lastView.documents[0]?.timestamp || null,
                    lastViewDate: lastView.documents[0]?.date || null
                };
            })
        );
        
        filteredTeams = teamsWithStats;
        renderTeamsTable();
        
    } catch (error) {
        console.error('Error loading teams:', error);
        elements.teamsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error">Hiba a betöltés közben</td>
            </tr>
        `;
    }
}

// Render teams table with pagination
function renderTeamsTable() {
    // Apply sorting
    const sortBy = elements.sortBySelect.value;
    filteredTeams.sort((a, b) => {
        switch(sortBy) {
            case 'views':
                return b.totalViews - a.totalViews;
            case 'name':
                return a.name.localeCompare(b.name, 'hu');
            case 'date':
                return new Date(b.lastView || 0) - new Date(a.lastView || 0);
            default:
                return 0;
        }
    });
    
    // Calculate pagination
    const totalItems = filteredTeams.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageTeams = filteredTeams.slice(startIndex, endIndex);
    
    // Update pagination info
    elements.totalCount.textContent = formatNumber(totalItems);
    elements.showingCount.textContent = formatNumber(endIndex - startIndex);
    elements.currentPage.textContent = currentPage;
    elements.totalPages.textContent = totalPages;
    
    // Enable/disable pagination buttons
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage === totalPages;
    
    // Render table rows
    elements.teamsTableBody.innerHTML = pageTeams.map(team => `
        <tr>
            <td>
                <strong>${team.name}</strong><br>
                <small>${team.email}</small>
            </td>
            <td><strong>${formatNumber(team.totalViews)}</strong></td>
            <td>
                <span class="${team.todayViews > 0 ? 'positive' : 'neutral'}">
                    ${formatNumber(team.todayViews)}
                </span>
            </td>
            <td>${formatNumber(team.uniqueVisitors)}</td>
            <td>${team.lastView ? formatDate(team.lastView) : 'Még nem'}</td>
            <td>
                <button class="view-details-btn" data-team-id="${team.id}">
                    <i class="fas fa-chart-bar"></i> Részletek
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to detail buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const teamId = this.dataset.teamId;
            showTeamDetails(teamId);
        });
    });
}

// Show team details modal
async function showTeamDetails(teamId) {
    try {
        const team = allTeams.find(t => t.$id === teamId);
        if (!team) return;
        
        elements.modalTeamName.textContent = team.nev;
        elements.modalTeamId.textContent = teamId;
        elements.viewTeamPageBtn.href = `/csapat.html?id=${teamId}`;
        
        // 1. ÖSSZES adat egy API hívással
        const allViews = await databases.listDocuments(
            '68fe32ea0008ab84b709',
            'pageviews',
            [
                Query.equal('teamId', teamId),
                Query.orderAsc('timestamp'), // vagy limit(1000) ha túl sok van
                Query.select(['date', 'timestamp', 'ipAddress']) // Csak szükséges mezők
            ]
        );
        
        const today = new Date().toISOString().split('T')[0];
        const uniqueIPs = new Set();
        let todayViewsCount = 0;
        let firstView = null;
        let lastView = null;
        
        // 2. Feldolgozás memóriában (gyorsabb)
        allViews.documents.forEach((view, index) => {
            // Egyedi IP-k
            if (view.ipAddress && view.ipAddress !== 'unknown') {
                uniqueIPs.add(view.ipAddress);
            }
            
            // Mai megtekintések
            if (view.date === today) {
                todayViewsCount++;
            }
            
            // Első és utolsó
            if (index === 0) firstView = view;
            if (index === allViews.total - 1) lastView = view;
        });
        
        // 3. Modal frissítése
        elements.modalTotalViews.textContent = formatNumber(allViews.total);
        elements.modalUniqueVisitors.textContent = formatNumber(uniqueIPs.size);
        elements.modalViewsToday.textContent = formatNumber(todayViewsCount);
        elements.modalFirstView.textContent = firstView 
            ? formatDate(firstView.timestamp) 
            : '-';
        elements.modalLastView.textContent = lastView 
            ? formatDate(lastView.timestamp) 
            : '-';
        
        // 4. Grafikon (használja a már lekérzett adatokat)
        await renderTeamDetailChartOptimized(teamId, allViews.documents);
        
        // 5. Modal megjelenítése
        elements.modal.classList.add('active');
        
    } catch (error) {
        console.error('Error loading team details:', error);
        showError('Nem sikerült betölteni a csapat részleteit');
    }
}

// Optimalizált grafikon (nem hív API-t, mert már megvannak az adatok)
async function renderTeamDetailChartOptimized(teamId, allViews) {
    // Csoportosítás dátum szerint a már létező adatokból
    const dailyData = {};
    
    // Utolsó 7 nap generálása
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = 0;
    }
    
    // Megszámolás
    allViews.forEach(view => {
        if (dailyData[view.date] !== undefined) {
            dailyData[view.date]++;
        }
    });

    try {
        // Get last 7 days of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const views = await databases.listDocuments(
            '68fe32ea0008ab84b709',
            'pageviews',
            [
                Query.equal('teamId', teamId),
                Query.greaterThanEqual('date', startDate.toISOString().split('T')[0]),
                Query.orderAsc('date')
            ]
        );
        
        // Group by date
        const dailyData = {};
        const dateLabels = [];
        
        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dateLabels.push(formatDate(dateStr));
            dailyData[dateStr] = 0;
        }
        
        // Count views per day
        views.documents.forEach(view => {
            if (dailyData[view.date] !== undefined) {
                dailyData[view.date]++;
            }
        });
        
        // Prepare chart data
        const chartData = Object.values(dailyData);
        
        // Destroy previous chart if exists
        if (chartInstances.teamDetail) {
            chartInstances.teamDetail.destroy();
        }
        
        // Create new chart
        const ctx = elements.teamDetailChart.getContext('2d');
        chartInstances.teamDetail = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Megtekintések',
                    data: chartData,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error rendering team chart:', error);
    }
}

// Initialize traffic chart
function initTrafficChart() {
    const ctx = elements.trafficChart.getContext('2d');
    
    // Sample data - you would replace this with real data
    chartInstances.traffic = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'],
            datasets: [{
                label: 'Megtekintések',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize date
function initDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('current-date').textContent = 
        now.toLocaleDateString('hu-HU', options);
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            // You can implement section switching here
        });
    });
    
    // Refresh top teams
    elements.refreshTopTeamsBtn.addEventListener('click', () => {
        loadTopTeams();
    });
    
    // Team search
    elements.teamSearchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filteredTeams = allTeams.filter(team => 
            team.nev.toLowerCase().includes(searchTerm) ||
            team.email?.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        renderTeamsTable();
    });
    
    // Sort by
    elements.sortBySelect.addEventListener('change', () => {
        renderTeamsTable();
    });
    
    // Pagination
    elements.prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTeamsTable();
        }
    });
    
    elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTeamsTable();
        }
    });
    
    // Modal close
    elements.modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.modal.classList.remove('active');
        });
    });
    
    // Close modal on outside click
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            elements.modal.classList.remove('active');
        }
    });
    
    // Time range change
    elements.timeRangeSelect.addEventListener('change', function() {
        // You would reload chart data here based on selected range
        console.log('Time range changed to:', this.value);
    });
}

// Initialize everything
async function init() {
    console.log('Admin dashboard initializing...');
    
    // Set current date
    initDate();
    
    // Initialize charts
    initTrafficChart();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load data
    await loadOverallStats();
    await loadTopTeams();
    await loadAllTeams();
    
    console.log('Admin dashboard initialized');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);