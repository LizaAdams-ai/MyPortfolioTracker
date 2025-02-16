class PortfolioTracker {
    constructor() {
        this.positions = [];
        this.lastUpdate = null;
        this.priceUpdateInterval = null;
        this.portfolioHistory = [];
        this.portfolioChart = null;
        this.allocationChart = null;
        this.init();
    }

    init() {
        this.loadPositions();
        this.loadPortfolioHistory();
        this.setupEventListeners();
        this.updateSummary();
        this.renderHoldings();
        this.initCharts();
        this.updateCharts();
        this.startPriceUpdates();
    }

    setupEventListeners() {
        const addPositionBtn = document.getElementById('add-position');
        const exportBtn = document.getElementById('export-data');
        const modal = document.getElementById('add-position-modal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        const form = document.getElementById('add-position-form');

        addPositionBtn.addEventListener('click', () => {
            this.showModal();
        });

        exportBtn.addEventListener('click', () => {
            this.exportData();
        });

        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        cancelBtn.addEventListener('click', () => {
            this.hideModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    loadPositions() {
        const saved = localStorage.getItem('portfolio-positions');
        if (saved) {
            this.positions = JSON.parse(saved);
        }
    }

    savePositions() {
        localStorage.setItem('portfolio-positions', JSON.stringify(this.positions));
    }

    loadPortfolioHistory() {
        const saved = localStorage.getItem('portfolio-history');
        if (saved) {
            this.portfolioHistory = JSON.parse(saved);
        }
    }

    savePortfolioHistory() {
        localStorage.setItem('portfolio-history', JSON.stringify(this.portfolioHistory));
    }

    addToHistory() {
        const totalValue = this.positions.reduce((sum, pos) => {
            return sum + (pos.shares * pos.currentPrice);
        }, 0);
        
        const historyEntry = {
            timestamp: new Date().toISOString(),
            value: totalValue
        };
        
        this.portfolioHistory.push(historyEntry);
        
        if (this.portfolioHistory.length > 50) {
            this.portfolioHistory = this.portfolioHistory.slice(-50);
        }
        
        this.savePortfolioHistory();
    }

    addPosition(symbol, shares, avgCost) {
        const position = {
            id: Date.now(),
            symbol: symbol.toUpperCase(),
            shares: parseFloat(shares),
            avgCost: parseFloat(avgCost),
            currentPrice: parseFloat(avgCost) // Start with avg cost as current price
        };
        
        this.positions.push(position);
        this.savePositions();
        this.updateSummary();
        this.renderHoldings();
        this.updateStatistics();
    }

    updateSummary() {
        const totalValue = this.positions.reduce((sum, pos) => {
            return sum + (pos.shares * pos.currentPrice);
        }, 0);

        const totalCost = this.positions.reduce((sum, pos) => {
            return sum + (pos.shares * pos.avgCost);
        }, 0);

        const totalReturn = totalValue - totalCost;
        const returnPercent = totalCost > 0 ? (totalReturn / totalCost * 100) : 0;

        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('daily-change').textContent = '$0.00 (0.00%)'; // Placeholder
        document.getElementById('total-return').textContent = 
            `$${totalReturn.toFixed(2)} (${returnPercent.toFixed(2)}%)`;
    }

    renderHoldings() {
        const holdingsList = document.getElementById('holdings-list');
        
        if (this.positions.length === 0) {
            holdingsList.innerHTML = `
                <div class="empty-state">
                    <p>No positions added yet. Click "Add Position" to get started.</p>
                </div>
            `;
            return;
        }

        holdingsList.innerHTML = this.positions.map(position => {
            const marketValue = position.shares * position.currentPrice;
            const costBasis = position.shares * position.avgCost;
            const gainLoss = marketValue - costBasis;
            const gainLossPercent = (gainLoss / costBasis * 100);
            const gainLossClass = gainLoss >= 0 ? 'positive' : 'negative';

            return `
                <div class="holding-row">
                    <span class="symbol">${position.symbol}</span>
                    <span>${position.shares}</span>
                    <span>$${position.avgCost.toFixed(2)}</span>
                    <span>$${position.currentPrice.toFixed(2)}</span>
                    <span>$${marketValue.toFixed(2)}</span>
                    <span class="${gainLossClass}">$${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)</span>
                    <button class="delete-btn" onclick="portfolioTracker.deletePosition(${position.id})">Delete</button>
                </div>
            `;
        }).join('');
    }

    showModal() {
        const modal = document.getElementById('add-position-modal');
        modal.style.display = 'block';
        document.getElementById('symbol').focus();
    }

    hideModal() {
        const modal = document.getElementById('add-position-modal');
        modal.style.display = 'none';
        this.clearForm();
    }

    clearForm() {
        document.getElementById('symbol').value = '';
        document.getElementById('shares').value = '';
        document.getElementById('avg-cost').value = '';
    }

    handleFormSubmit() {
        const symbol = document.getElementById('symbol').value.trim();
        const shares = document.getElementById('shares').value;
        const avgCost = document.getElementById('avg-cost').value;

        if (symbol && shares && avgCost) {
            this.addPosition(symbol, shares, avgCost);
            this.hideModal();
        }
    }

    startPriceUpdates() {
        this.updatePrices();
        this.priceUpdateInterval = setInterval(() => {
            this.updatePrices();
        }, 30000); // Update every 30 seconds
    }

    updatePrices() {
        if (this.positions.length === 0) return;

        const oldTotal = this.positions.reduce((sum, pos) => sum + (pos.shares * pos.currentPrice), 0);

        this.positions.forEach(position => {
            const volatility = 0.02;
            const changePercent = (Math.random() - 0.5) * volatility;
            position.currentPrice = Math.max(0.01, position.currentPrice * (1 + changePercent));
        });

        const newTotal = this.positions.reduce((sum, pos) => sum + (pos.shares * pos.currentPrice), 0);
        const dailyChange = newTotal - oldTotal;
        const dailyChangePercent = oldTotal > 0 ? (dailyChange / oldTotal * 100) : 0;

        const dailyChangeElement = document.getElementById('daily-change');
        const changeClass = dailyChange >= 0 ? 'positive' : 'negative';
        dailyChangeElement.className = `value ${changeClass}`;
        dailyChangeElement.textContent = `$${dailyChange.toFixed(2)} (${dailyChangePercent.toFixed(2)}%)`;

        this.lastUpdate = new Date();
        this.addToHistory();
        this.savePositions();
        this.updateSummary();
        this.renderHoldings();
        this.updateCharts();
        this.updateStatistics();
    }

    deletePosition(id) {
        if (confirm('Are you sure you want to delete this position?')) {
            this.positions = this.positions.filter(pos => pos.id !== id);
            this.savePositions();
            this.updateSummary();
            this.renderHoldings();
            this.updateCharts();
            this.updateStatistics();
        }
    }

    updateStatistics() {
        if (this.positions.length === 0) {
            document.getElementById('best-performer').textContent = '-';
            document.getElementById('worst-performer').textContent = '-';
            document.getElementById('total-positions').textContent = '0';
            document.getElementById('avg-return').textContent = '0.00%';
            return;
        }

        let bestPosition = this.positions[0];
        let worstPosition = this.positions[0];
        let totalReturn = 0;

        this.positions.forEach(position => {
            const marketValue = position.shares * position.currentPrice;
            const costBasis = position.shares * position.avgCost;
            const gainLossPercent = ((marketValue - costBasis) / costBasis) * 100;
            
            totalReturn += gainLossPercent;

            const bestGainPercent = ((bestPosition.shares * bestPosition.currentPrice - bestPosition.shares * bestPosition.avgCost) / (bestPosition.shares * bestPosition.avgCost)) * 100;
            const worstGainPercent = ((worstPosition.shares * worstPosition.currentPrice - worstPosition.shares * worstPosition.avgCost) / (worstPosition.shares * worstPosition.avgCost)) * 100;

            if (gainLossPercent > bestGainPercent) {
                bestPosition = position;
            }
            if (gainLossPercent < worstGainPercent) {
                worstPosition = position;
            }
        });

        const avgReturn = totalReturn / this.positions.length;

        const bestGainPercent = ((bestPosition.shares * bestPosition.currentPrice - bestPosition.shares * bestPosition.avgCost) / (bestPosition.shares * bestPosition.avgCost)) * 100;
        const worstGainPercent = ((worstPosition.shares * worstPosition.currentPrice - worstPosition.shares * worstPosition.avgCost) / (worstPosition.shares * worstPosition.avgCost)) * 100;

        document.getElementById('best-performer').textContent = `${bestPosition.symbol} (${bestGainPercent.toFixed(2)}%)`;
        document.getElementById('worst-performer').textContent = `${worstPosition.symbol} (${worstGainPercent.toFixed(2)}%)`;
        document.getElementById('total-positions').textContent = this.positions.length.toString();
        document.getElementById('avg-return').textContent = `${avgReturn.toFixed(2)}%`;

        document.getElementById('best-performer').className = 'stat-value positive';
        document.getElementById('worst-performer').className = 'stat-value negative';
        document.getElementById('avg-return').className = `stat-value ${avgReturn >= 0 ? 'positive' : 'negative'}`;
    }

    exportData() {
        if (this.positions.length === 0) {
            alert('No data to export. Add some positions first.');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            summary: {
                totalValue: this.positions.reduce((sum, pos) => sum + (pos.shares * pos.currentPrice), 0),
                totalCost: this.positions.reduce((sum, pos) => sum + (pos.shares * pos.avgCost), 0),
                totalPositions: this.positions.length
            },
            positions: this.positions.map(pos => {
                const marketValue = pos.shares * pos.currentPrice;
                const costBasis = pos.shares * pos.avgCost;
                const gainLoss = marketValue - costBasis;
                const gainLossPercent = (gainLoss / costBasis) * 100;
                
                return {
                    symbol: pos.symbol,
                    shares: pos.shares,
                    avgCost: pos.avgCost,
                    currentPrice: pos.currentPrice,
                    marketValue: marketValue,
                    gainLoss: gainLoss,
                    gainLossPercent: gainLossPercent
                };
            }),
            portfolioHistory: this.portfolioHistory
        };

        const csvContent = this.generateCSV(exportData);
        this.downloadFile(csvContent, 'portfolio-export.csv', 'text/csv');

        const jsonContent = JSON.stringify(exportData, null, 2);
        this.downloadFile(jsonContent, 'portfolio-export.json', 'application/json');
    }

    generateCSV(data) {
        let csv = 'Symbol,Shares,Avg Cost,Current Price,Market Value,Gain/Loss,Gain/Loss %\n';
        
        data.positions.forEach(pos => {
            csv += `${pos.symbol},${pos.shares},${pos.avgCost.toFixed(2)},${pos.currentPrice.toFixed(2)},${pos.marketValue.toFixed(2)},${pos.gainLoss.toFixed(2)},${pos.gainLossPercent.toFixed(2)}%\n`;
        });
        
        csv += '\n\nPortfolio Summary\n';
        csv += `Total Value,${data.summary.totalValue.toFixed(2)}\n`;
        csv += `Total Cost,${data.summary.totalCost.toFixed(2)}\n`;
        csv += `Total Positions,${data.summary.totalPositions}\n`;
        csv += `Export Date,${data.exportDate}\n`;
        
        return csv;
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    initCharts() {
        const portfolioCtx = document.getElementById('portfolioChart').getContext('2d');
        const allocationCtx = document.getElementById('allocationChart').getContext('2d');

        this.portfolioChart = new Chart(portfolioCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        this.allocationChart = new Chart(allocationCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#3498db',
                        '#e74c3c',
                        '#f39c12',
                        '#27ae60',
                        '#9b59b6',
                        '#34495e',
                        '#1abc9c',
                        '#e67e22'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return {
                                            text: `${label} (${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            strokeStyle: data.datasets[0].backgroundColor[i],
                                            lineWidth: 0,
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        if (this.portfolioChart && this.portfolioHistory.length > 0) {
            const labels = this.portfolioHistory.map(entry => {
                const date = new Date(entry.timestamp);
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            });
            const data = this.portfolioHistory.map(entry => entry.value);

            this.portfolioChart.data.labels = labels;
            this.portfolioChart.data.datasets[0].data = data;
            this.portfolioChart.update('none');
        }

        if (this.allocationChart && this.positions.length > 0) {
            const labels = this.positions.map(pos => pos.symbol);
            const data = this.positions.map(pos => pos.shares * pos.currentPrice);

            this.allocationChart.data.labels = labels;
            this.allocationChart.data.datasets[0].data = data;
            this.allocationChart.update('none');
        }
    }
}

let portfolioTracker;

document.addEventListener('DOMContentLoaded', () => {
    portfolioTracker = new PortfolioTracker();
});