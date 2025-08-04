import { chartColors } from './config.js';
import { utils } from './utils.js';

// Chart Management
export class ChartManager {
    constructor() {
        this.charts = {};
    }
    
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }
    
    createPieChart(data) {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;
        
        this.destroyChart('pie');
        
        if (data.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        const contanti = data.reduce((sum, record) => sum + record.contanti, 0);
        const pos1 = data.reduce((sum, record) => sum + record.pos1, 0);
        const pos2 = data.reduce((sum, record) => sum + record.pos2, 0);
        const ticket = data.reduce((sum, record) => sum + record.ticket, 0);
        
        this.charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Contanti', 'POS 1', 'POS 2', 'Ticket'],
                datasets: [{
                    data: [contanti, pos1, pos2, ticket],
                    backgroundColor: [
                        chartColors.contanti,
                        chartColors.pos1,
                        chartColors.pos2,
                        chartColors.ticket
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
    }
    
    createBarChart(data) {
        const ctx = document.getElementById('barChart');
        if (!ctx) return;
        
        this.destroyChart('bar');
        
        if (data.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        const nero = data.reduce((sum, record) => sum + record.nero, 0);
        const bianco = data.reduce((sum, record) => sum + record.bianco, 0);
        
        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Nero', 'Bianco'],
                datasets: [{
                    data: [nero, bianco],
                    backgroundColor: [chartColors.nero, chartColors.bianco],
                    borderWidth: 2,
                    borderColor: [chartColors.nero, '#e5e7eb'],
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
    }
    
    createLineChart(data) {
        const ctx = document.getElementById('lineChart');
        if (!ctx) return;
        
        this.destroyChart('line');
        
        if (data.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }
        
        // Group data by month
        const monthlyData = {};
        data.forEach(record => {
            const date = new Date(record.data);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    totale: 0,
                    nero: 0,
                    bianco: 0,
                    chiusura: 0,
                    count: 0
                };
            }
            
            monthlyData[monthKey].totale += record.totale;
            monthlyData[monthKey].nero += record.nero;
            monthlyData[monthKey].bianco += record.bianco;
            monthlyData[monthKey].chiusura += record.chiusura;
            monthlyData[monthKey].count++;
        });
        
        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            try {
                return date.toLocaleDateString('it-IT', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            } catch (error) {
                const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
                              'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                return `${months[parseInt(monthNum) - 1]} ${year}`;
            }
        });
        
        const totaleData = sortedMonths.map(month => monthlyData[month].totale);
        const neroData = sortedMonths.map(month => monthlyData[month].nero);
        const biancoData = sortedMonths.map(month => monthlyData[month].bianco);
        const chiusuraData = sortedMonths.map(month => monthlyData[month].chiusura);
        
        this.charts.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Totale',
                        data: totaleData,
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Chiusura',
                        data: chiusuraData,
                        borderColor: chartColors.chiusura,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Nero',
                        data: neroData,
                        borderColor: chartColors.nero,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Bianco',
                        data: biancoData,
                        borderColor: chartColors.bianco,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    
    updateAllCharts(data) {
        this.createPieChart(data);
        this.createBarChart(data);
        this.createLineChart(data);
    }
    
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }
}