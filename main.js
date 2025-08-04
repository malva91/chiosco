// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB_6uLUWKa8ag52VBQ0R1tGA1J_yii0Mrg",
    authDomain: "chiosco-6e4e1.firebaseapp.com",
    projectId: "chiosco-6e4e1",
    storageBucket: "chiosco-6e4e1.firebasestorage.app",
    messagingSenderId: "623725971757",
    appId: "1:623725971757:web:ff663aa3d278d52359aba4",
    measurementId: "G-CC45E9DWR7"
};

// Inizializzazione Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variabili globali
let currentData = [];
let currentSort = { field: 'data', direction: 'desc' };
let charts = {};

// Elementi DOM
const elements = {
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

// Utility Functions
const utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    },
    
    formatDate: (date) => {
        return new Intl.DateFormat('it-IT').format(new Date(date));
    },
    
    parseFloat: (value) => {
        return parseFloat(value) || 0;
    },
    
    showLoading: () => {
        elements.loading.classList.add('show');
    },
    
    hideLoading: () => {
        elements.loading.classList.remove('show');
    },
    
    showNotification: (message, type = 'info') => {
        const notification = elements.notification;
        const icon = notification.querySelector('.notification-icon');
        const messageEl = notification.querySelector('.notification-message');
        
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
    },
    
    showModal: (title, message, onConfirm) => {
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
        elements.modal.classList.add('active');
        
        // Set up confirm action
        elements.confirmAction.onclick = () => {
            elements.modal.classList.remove('active');
            if (onConfirm) onConfirm();
        };
    },
    
    hideModal: () => {
        elements.modal.classList.remove('active');
    }
};

// Calculation Functions
const calculations = {
    calculate: () => {
        const contanti = utils.parseFloat(elements.contantiInput.value);
        const pos1 = utils.parseFloat(elements.pos1Input.value);
        const pos2 = utils.parseFloat(elements.pos2Input.value);
        const ticket = utils.parseFloat(elements.ticketInput.value);
        const chiusura = utils.parseFloat(elements.chiusuraInput.value);
        
        // Calcoli secondo le formule specificate
        const totale = contanti + pos1 + pos2 + ticket;
        const nero = totale - chiusura;
        const bianco = totale - nero;
        const daDepositare = chiusura - pos1 - pos2 - ticket;
        
        return {
            totale,
            nero,
            bianco,
            daDepositare
        };
    },
    
    updateDisplay: () => {
        const calc = calculations.calculate();
        
        elements.calcTotale.textContent = utils.formatCurrency(calc.totale);
        elements.calcNero.textContent = utils.formatCurrency(calc.nero);
        elements.calcBianco.textContent = utils.formatCurrency(calc.bianco);
        elements.calcDeposito.textContent = utils.formatCurrency(calc.daDepositare);
        
        // Add visual feedback for negative values
        elements.calcNero.style.color = calc.nero < 0 ? '#ef4444' : '#ef4444';
        elements.calcDeposito.style.color = calc.daDepositare < 0 ? '#ef4444' : '#f59e0b';
    }
};

