import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import useDebounce from '@/Hooks/useDebounce';
import ConfirmationModal from '@/Components/ConfirmationModal';
import LabelManager from '@/Components/LabelManager';
import axios from 'axios';

export default function Dashboard({ notes: initialNotes, labels, filters }) {
    const [notes, setNotes] = useState(initialNotes);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    const [selectedNote, setSelectedNote] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);

    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const debouncedNoteForm = useDebounce(noteForm, 300);
    const [isSaving, setIsSaving] = useState(false);

    // Sync initial notes from props
    useEffect(() => {
        setNotes(initialNotes);
    }, [initialNotes]);

    // Live Search
    useEffect(() => {
        router.get(route('dashboard'), { search: debouncedSearch, label_id: filters.label_id }, {
            preserveState: true,
            replace: true
        });
    }, [debouncedSearch]);

    // Auto-save logic
    useEffect(() => {
        if (selectedNote && (debouncedNoteForm.title !== selectedNote.title || debouncedNoteForm.content !== selectedNote.content)) {
            handleAutoSave(selectedNote.id, debouncedNoteForm);
        }
    }, [debouncedNoteForm]);

    const handleAutoSave = async (id, data) => {
        setIsSaving(true);
        try {
            const response = await axios.patch(route('notes.update', id), data);
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...response.data } : n));
            // Don't update selectedNote here to avoid resetting input cursor if not careful, 
            // but we need to keep it in sync for the next debounce.
            setSelectedNote(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Auto-save failed', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openNote = (note = null) => {
        if (note) {
            setSelectedNote(note);
            setNoteForm({ title: note.title || '', content: note.content || '' });
            setShowModal(true);
        } else {
            handleCreateNewNote();
        }
    };

    const handleCreateNewNote = async () => {
        try {
            const response = await axios.post(route('notes.store'), { title: '', content: '' });
            const newNote = response.data;
            setNotes([newNote, ...notes]);
            setSelectedNote(newNote);
            setNoteForm({ title: '', content: '' });
            setShowModal(true);
        } catch (error) {
            console.error('Failed to create note', error);
        }
    };

    const confirmDelete = (note) => {
        setNoteToDelete(note);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        router.delete(route('notes.destroy', noteToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setShowModal(false);
            }
        });
    };

    const togglePin = (note) => {
        router.post(route('notes.pin', note.id), {}, { 
            preserveScroll: true,
            onSuccess: (page) => {
                if (selectedNote && selectedNote.id === note.id) {
                    const updated = page.props.notes.find(n => n.id === note.id);
                    setSelectedNote(updated);
                }
            }
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            await axios.post(route('notes.image', selectedNote.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Reload page to get updated images or update local state
            router.reload({ only: ['notes'] });
        } catch (error) {
            console.error('Image upload failed', error);
        }
    };

    const handleLabelSync = (label) => {
        const currentLabels = selectedNote.labels.map(l => l.id);
        let newLabelIds;
        if (currentLabels.includes(label.id)) {
            newLabelIds = currentLabels.filter(id => id !== label.id);
        } else {
            newLabelIds = [...currentLabels, label.id];
        }

        router.post(route('notes.labels', selectedNote.id), { label_ids: newLabelIds }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const updated = page.props.notes.find(n => n.id === selectedNote.id);
                setSelectedNote(updated);
            }
        });
    };

    return (
        <BootstrapLayout>
            <Head title="Ghi chú cá nhân" />
            
            <div className="container py-4">
                {/* Search and Toggle Bar */}
                <div className="row mb-4 align-items-center g-3">
                    <div className="col-md-6">
                        <div className="input-group shadow-sm rounded">
                            <span className="input-group-text bg-white border-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-0 py-2 shadow-none" 
                                placeholder="Tìm kiếm trong tiêu đề và nội dung..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-6 d-flex justify-content-md-end gap-2">
                        <div className="btn-group shadow-sm">
                            <button 
                                className={`btn btn-white ${viewMode === 'grid' ? 'text-primary' : 'text-muted'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <i className="bi bi-grid-fill"></i>
                            </button>
                            <button 
                                className={`btn btn-white ${viewMode === 'list' ? 'text-primary' : 'text-muted'}`}
                                onClick={() => setViewMode('list')}
                            >
                                <i className="bi bi-list-task"></i>
                            </button>
                        </div>
                        <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => openNote()}>
                            <i className="bi bi-plus-lg me-1"></i> Tạo mới
                        </button>
                    </div>
                </div>

                {/* Labels Filter Bar */}
                <div className="d-flex gap-2 mb-4 overflow-auto pb-2 scrollbar-hide">
                    <button 
                        className={`btn btn-sm rounded-pill px-3 ${!filters.label_id ? 'btn-primary shadow-sm' : 'btn-light border'}`}
                        onClick={() => router.get(route('dashboard'), { search })}
                    >
                        Tất cả
                    </button>
                    {labels.map(label => (
                        <button 
                            key={label.id}
                            className={`btn btn-sm rounded-pill px-3 ${filters.label_id == label.id ? 'btn-primary shadow-sm' : 'btn-light border'}`}
                            onClick={() => router.get(route('dashboard'), { search, label_id: label.id })}
                        >
                            {label.name}
                        </button>
                    ))}
                    <button className="btn btn-sm btn-light rounded-pill border" onClick={() => setShowLabelManager(true)}>
                        <i className="bi bi-tag-fill me-1"></i> Nhãn
                    </button>
                </div>

                {/* Notes Grid/List */}
                {notes.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-journal-x display-1 text-light"></i>
                        <p className="text-muted mt-3">Không tìm thấy ghi chú nào.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'row g-3' : 'd-flex flex-column gap-3'}>
                        {notes.map(note => (
                            <div key={note.id} className={viewMode === 'grid' ? 'col-sm-6 col-md-4 col-lg-3' : 'w-100'}>
                                <div 
                                    className={`card h-100 border-0 shadow-sm rounded-4 note-card transition-all ${note.is_pinned ? 'bg-primary-subtle' : 'bg-white'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => openNote(note)}
                                >
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="card-title fw-bold text-dark mb-0 text-truncate">{note.title || 'Ghi chú trống'}</h6>
                                            <button 
                                                className={`btn btn-sm p-0 ${note.is_pinned ? 'text-primary' : 'text-muted'}`}
                                                onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                                            >
                                                <i className={`bi ${note.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}`}></i>
                                            </button>
                                        </div>
                                        <p className="card-text text-muted small" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {note.content || 'Chưa có nội dung...'}
                                        </p>
                                        <div className="mt-auto pt-2">
                                            {note.labels.map(l => (
                                                <span key={l.id} className="badge rounded-pill bg-white text-primary border border-primary-subtle me-1 small">
                                                    {l.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center pb-3">
                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                            {new Date(note.updated_at).toLocaleDateString('vi-VN')}
                                        </small>
                                        <button 
                                            className="btn btn-sm text-danger opacity-50 hover-opacity-100" 
                                            onClick={(e) => { e.stopPropagation(); confirmDelete(note); }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note Editor Modal */}
            {showModal && selectedNote && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <div className="d-flex align-items-center gap-2">
                                    <button 
                                        className={`btn btn-sm rounded-pill ${selectedNote.is_pinned ? 'btn-primary' : 'btn-light border'}`} 
                                        onClick={() => togglePin(selectedNote)}
                                    >
                                        <i className={`bi ${selectedNote.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'} me-1`}></i>
                                        {selectedNote.is_pinned ? 'Đã ghim' : 'Ghim'}
                                    </button>
                                    {isSaving && <span className="spinner-border spinner-border-sm text-muted" role="status"></span>}
                                    {!isSaving && <small className="text-muted fst-italic">Đã lưu</small>}
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-light btn-sm rounded-circle" onClick={() => confirmDelete(selectedNote)}>
                                        <i className="bi bi-trash text-danger"></i>
                                    </button>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                            </div>
                            <div className="modal-body p-4 pt-2">
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg border-0 bg-transparent fw-bold mb-3 p-0 shadow-none fs-3" 
                                    placeholder="Tiêu đề ghi chú" 
                                    value={noteForm.title}
                                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                />
                                <textarea 
                                    className="form-control border-0 bg-transparent p-0 shadow-none fs-5" 
                                    rows="8" 
                                    placeholder="Nhập nội dung ghi chú ở đây..." 
                                    style={{ resize: 'none' }}
                                    value={noteForm.content}
                                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                                ></textarea>
                                
                                {/* Images Section */}
                                <div className="mt-4">
                                    <h6 className="text-muted mb-3"><i className="bi bi-images me-2"></i>Hình ảnh</h6>
                                    <div className="row g-2">
                                        {selectedNote.images.map(img => (
                                            <div key={img.id} className="col-4 col-md-3">
                                                <div className="position-relative group shadow-sm rounded">
                                                    <img src={`/storage/${img.path}`} className="img-fluid rounded" alt="note" />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="col-4 col-md-3">
                                            <label className="btn btn-light w-100 h-100 d-flex flex-column align-items-center justify-content-center border-dashed rounded-3" style={{ border: '2px dashed #dee2e6', minHeight: '100px', cursor: 'pointer' }}>
                                                <i className="bi bi-plus-circle text-muted fs-4 mb-1"></i>
                                                <span className="small text-muted">Thêm ảnh</span>
                                                <input type="file" className="d-none" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Labels Section */}
                                <div className="mt-4 border-top pt-3">
                                    <h6 className="text-muted mb-3"><i className="bi bi-tags me-2"></i>Nhãn dán</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {labels.map(label => (
                                            <button 
                                                key={label.id}
                                                className={`btn btn-sm rounded-pill px-3 transition-all ${selectedNote.labels.some(l => l.id === label.id) ? 'btn-primary shadow-sm' : 'btn-light border'}`}
                                                onClick={() => handleLabelSync(label)}
                                            >
                                                {label.name}
                                            </button>
                                        ))}
                                        {labels.length === 0 && <small className="text-muted">Chưa có nhãn nào. Hãy tạo nhãn trước.</small>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LabelManager 
                show={showLabelManager} 
                labels={labels} 
                onClose={() => setShowLabelManager(false)} 
            />

            <ConfirmationModal 
                show={showDeleteModal}
                title="Xóa ghi chú?"
                message="Ghi chú này sẽ bị xóa vĩnh viễn khỏi tài khoản của bạn. Bạn có chắc chắn không?"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            <style dangerouslySetInnerHTML={{ __html: `
                .note-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}} />
        </BootstrapLayout>
    );
}
