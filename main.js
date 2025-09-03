// Main Application Entry Point
import { UIManager } from './js/ui.js';
import { Calculator } from './js/calculations.js';
import { ChartManager } from './js/charts.js';
import { DatabaseManager } from './js/database.js';
import { utils } from './js/utils.js';

// Application Class
class ChioscoApp {
    constructor() {
        this.currentData = [];
        this.currentSort = { field: 'data', direction: 'desc' };
        
        // Initialize managers
        this.ui = new UIManager();
        this.calculator = new Calculator(this.ui);
        this.charts = new ChartManager();
        this.database = new DatabaseManager(this.ui);
        
        this.init();
    }
    
    async init() {
        try {
            // Set default date to today
            if (this.ui.elements.dataInput) {
                this.ui.elements.dataInput.value = new Date().toISOString().split('T')[0];
            }
            
            // Initialize calculations display
            this.calculator.updateDisplay();
            
            // Initialize event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Show success message only if there are no errors
            this.ui.showNotification('App caricata', 'success');
            
        } catch (error) {
            console.error('Errore nell\'inizializzazione:', error);
            this.ui.showNotification('Errore inizializzazione', 'error');
        }
    }
    
    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Form events
        this.setupFormEvents();
        
        // Table events
        this.setupTableEvents();
        
        // Filter events
        this.setupFilterEvents();
        
        // Export events
        this.setupExportEvents();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    setupNavigation() {
        this.ui.elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetSection = btn.dataset.section;
                this.showSection(targetSection);
                
                // Update active nav button
                this.ui.elements.navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    setupFormEvents() {
        // Form inputs for real-time calculation
        const inputs = [
            this.ui.elements.contantiInput,
            this.ui.elements.pos1Input,
            this.ui.elements.pos2Input,
            this.ui.elements.ticketInput,
            this.ui.elements.chiusuraInput
        ].filter(input => input);
        
        const debouncedUpdate = utils.debounce(() => {
            this.calculator.updateDisplay();
        }, 300);
        
        inputs.forEach(input => {
            input.addEventListener('input', debouncedUpdate);
        });
        
        // Form submission
        if (this.ui.elements.form) {
            this.ui.elements.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmit();
            });
        }
        
        // Reset form
        if (this.ui.elements.resetBtn) {
            this.ui.elements.resetBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
    }
    