// Database Functions
const database = {
    save: async (data) => {
        try {
            utils.showLoading();
            
            const docData = {
                ...data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('incassi').add(docData);
            utils.showNotification('Incasso salvato con successo!', 'success');
            
            // Reset form and reload data
            elements.form.reset();
            elements.dataInput.value = new Date().toISOString().split('T')[0];
            calculations.updateDisplay();
            await database.loadAll();
            
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            utils.showNotification('Errore nel salvataggio dei dati', 'error');
        } finally {
            utils.hideLoading();
        }
    },
    
    loadAll: async () => {
        try {
            utils.showLoading();
            
            const snapshot = await db.collection('incassi')
                .orderBy('data', 'desc')
                .get();
            
            currentData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            table.render();
            analytics.updateStats();
            analytics.updateCharts();
            
        } catch (error) {
            console.error('Errore nel caricamento:', error);
            utils.showNotification('Errore nel caricamento dei dati', 'error');
        } finally {
            utils.hideLoading();
        }
    },
    
    delete: async (id) => {
        try {
            utils.showLoading();
            
            await db.collection('incassi').doc(id).delete();
            utils.showNotification('Record eliminato con successo!', 'success');
            
            await database.loadAll();
            
        } catch (error) {
            console.error('Errore nell\'eliminazione:', error);
            utils.showNotification('Errore nell\'eliminazione del record', 'error');
        } finally {
            utils.hideLoading();
        }
    }
};

// Table Functions
const table = {
    render: (data = currentData) => {
        const tbody = elements.tableBody;
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
            row.innerHTML = `
                <td>${utils.formatDate(record.data)}</td>
                <td>${utils.formatCurrency(record.contanti)}</td>
                <td>${utils.formatCurrency(record.pos1)}</td>
                <td>${utils.formatCurrency(record.pos2)}</td>
                <td>${utils.formatCurrency(record.ticket)}</td>
                <td>${utils.formatCurrency(record.chiusura)}</td>
                <td><strong>${utils.formatCurrency(record.totale)}</strong></td>
                <td style="color: var(--nero-color)"><strong>${utils.formatCurrency(record.nero)}</strong></td>
                <td style="color: var(--bianco-color)"><strong>${utils.formatCurrency(record.bianco)}</strong></td>
                <td style="color: var(--deposito-color)"><strong>${utils.formatCurrency(record.daDepositare)}</strong></td>
                <td class="actions">
                    <button class="btn btn-danger btn-sm" onclick="table.confirmDelete('${record.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },
    
    sort: (field) => {
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = 'asc';
        }
        
        // Update header classes
        elements.tableHeaders.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === field) {
                header.classList.add(`sort-${currentSort.direction}`);
            }
        });
        
        // Sort data
        const sortedData = [...currentData].sort((a, b) => {
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
            
            if (currentSort.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        table.render(sortedData);
    },
    
    confirmDelete: (id) => {
        utils.showModal(
            'Conferma Eliminazione',
            'Sei sicuro di voler eliminare questo record? Questa azione non può essere annullata.',
            () => database.delete(id)
        );
    }
};

// Analytics Functions
const analytics = {
    updateStats: () => {
        if (currentData.length === 0) {
            elements.statTotale.textContent = utils.formatCurrency(0);
            elements.statMedia.textContent = utils.formatCurrency(0);
            elements.statNero.textContent = utils.formatCurrency(0);
            elements.statBianco.textContent = utils.formatCurrency(0);
            return;
        }
        
        const totale = currentData.reduce((sum, record) => sum + record.totale, 0);
        const nero = currentData.reduce((sum, record) => sum + record.nero, 0);
        const bianco = currentData.reduce((sum, record) => sum + record.bianco, 0);
        const media = totale / currentData.length;
        
        elements.statTotale.textContent = utils.formatCurrency(totale);
        elements.statMedia.textContent = utils.formatCurrency(media);
        elements.statNero.textContent = utils.formatCurrency(nero);
        elements.statBianco.textContent = utils.formatCurrency(bianco);
    },
    
    updateCharts: () => {
        analytics.createPieChart();
        analytics.createBarChart();
        analytics.createLineChart();
    },
    
    createPieChart: () => {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        if (charts.pie) {
            charts.pie.destroy();
        }
        
        if (currentData.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        const contanti = currentData.reduce((sum, record) => sum + record.contanti, 0);
        const pos1 = currentData.reduce((sum, record) => sum + record.pos1, 0);
        const pos2 = currentData.reduce((sum, record) => sum + record.pos2, 0);
        const ticket = currentData.reduce((sum, record) => sum + record.ticket, 0);
        
        charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Contanti', 'POS 1', 'POS 2', 'Ticket'],
                datasets: [{
                    data: [contanti, pos1, pos2, ticket],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const value = utils.formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    createBarChart: () => {
        const ctx = document.getElementById('barChart');
        if (!ctx) return;
        
        if (charts.bar) {
            charts.bar.destroy();
        }
        
        if (currentData.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        const nero = currentData.reduce((sum, record) => sum + record.nero, 0);
        const bianco = currentData.reduce((sum, record) => sum + record.bianco, 0);
        
        charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Nero', 'Bianco'],
                datasets: [{
                    data: [nero, bianco],
                    backgroundColor: ['#ef4444', '#10b981'],
                    borderWidth: 2,
                    borderColor: '#1e293b',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#cbd5e1',
                            callback: function(value) {
                                return utils.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    },
    
    createLineChart: () => {
        const ctx = document.getElementById('lineChart');
        if (!ctx) return;
        
        if (charts.line) {
            charts.line.destroy();
        }
        
        if (currentData.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        // Group data by month
        const monthlyData = {};
        currentData.forEach(record => {
            const date = new Date(record.data);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    totale: 0,
                    nero: 0,
                    bianco: 0,
                    count: 0
                };
            }
            
            monthlyData[monthKey].totale += record.totale;
            monthlyData[monthKey].nero += record.nero;
            monthlyData[monthKey].bianco += record.bianco;
            monthlyData[monthKey].count++;
        });
        
        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            return new Date(year, monthNum - 1).toLocaleDateString('it-IT', { 
                month: 'short', 
                year: 'numeric' 
            });
        });
        
        const totaleData = sortedMonths.map(month => monthlyData[month].totale);
        const neroData = sortedMonths.map(month => monthlyData[month].nero);
        const biancoData = sortedMonths.map(month => monthlyData[month].bianco);
        
        charts.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Totale',
                        data: totaleData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Nero',
                        data: neroData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Bianco',
                        data: biancoData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#cbd5e1',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#cbd5e1',
                            callback: function(value) {
                                return utils.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: '#334155'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    }
};

// Export Functions
const exportFunctions = {
    toExcel: () => {
        if (currentData.length === 0) {
            utils.showNotification('Nessun dato da esportare', 'warning');
            return;
        }
        
        try {
            // Prepare data for export
            const exportData = currentData.map(record => ({
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
            
            // Style the worksheet
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Set column widths
            ws['!cols'] = [
                { width: 12 }, // Data
                { width: 12 }, // Contanti
                { width: 12 }, // POS 1
                { width: 12 }, // POS 2
                { width: 12 }, // Ticket
                { width: 12 }, // Chiusura
                { width: 12 }, // Totale
                { width: 12 }, // Nero
                { width: 12 }, // Bianco
                { width: 15 }  // Da Depositare
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, 'Incassi');
            
            // Generate filename with current date
            const filename = `incassi_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Save file
            XLSX.writeFile(wb, filename);
            
            utils.showNotification('File Excel esportato con successo!', 'success');
            
        } catch (error) {
            console.error('Errore nell\'esportazione:', error);
            utils.showNotification('Errore nell\'esportazione del file', 'error');
        }
    }
};

