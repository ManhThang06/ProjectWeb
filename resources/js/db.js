import Dexie from 'dexie';

export const db = new Dexie('NoteAppDB');

db.version(1).stores({
    notes: '++id, server_id, title, content, updated_at, sync_status', // sync_status: 'synced', 'pending_create', 'pending_update', 'pending_delete'
    labels: '++id, server_id, name'
});

export const saveNoteLocally = async (note) => {
    return await db.notes.put({
        ...note,
        server_id: note.id,
        sync_status: 'synced'
    });
};

export const getLocalNotes = async () => {
    return await db.notes.toArray();
};
