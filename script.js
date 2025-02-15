class PortfolioTracker {
    constructor() {
        this.positions = [];
        this.lastUpdate = null;
        this.priceUpdateInterval = null;
        this.init();
    }

    init() {
        this.loadPositions();
        this.setupEventListeners();
        this.updateSummary();
        this.renderHoldings();
        this.startPriceUpdates();
    }

    setupEventListeners() {
        const addPositionBtn = document.getElementById('add-position');
        const modal = document.getElementById('add-position-modal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        const form = document.getElementById('add-position-form');

        addPositionBtn.addEventListener('click', () => {
            this.showModal();
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
        this.savePositions();
        this.updateSummary();
        this.renderHoldings();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PortfolioTracker();
});