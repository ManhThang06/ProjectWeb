import { useState, useEffect } from 'react';
import { db } from '@/db';
import axios from 'axios';

export default function useSync() {
    const [isOnline, setIsOnline] = useState(window.navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncData();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncData = async () => {
        if (!window.navigator.onLine) return;
        
        setIsSyncing(true);
        try {
            const pendingNotes = await db.notes
                .filter(note => note.sync_status !== 'synced')
                .toArray();

            for (const note of pendingNotes) {
                try {
                    if (note.sync_status === 'pending_update') {
                        await axios.patch(route('notes.update', note.server_id), {
                            title: note.title,
                            content: note.content
                        });
                    } else if (note.sync_status === 'pending_create') {
                        const res = await axios.post(route('notes.store'), {
                            title: note.title,
                            content: note.content
                        });
                        // Update local ID with server ID
                        await db.notes.update(note.id, { 
                            server_id: res.data.id, 
                            sync_status: 'synced' 
                        });
                        continue;
                    } else if (note.sync_status === 'pending_delete') {
                        await axios.delete(route('notes.destroy', note.server_id));
                        await db.notes.delete(note.id);
                        continue;
                    }
                    
                    await db.notes.update(note.id, { sync_status: 'synced' });
                } catch (err) {
                    console.error('Failed to sync note:', note, err);
                }
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const saveNote = async (noteData, id = null) => {
        if (isOnline) {
            try {
                const url = id ? route('notes.update', id) : route('notes.store');
                const method = id ? 'patch' : 'post';
                const res = await axios[method](url, noteData);
                
                // Update local storage
                await db.notes.put({
                    ...res.data,
                    server_id: res.data.id,
                    sync_status: 'synced'
                });
                return res.data;
            } catch (err) {
                console.error('Server save failed, falling back to local', err);
            }
        }

        // Offline or server failed
        const localNote = {
            ...noteData,
            server_id: id,
            sync_status: id ? 'pending_update' : 'pending_create',
            updated_at: new Date().toISOString()
        };
        
        const localId = await db.notes.put(localNote);
        return { ...localNote, id: localId };
    };

    return { isOnline, isSyncing, syncData, saveNote };
}
