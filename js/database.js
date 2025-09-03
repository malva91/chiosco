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
            
            // Check if a record with the same date already exists
            const existingQuery = await this.db.collection(constants.COLLECTION_NAME)
                .where('data', '==', data.data)
                .get();
            
            if (!existingQuery.empty) {
                // Update existing record instead of creating new one
                const existingDoc = existingQuery.docs[0];
                await existingDoc.ref.update({
                    ...data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                this.ui.showNotification('Incasso aggiornato', 'success');
                return true;
            }
            
            // Create new record if no existing date found
            const docData = {
                ...data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection(constants.COLLECTION_NAME).add(docData);
            this.ui.showNotification('Incasso salvato', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            this.ui.showNotification('Errore salvataggio', 'error');
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
            this.ui.showNotification('Errore caricamento', 'error');
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
            this.ui.showNotification('Record eliminato', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore nell\'eliminazione:', error);
            this.ui.showNotification('Errore eliminazione', 'error');
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
            
            this.ui.showNotification('Record aggiornato', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore nell\'aggiornamento:', error);
            this.ui.showNotification('Errore aggiornamento', 'error');
            return false;
        } finally {
            this.ui.hideLoading();
        }
    }
}