    setupTableEvents() {
        this.ui.elements.tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                this.sortTable(header.dataset.sort);
            });
        });
    }
    
    setupFilterEvents() {
        if (this.ui.elements.applyFiltersBtn) {
            this.ui.elements.applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        if (this.ui.elements.clearFiltersBtn) {
            this.ui.elements.clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }
    
    setupExportEvents() {
        if (this.ui.elements.exportBtn) {
            this.ui.elements.exportBtn.addEventListener('click', () => {
                this.exportToExcel();
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape' && this.ui.elements.modal?.classList.contains('active')) {
                this.ui.hideModal();
            }
            
            // Ctrl+S to save form (if in dashboard)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const activeSection = document.querySelector('.section.active');
                if (activeSection && activeSection.id === 'dashboard') {
                    this.handleFormSubmit();
                }
            }
            
            // Ctrl+E to export (if in analytics)
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                const activeSection = document.querySelector('.section.active');
                if (activeSection && activeSection.id === 'analytics') {
                    this.exportToExcel();
                }
            }
        });
    }
    
    showSection(sectionId) {
        this.ui.elements.sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // If showing analytics, update charts
            if (sectionId === 'analytics') {
                setTimeout(() => {
                    this.charts.updateAllCharts(this.currentData);
                }, 100);
            }
        }
    }
    
    async handleFormSubmit() {
        if (!this.validateForm()) {
            return;
        }
        
        // Check if we're updating an existing record
        const selectedDate = this.ui.elements.dataInput.value;
        const existingRecord = this.currentData.find(record => record.data === selectedDate);
        
        if (existingRecord) {
            const shouldUpdate = await this.confirmUpdate(selectedDate);
            if (!shouldUpdate) {
                return;
            }
        }
        
        const calc = this.calculator.calculate();
        const formData = {
            data: this.ui.elements.dataInput.value,
            contanti: utils.parseFloat(this.ui.elements.contantiInput.value),
            pos1: utils.parseFloat(this.ui.elements.pos1Input.value),
            pos2: utils.parseFloat(this.ui.elements.pos2Input.value),
            ticket: utils.parseFloat(this.ui.elements.ticketInput.value),
            chiusura: utils.parseFloat(this.ui.elements.chiusuraInput.value),
            ...calc
        };
        
        const success = await this.database.save(formData);
        if (success) {
            this.resetForm();
            await this.loadData();
        }
    }
    
    validateForm() {
        const data = this.ui.elements.dataInput?.value;
        
        if (!data) {
            this.ui.showNotification('La data è obbligatoria', 'error');
            this.ui.elements.dataInput?.focus();
            return false;
        }
        
        const inputs = [
            this.ui.elements.contantiInput,
            this.ui.elements.pos1Input,
            this.ui.elements.pos2Input,
            this.ui.elements.ticketInput,
            this.ui.elements.chiusuraInput
        ].filter(input => input);
        
        const hasValue = inputs.some(input => input.value && utils.parseFloat(input.value) > 0);
        
        if (!hasValue) {
            this.ui.showNotification('Inserire almeno un valore', 'error');
            return false;
        }
        
        return this.calculator.validateInputs();
    }
    
    resetForm() {
        if (this.ui.elements.form) {
            this.ui.elements.form.reset();
        }
        if (this.ui.elements.dataInput) {
            this.ui.elements.dataInput.value = new Date().toISOString().split('T')[0];
        }
        this.calculator.updateDisplay();
    }
    
    async loadData() {
        this.currentData = await this.database.loadAll();
        this.renderTable();
        this.updateStats();
        this.charts.updateAllCharts(this.currentData);
    }
    
    renderTable(data = this.currentData) {
        const tbody = this.ui.elements.tableBody;
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nessun dato disponibile
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach(record => {
            const row = document.createElement('tr');
            
            // Create cells
            const cells = [
                utils.formatDate(record.data),
                utils.formatCurrency(record.contanti),
                utils.formatCurrency(record.pos1),
                utils.formatCurrency(record.pos2),
                utils.formatCurrency(record.ticket),
                utils.formatCurrency(record.chiusura),
                `<strong>${utils.formatCurrency(record.totale)}</strong>`,
                `<strong >${utils.formatCurrency(record.nero)}</strong>`,
                `<strong >${utils.formatCurrency(record.bianco)}</strong>`,
                `<strong >${utils.formatCurrency(record.daDepositare)}</strong>`
            ];
            
            // Add data cells
            cells.forEach(cellContent => {
                const cell = document.createElement('td');
                cell.innerHTML = cellContent;
                row.appendChild(cell);
            });
            
            // Add actions cell
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions';
            const deleteBtn = this.ui.createDeleteButton(record.id, (id) => this.confirmDelete(id));
            actionsCell.appendChild(deleteBtn);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });
    }
    
    sortTable(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        
        // Update header classes
        this.ui.elements.tableHeaders.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === field) {
                header.classList.add(`sort-${this.currentSort.direction}`);
            }
        });
        
        // Sort data
        const sortedData = [...this.currentData].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle different data types
            if (field === 'data') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.currentSort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        this.renderTable(sortedData);
    }
    
    updateStats() {
        if (this.currentData.length === 0) {
            if (this.ui.elements.statTotale) this.ui.elements.statTotale.textContent = utils.formatCurrency(0);
            if (this.ui.elements.statMedia) this.ui.elements.statMedia.textContent = utils.formatCurrency(0);
            if (this.ui.elements.statNero) this.ui.elements.statNero.textContent = utils.formatCurrency(0);
            if (this.ui.elements.statBianco) this.ui.elements.statBianco.textContent = utils.formatCurrency(0);
            return;
        }
        
        const totale = this.currentData.reduce((sum, record) => sum + record.totale, 0);
        const nero = this.currentData.reduce((sum, record) => sum + record.nero, 0);
        const bianco = this.currentData.reduce((sum, record) => sum + record.bianco, 0);
        const media = totale / this.currentData.length;
        
        if (this.ui.elements.statTotale) this.ui.elements.statTotale.textContent = utils.formatCurrency(totale);
        if (this.ui.elements.statMedia) this.ui.elements.statMedia.textContent = utils.formatCurrency(media);
        if (this.ui.elements.statNero) this.ui.elements.statNero.textContent = utils.formatCurrency(nero);
        if (this.ui.elements.statBianco) this.ui.elements.statBianco.textContent = utils.formatCurrency(bianco);
    }
    
    applyFilters() {
        const fromDate = this.ui.elements.filterFrom?.value;
        const toDate = this.ui.elements.filterTo?.value;
        
        let filteredData = [...this.currentData];
        
        if (fromDate) {
            filteredData = filteredData.filter(record => record.data >= fromDate);
        }
        
        if (toDate) {
            filteredData = filteredData.filter(record => record.data <= toDate);
        }
        
        this.renderTable(filteredData);
        this.updateStatsForData(filteredData);
        this.ui.showNotification(`${filteredData.length} record trovati`, 'info');
    }
    
    clearFilters() {
        if (this.ui.elements.filterFrom) this.ui.elements.filterFrom.value = '';
        if (this.ui.elements.filterTo) this.ui.elements.filterTo.value = '';
        this.renderTable();
        this.updateStats();
        this.ui.showNotification('Filtri reset', 'info');
    }
    
    updateStatsForData(data) {
        if (data.length === 0) {
            if (this.ui.elements.statTotale) this.ui.elements.statTotale.textContent = utils.formatCurrency(0);
            if (this.ui.elements.statMedia) this.ui.elements.statMedia.textContent = utils.formatCurrency(0);
            if (this.ui.elements.statNero) this.ui.elements.statNero.textContent = utils.formatCurrency(0);
            if (this.ui.elements.statBianco) this.ui.elements.statBianco.textContent = utils.formatCurrency(0);
        } else {
            const totale = data.reduce((sum, record) => sum + record.totale, 0);
            const nero = data.reduce((sum, record) => sum + record.nero, 0);
            const bianco = data.reduce((sum, record) => sum + record.bianco, 0);
            const media = totale / data.length;
            
            if (this.ui.elements.statTotale) this.ui.elements.statTotale.textContent = utils.formatCurrency(totale);
            if (this.ui.elements.statMedia) this.ui.elements.statMedia.textContent = utils.formatCurrency(media);
            if (this.ui.elements.statNero) this.ui.elements.statNero.textContent = utils.formatCurrency(nero);
            if (this.ui.elements.statBianco) this.ui.elements.statBianco.textContent = utils.formatCurrency(bianco);
        }
    }
    
    confirmDelete(id) {
        this.ui.showModal(
            'Conferma Eliminazione',
            'Sei sicuro di voler eliminare questo record? Questa azione non può essere annullata.',
            async () => {
                const success = await this.database.delete(id);
                if (success) {
                    await this.loadData();
                }
            }
        );
    }
    
    confirmUpdate(date) {
        return new Promise((resolve) => {
            this.ui.showModal(
                'Record Esistente',
                `Esiste già un record per la data ${utils.formatDate(date)}. Vuoi sostituirlo con i nuovi dati?`,
                () => resolve(true)
            );
            
            // Override cancel action to resolve false
            if (this.ui.elements.cancelAction) {
                const originalCancel = this.ui.elements.cancelAction.onclick;
                this.ui.elements.cancelAction.onclick = () => {
                    this.ui.hideModal();
                    resolve(false);
                };
                
                // Restore original cancel after this operation
                setTimeout(() => {
                    if (this.ui.elements.cancelAction) {
                        this.ui.elements.cancelAction.onclick = originalCancel;
                    }
                }, 100);
            }
        });
    }
    
    exportToExcel() {
        if (this.currentData.length === 0) {
            this.ui.showNotification('Nessun dato da esportare', 'warning');
            return;
        }
        
        try {
            // Prepare data for export
            const exportData = this.currentData.map(record => ({
                'Data': utils.formatDate(record.data),
                'Contanti': record.contanti,
                'POS 1': record.pos1,
                'POS 2': record.pos2,
                'Ticket': record.ticket,
                'Chiusura': record.chiusura,
                'Totale': record.totale,
                'Nero': record.nero,
                'Bianco': record.bianco,
                'Da Depositare': record.daDepositare
            }));
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Set column widths
            ws['!cols'] = [
                { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
                { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, 'Incassi');
            
            // Generate filename with current date
            const filename = `incassi_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Save file
            XLSX.writeFile(wb, filename);
            
            this.ui.showNotification('Excel esportato', 'success');
            
        } catch (error) {
            console.error('Errore nell\'esportazione:', error);
            this.ui.showNotification('Errore esportazione', 'error');
        }
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new ChioscoApp();
    // Make app globally available for any remaining onclick handlers
    window.app = app;
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (app) {
        app.ui.showNotification('Online', 'success');
    }
});

window.addEventListener('offline', () => {
    if (app) {
        app.ui.showNotification('Offline', 'warning');
    }
});

// Performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
});