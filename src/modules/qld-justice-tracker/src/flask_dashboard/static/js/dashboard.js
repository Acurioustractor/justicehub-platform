// Initialize Socket.IO connection
const socket = io();

// Chart instances
let spendingChart = null;
let hiddenCostsChart = null;

// CountUp instances for animated numbers
const counters = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    initializeSocketHandlers();
    fetchInitialData();
});

// Initialize charts
function initializeCharts() {
    // Spending allocation chart
    const spendingCtx = document.getElementById('spending-chart').getContext('2d');
    spendingChart = new Chart(spendingCtx, {
        type: 'doughnut',
        data: {
            labels: ['Detention (90.6%)', 'Community Programs (9.4%)'],
            datasets: [{
                data: [90.6, 9.4],
                backgroundColor: ['#e74c3c', '#27ae60'],
                borderWidth: 0,
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return label + ': $' + formatNumber(Math.round(value * 5000000));
                        }
                    }
                }
            }
        }
    });

    // Hidden costs comparison chart
    const hiddenCtx = document.getElementById('hidden-costs-chart').getContext('2d');
    hiddenCostsChart = new Chart(hiddenCtx, {
        type: 'bar',
        data: {
            labels: ['Official Cost', 'Family Cost', 'True Total'],
            datasets: [{
                label: 'Monthly Cost',
                data: [26048, 2350, 28398],
                backgroundColor: ['#e74c3c', '#f39c12', '#c0392b'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + formatNumber(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

// Socket.IO handlers
function initializeSocketHandlers() {
    socket.on('connect', () => {
        console.log('Connected to dashboard server');
    });

    socket.on('data_update', (data) => {
        updateDashboard(data);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Fetch initial data
async function fetchInitialData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
}

// Update dashboard with new data
function updateDashboard(data) {
    // Update big numbers with animation
    updateCounter('total-budget', data.spending.total_budget, '$');
    updateCounter('detention-spending', data.spending.detention_total, '$');
    updateCounter('community-spending', data.spending.community_total, '$');
    updateCounter('cost-ratio', data.spending.cost_ratio, '', 'x');
    
    // Update percentages
    document.getElementById('detention-percentage').textContent = data.spending.detention_percentage.toFixed(1);
    document.getElementById('community-percentage').textContent = data.spending.community_percentage.toFixed(1);
    
    // Update daily costs
    document.getElementById('detention-daily').textContent = data.spending.detention_daily_cost;
    document.getElementById('community-daily').textContent = data.spending.community_daily_cost;
    
    // Update Indigenous disparity
    const indigenousBar = document.getElementById('indigenous-detention-bar');
    indigenousBar.style.width = data.indigenous.detention_percentage + '%';
    document.getElementById('indigenous-detention-percent').textContent = 
        data.indigenous.detention_percentage + '%';
    
    // Update overrepresentation factor
    document.getElementById('overrep-factor').textContent = 
        data.indigenous.min_factor + '-' + data.indigenous.max_factor + 'x';
    
    // Update charts
    updateCharts(data);
    
    // Update transparency score
    updateTransparencyScore(data.transparency);
    
    // Update activity feed
    updateActivityFeed(data.documents);
}

// Update counter with animation
function updateCounter(elementId, value, prefix = '', suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Create or update CountUp instance
    if (!counters[elementId]) {
        counters[elementId] = new CountUp.CountUp(elementId, value, {
            startVal: 0,
            duration: 2,
            separator: ',',
            prefix: prefix,
            suffix: suffix
        });
        counters[elementId].start();
    } else {
        counters[elementId].update(value);
    }
}

// Update charts with new data
function updateCharts(data) {
    // Update spending chart
    if (spendingChart && data.spending) {
        spendingChart.data.datasets[0].data = [
            data.spending.detention_percentage,
            data.spending.community_percentage
        ];
        spendingChart.data.labels = [
            `Detention (${data.spending.detention_percentage.toFixed(1)}%)`,
            `Community Programs (${data.spending.community_percentage.toFixed(1)}%)`
        ];
        spendingChart.update('none'); // Update without animation for real-time feel
    }
}

// Update transparency score
function updateTransparencyScore(transparency) {
    // Update overall score
    const scoreElement = document.querySelector('.score-number');
    const gradeElement = document.querySelector('.score-grade');
    
    if (scoreElement && gradeElement) {
        scoreElement.textContent = transparency.overall_score;
        gradeElement.textContent = transparency.grade;
    }
    
    // Update category scores
    Object.entries(transparency.categories).forEach(([key, data]) => {
        const scoreBar = document.getElementById(key.replace('_', '-') + '-score');
        if (scoreBar) {
            scoreBar.style.width = data.score + '%';
        }
    });
}

// Update activity feed
function updateActivityFeed(documents) {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;
    
    // Clear existing items
    feed.innerHTML = '';
    
    // Add recent documents
    documents.recent.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-date">${doc.date}</div>
            <div class="activity-content">
                <div class="activity-title">${doc.title}</div>
                <div class="activity-type">${doc.type.replace('_', ' ')}</div>
            </div>
        `;
        feed.appendChild(item);
    });
    
    // If no documents, show message
    if (documents.recent.length === 0) {
        feed.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No recent parliamentary activity</p>';
    }
}

// Format number with commas
function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Request updates every 30 seconds
setInterval(() => {
    socket.emit('request_update');
}, 30000);

// Handle window resize for responsive charts
window.addEventListener('resize', () => {
    if (spendingChart) spendingChart.resize();
    if (hiddenCostsChart) hiddenCostsChart.resize();
});