// Filter Functions
const filters = {
    apply: () => {
        const fromDate = elements.filterFrom.value;
        const toDate = elements.filterTo.value;
        
        let filteredData = [...currentData];
        
        if (fromDate) {
            filteredData = filteredData.filter(record => record.data >= fromDate);
        }
        
        if (toDate) {
            filteredData = filteredData.filter(record => record.data <= toDate);
        }
        
        table.render(filteredData);
        
        // Update stats for filtered data
        if (filteredData.length === 0) {
            elements.statTotale.textContent = utils.formatCurrency(0);
            elements.statMedia.textContent = utils.formatCurrency(0);
            elements.statNero.textContent = utils.formatCurrency(0);
            elements.statBianco.textContent = utils.formatCurrency(0);
        } else {
            const totale = filteredData.reduce((sum, record) => sum + record.totale, 0);
            const nero = filteredData.reduce((sum, record) => sum + record.nero, 0);
            const bianco = filteredData.reduce((sum, record) => sum + record.bianco, 0);
            const media = totale / filteredData.length;
            
            elements.statTotale.textContent = utils.formatCurrency(totale);
            elements.statMedia.textContent = utils.formatCurrency(media);
            elements.statNero.textContent = utils.formatCurrency(nero);
            elements.statBianco.textContent = utils.formatCurrency(bianco);
        }
        
        utils.showNotification(`Filtri applicati: ${filteredData.length} record trovati`, 'info');
    },
    
    clear: () => {
        elements.filterFrom.value = '';
        elements.filterTo.value = '';
        table.render();
        analytics.updateStats();
        utils.showNotification('Filtri rimossi', 'info');
    }
};

// Navigation Functions
const navigation = {
    init: () => {
        elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetSection = btn.dataset.section;
                navigation.showSection(targetSection);
                
                // Update active nav button
                elements.navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    },
    
    showSection: (sectionId) => {
        elements.sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // If showing analytics, update charts
            if (sectionId === 'analytics') {
                setTimeout(() => {
                    analytics.updateCharts();
                }, 100);
            }
        }
    }
};

