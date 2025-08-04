import { utils } from './utils.js';

// Calculation Functions
export class Calculator {
    constructor(uiManager) {
        this.ui = uiManager;
    }
    
    calculate() {
        const contanti = utils.parseFloat(this.ui.elements.contantiInput?.value || 0);
        const pos1 = utils.parseFloat(this.ui.elements.pos1Input?.value || 0);
        const pos2 = utils.parseFloat(this.ui.elements.pos2Input?.value || 0);
        const ticket = utils.parseFloat(this.ui.elements.ticketInput?.value || 0);
        const chiusura = utils.parseFloat(this.ui.elements.chiusuraInput?.value || 0);
        
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
    }
    
    updateDisplay() {
        const calc = this.calculate();
        this.ui.updateCalculationDisplay(calc);
        return calc;
    }
    
    validateInputs() {
        const inputs = [
            this.ui.elements.contantiInput,
            this.ui.elements.pos1Input,
            this.ui.elements.pos2Input,
            this.ui.elements.ticketInput,
            this.ui.elements.chiusuraInput
        ].filter(input => input);
        
        for (const input of inputs) {
            const value = utils.parseFloat(input.value);
            if (value < 0) {
                this.ui.showNotification('I valori non possono essere negativi', 'error');
                input.focus();
                return false;
            }
        }
        
        return true;
    }
}