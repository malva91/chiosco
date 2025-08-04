import { firebaseConfig, constants } from './config.js';

// Database Management
export class DatabaseManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.db = null;
        this.init();
    }
    
    init() {
        try {
            if (typeof firebase !== 'undefined') {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore();
            } else {
                throw new Error('Firebase not loaded');
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.ui.showNotification('Errore nell\'inizializzazione del database', 'error');
        }
    }
    
    async save(data) {
        if (!this.db) {
            this.ui.showNotification('Database non disponibile', 'error');
            return false;
        }
        
        try {
            this.ui.showLoading();
            
            const docData = {
                ...data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection(constants.COLLECTION_NAME).add(docData);
            this.ui.showNotification('Incasso salvato con successo!', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            this.ui.showNotification('Errore nel salvataggio dei dati', 'error');
            return false;
        } finally {
            this.ui.hideLoading();
        }
    }
    
    async loadAll() {
        if (!this.db) {
            this.ui.showNotification('Database non disponibile', 'error');
            return [];
        }
        
        try {
            this.ui.showLoading();
            
            const snapshot = await this.db.collection(constants.COLLECTION_NAME)
                .orderBy('data', 'desc')
                .get();
            
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return data;
            
        } catch (error) {
            console.error('Errore nel caricamento:', error);
            this.ui.showNotification('Errore nel caricamento dei dati', 'error');
            return [];
        } finally {
            this.ui.hideLoading();
        }
    }
    
    async delete(id) {
        if (!this.db) {
            this.ui.showNotification('Database non disponibile', 'error');
            return false;
        }
        
        try {
            this.ui.showLoading();
            
            await this.db.collection(constants.COLLECTION_NAME).doc(id).delete();
            this.ui.showNotification('Record eliminato con successo!', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore nell\'eliminazione:', error);
            this.ui.showNotification('Errore nell\'eliminazione del record', 'error');
            return false;
        } finally {
            this.ui.hideLoading();
        }
    }
    
    async update(id, data) {
        if (!this.db) {
            this.ui.showNotification('Database non disponibile', 'error');
            return false;
        }
        
        try {
            this.ui.showLoading();
            
            await this.db.collection(constants.COLLECTION_NAME).doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.ui.showNotification('Record aggiornato con successo!', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento:', error);
            this.ui.showNotification('Errore nell\'aggiornamento del record', 'error');
            return false;
        } finally {
            this.ui.hideLoading();
        }
    }
}