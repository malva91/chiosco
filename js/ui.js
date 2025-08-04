// UI Management Functions
export class UIManager {
    constructor() {
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        return {
            // Navigation
            navBtns: document.querySelectorAll('.nav-btn'),
            sections: document.querySelectorAll('.section'),
            
            // Form
            form: document.getElementById('incassoForm'),
            dataInput: document.getElementById('data'),
            contantiInput: document.getElementById('contanti'),
            pos1Input: document.getElementById('pos1'),
            pos2Input: document.getElementById('pos2'),
            ticketInput: document.getElementById('ticket'),
            chiusuraInput: document.getElementById('chiusura'),
            resetBtn: document.getElementById('resetForm'),
            
            // Calculations
            calcTotale: document.getElementById('calcTotale'),
            calcNero: document.getElementById('calcNero'),
            calcBianco: document.getElementById('calcBianco'),
            calcDeposito: document.getElementById('calcDeposito'),
            
            // Filters
            filterFrom: document.getElementById('filterFrom'),
            filterTo: document.getElementById('filterTo'),
            applyFiltersBtn: document.getElementById('applyFilters'),
            clearFiltersBtn: document.getElementById('clearFilters'),
            
            // Export
            exportBtn: document.getElementById('exportExcel'),
            
            // Stats
            statTotale: document.getElementById('statTotale'),
            statMedia: document.getElementById('statMedia'),
            statNero: document.getElementById('statNero'),
            statBianco: document.getElementById('statBianco'),
            
            // Table
            tableBody: document.getElementById('tableBody'),
            tableHeaders: document.querySelectorAll('[data-sort]'),
            
            // Modal
            modal: document.getElementById('confirmModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalMessage: document.getElementById('modalMessage'),
            closeModal: document.getElementById('closeModal'),
            cancelAction: document.getElementById('cancelAction'),
            confirmAction: document.getElementById('confirmAction'),
            
            // Notification
            notification: document.getElementById('notification'),
            
            // Loading
            loading: document.getElementById('loading')
        };
    }
    
    setupEventListeners() {
        // Modal close events
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => this.hideModal());
        }
        if (this.elements.cancelAction) {
            this.elements.cancelAction.addEventListener('click', () => this.hideModal());
        }
        
        // Close modal on outside click
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.hideModal();
                }
            });
        }
    }
    
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('show');
        }
    }
    
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.remove('show');
        }
    }
    
    showNotification(message, type = 'info') {
        if (!this.elements.notification) return;
        
        const notification = this.elements.notification;
        const icon = notification.querySelector('.notification-icon');
        const messageEl = notification.querySelector('.notification-message');
        
        if (!icon || !messageEl) return;
        
        // Reset classes
        notification.className = 'notification';
        notification.classList.add(type);
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        icon.className = `notification-icon ${icons[type]}`;
        messageEl.textContent = message;
        
        // Show notification
        notification.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    showModal(title, message, onConfirm) {
        if (!this.elements.modal) return;
        
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = title;
        }
        if (this.elements.modalMessage) {
            this.elements.modalMessage.textContent = message;
        }
        
        this.elements.modal.classList.add('active');
        
        // Set up confirm action
        if (this.elements.confirmAction) {
            this.elements.confirmAction.onclick = () => {
                this.elements.modal.classList.remove('active');
                if (onConfirm) onConfirm();
            };
        }
    }
    
    hideModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('active');
        }
    }
    
    updateCalculationDisplay(calculations) {
        const { totale, nero, bianco, daDepositare } = calculations;
        
        if (this.elements.calcTotale) {
            this.elements.calcTotale.textContent = this.formatCurrency(totale);
        }
        if (this.elements.calcNero) {
            this.elements.calcNero.textContent = this.formatCurrency(nero);
        }
        if (this.elements.calcBianco) {
            this.elements.calcBianco.textContent = this.formatCurrency(bianco);
        }
        if (this.elements.calcDeposito) {
            this.elements.calcDeposito.textContent = this.formatCurrency(daDepositare);
        }
    }
    
    createDeleteButton(recordId, onDelete) {
        const button = document.createElement('button');
        button.className = 'btn btn-danger btn-sm';
        button.innerHTML = '<i class="fas fa-trash"></i>';
        button.addEventListener('click', () => onDelete(recordId));
        return button;
    }
    
    formatCurrency(amount) {
        try {
            return new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR'
            }).format(amount || 0);
        } catch (error) {
            return `€ ${(amount || 0).toFixed(2)}`;
        }
    }
}