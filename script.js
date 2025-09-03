class PortfolioTracker {
    constructor() {
        this.positions = [];
        this.init();
    }

    init() {
        this.loadPositions();
        this.setupEventListeners();
        this.updateSummary();
        this.renderHoldings();
    }

    setupEventListeners() {
        const addPositionBtn = document.getElementById('add-position');
        addPositionBtn.addEventListener('click', () => {
            this.showAddPositionModal();
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

    showAddPositionModal() {
        const symbol = prompt('Enter stock symbol (e.g., AAPL):');
        if (!symbol) return;

        const shares = prompt('Enter number of shares:');
        if (!shares || isNaN(shares)) return;

        const avgCost = prompt('Enter average cost per share:');
        if (!avgCost || isNaN(avgCost)) return;

        this.addPosition(symbol, shares, avgCost);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PortfolioTracker();
});