// Form Validation
const validation = {
    validateForm: () => {
        const data = elements.dataInput.value;
        const contanti = elements.contantiInput.value;
        const pos1 = elements.pos1Input.value;
        const pos2 = elements.pos2Input.value;
        const ticket = elements.ticketInput.value;
        const chiusura = elements.chiusuraInput.value;
        
        if (!data) {
            utils.showNotification('La data è obbligatoria', 'error');
            elements.dataInput.focus();
            return false;
        }
        
        if (!contanti && !pos1 && !pos2 && !ticket && !chiusura) {
            utils.showNotification('Inserire almeno un valore', 'error');
            return false;
        }
        
        // Check for negative values
        const values = [contanti, pos1, pos2, ticket, chiusura];
        const hasNegative = values.some(val => val && parseFloat(val) < 0);
        
        if (hasNegative) {
            utils.showNotification('I valori non possono essere negativi', 'error');
            return false;
        }
        
        return true;
    }
};

// Event Listeners
const eventListeners = {
    init: () => {
        // Navigation
        navigation.init();
        
        // Form inputs for real-time calculation
        const inputs = [
            elements.contantiInput,
            elements.pos1Input,
            elements.pos2Input,
            elements.ticketInput,
            elements.chiusuraInput
        ];
        
        inputs.forEach(input => {
            input.addEventListener('input', calculations.updateDisplay);
        });
        
        // Form submission
        elements.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validation.validateForm()) {
                return;
            }
            
            const calc = calculations.calculate();
            const formData = {
                data: elements.dataInput.value,
                contanti: utils.parseFloat(elements.contantiInput.value),
                pos1: utils.parseFloat(elements.pos1Input.value),
                pos2: utils.parseFloat(elements.pos2Input.value),
                ticket: utils.parseFloat(elements.ticketInput.value),
                chiusura: utils.parseFloat(elements.chiusuraInput.value),
                ...calc
            };
            
            await database.save(formData);
        });
        
        // Reset form
        elements.resetBtn.addEventListener('click', () => {
            elements.form.reset();
            elements.dataInput.value = new Date().toISOString().split('T')[0];
            calculations.updateDisplay();
        });
        
        // Table sorting
        elements.tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                table.sort(header.dataset.sort);
            });
        });
        
        // Filters
        elements.applyFiltersBtn.addEventListener('click', filters.apply);
        elements.clearFiltersBtn.addEventListener('click', filters.clear);
        
        // Export
        elements.exportBtn.addEventListener('click', exportFunctions.toExcel);
        
        // Modal
        elements.closeModal.addEventListener('click', utils.hideModal);
        elements.cancelAction.addEventListener('click', utils.hideModal);
        
        // Close modal on outside click
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                utils.hideModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
                utils.hideModal();
            }
            
            // Ctrl+S to save form (if in dashboard)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const activeSection = document.querySelector('.section.active');
                if (activeSection && activeSection.id === 'dashboard') {
                    elements.form.dispatchEvent(new Event('submit'));
                }
            }
            
            // Ctrl+E to export (if in analytics)
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                const activeSection = document.querySelector('.section.active');
                if (activeSection && activeSection.id === 'analytics') {
                    exportFunctions.toExcel();
                }
            }
        });
    }
};

// Initialization
const app = {
    init: async () => {
        try {
            // Set default date to today
            elements.dataInput.value = new Date().toISOString().split('T')[0];
            
            // Initialize calculations display
            calculations.updateDisplay();
            
            // Initialize event listeners
            eventListeners.init();
            
            // Load initial data
            await database.loadAll();
            
            // Show success message
            utils.showNotification('Applicazione caricata con successo!', 'success');
            
        } catch (error) {
            console.error('Errore nell\'inizializzazione:', error);
            utils.showNotification('Errore nell\'inizializzazione dell\'applicazione', 'error');
        }
    }
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', app.init);

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Handle online/offline status
window.addEventListener('online', () => {
    utils.showNotification('Connessione ripristinata', 'success');
});

window.addEventListener('offline', () => {
    utils.showNotification('Connessione persa - modalità offline', 'warning');
});

// Performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`App loaded in ${loadTime.toFixed(2)}ms`);
});