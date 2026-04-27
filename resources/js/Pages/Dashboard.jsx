import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import useDebounce from '@/Hooks/useDebounce';
import ConfirmationModal from '@/Components/ConfirmationModal';
import LabelManager from '@/Components/LabelManager';
import NotePasswordModal from '@/Components/NotePasswordModal';
import NoteShareModal from '@/Components/NoteShareModal';
import axios from 'axios';

export default function Dashboard({ notes: initialNotes, labels, filters, auth }) {
    const [notes, setNotes] = useState(initialNotes);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    const [selectedNote, setSelectedNote] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'open'|'delete', note }
    
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [quickLabelName, setQuickLabelName] = useState('');

    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const debouncedNoteForm = useDebounce(noteForm, 300);
    const [isSaving, setIsSaving] = useState(false);
    
    // Password settings state
    const [showPasswordSettings, setShowPasswordSettings] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ password: '', password_confirmation: '', current_password: '' });

    // Sync initial notes from props
    useEffect(() => {
        setNotes(initialNotes);
        if (selectedNote) {
            const updated = initialNotes.find(n => n.id === selectedNote.id);
            if (updated) setSelectedNote(updated);
        }
    }, [initialNotes]);

    // REAL-TIME COLLABORATION (Laravel Echo)
    useEffect(() => {
        if (showModal && selectedNote) {
            const channel = window.Echo?.private(`note.${selectedNote.id}`);
            if (channel) {
                channel.listen('.note.updated', (e) => {
                    if (e.userId !== auth?.user?.id) {
                        setNoteForm({ title: e.title, content: e.content });
                        setNotes(prev => prev.map(n => n.id === e.noteId ? { ...n, title: e.title, content: e.content } : n));
                    }
                });
                return () => channel.stopListening('.note.updated');
            }
        }
    }, [showModal, selectedNote?.id]);

    const handleFilter = useCallback((newSearch, newLabelId) => {
        router.get(route('dashboard'), { 
            search: newSearch, 
            label_id: newLabelId || undefined
        }, { preserveState: true, replace: true, preserveScroll: true });
    }, []);

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            handleFilter(debouncedSearch, filters.label_id);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (selectedNote && !selectedNote.has_password && (debouncedNoteForm.title !== selectedNote.title || debouncedNoteForm.content !== selectedNote.content)) {
            handleAutoSave(selectedNote.id, debouncedNoteForm);
        }
    }, [debouncedNoteForm]);

    const handleAutoSave = async (id, data) => {
        setIsSaving(true);
        try {
            const response = await axios.patch(route('notes.update', id), data);
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...response.data } : n));
            const updated = { ...selectedNote, ...response.data };
            setSelectedNote(updated);
        } catch (error) {
            console.error('Auto-save failed', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openNote = (note = null) => {
        if (!note) {
            handleCreateNewNote();
            return;
        }

        if (note.has_password) {
            setPendingAction({ type: 'open', note });
            setShowPasswordModal(true);
            return;
        }

        setSelectedNote(note);
        setNoteForm({ title: note.title || '', content: note.content || '' });
        setShowModal(true);
        setShowPasswordSettings(false);
    };

    const handlePasswordSuccess = (password) => {
        const note = pendingAction.note;
        if (pendingAction.type === 'open') {
            setSelectedNote(note);
            setNoteForm({ title: note.title || '', content: note.content || '' });
            setShowModal(true);
        } else if (pendingAction.type === 'delete') {
            setNoteToDelete(note);
            setShowDeleteModal(true);
        }
        setShowPasswordModal(false);
        setPendingAction(null);
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
        if (note.has_password) {
            setPendingAction({ type: 'delete', note });
            setShowPasswordModal(true);
            return;
        }
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
        router.post(route('notes.pin', note.id), {}, { preserveScroll: true });
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        router.post(route('notes.set-password', selectedNote.id), passwordForm, {
            onSuccess: () => {
                setPasswordForm({ password: '', password_confirmation: '', current_password: '' });
                setShowPasswordSettings(false);
            }
        });
    };

    const disablePassword = () => {
        if (confirm('Tắt mật khẩu bảo vệ cho ghi chú này?')) {
            router.post(route('notes.set-password', selectedNote.id), { 
                disable: true, 
                current_password: passwordForm.current_password 
            }, {
                onSuccess: () => setShowPasswordSettings(false)
            });
        }
    };

    const handleImageUpload = (e, replaceId = null) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        if (replaceId) {
            router.post(route('notes.image.replace', replaceId), formData, {
                onSuccess: () => router.reload({ only: ['notes'] })
            });
        } else {
            router.post(route('notes.image', selectedNote.id), formData, {
                onSuccess: () => router.reload({ only: ['notes'] })
            });
        }
    };

    const handleDeleteImage = (imgId) => {
        if (confirm('Xóa ảnh này khỏi ghi chú?')) {
            router.delete(route('notes.image.destroy', imgId), {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['notes'] })
            });
        }
    };

    const handleLabelSync = (label) => {
        const currentLabels = selectedNote.labels.map(l => l.id);
        const newLabelIds = currentLabels.includes(label.id) 
            ? currentLabels.filter(id => id !== label.id) 
            : [...currentLabels, label.id];

        router.post(route('notes.labels', selectedNote.id), { label_ids: newLabelIds }, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['notes'] })
        });
    };

    const handleQuickAddLabel = (e) => {
        e.preventDefault();
        if (!quickLabelName.trim()) return;
        router.post(route('labels.store'), { name: quickLabelName }, {
            onSuccess: (page) => {
                const newLabel = page.props.labels.find(l => l.name === quickLabelName);
                if (newLabel) handleLabelSync(newLabel);
                setQuickLabelName('');
            }
        });
    };

    return (
        <BootstrapLayout>
            <Head title="Quản lý ghi chú" />
            
            <div className="container py-2">
                <div className="row mb-5 align-items-center g-3">
                    <div className="col-md-7">
                        <div className="input-group shadow-sm rounded-pill bg-body border overflow-hidden px-2">
                            <span className="input-group-text bg-transparent border-0 pe-1">
                                <i className="bi bi-search text-secondary opacity-50"></i>
                            </span>
                            <input type="text" className="form-control border-0 py-2 shadow-none bg-transparent" placeholder="Tìm kiếm ghi chú..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="col-md-5 d-flex justify-content-md-end gap-2">
                        <Link href={route('notes.shared-with-me')} className="btn btn-outline-primary rounded-pill px-4 fw-bold">
                            <i className="bi bi-people me-1"></i> Chia sẻ với tôi
                        </Link>
                        <button className="btn btn-primary rounded-pill px-4 shadow fw-bold transition-all" onClick={() => openNote()}>
                            <i className="bi bi-plus-lg me-1"></i> Ghi chú mới
                        </button>
                    </div>
                </div>

                <div className="d-flex gap-2 mb-4 overflow-auto pb-3 scrollbar-hide align-items-center">
                    <button className={`btn btn-sm rounded-pill px-3 fw-medium ${!filters.label_id ? 'btn-primary shadow-sm' : 'btn-body border'}`} onClick={() => handleFilter(search, null)}>Tất cả</button>
                    {labels.map(label => (
                        <button key={label.id} className={`btn btn-sm rounded-pill px-3 fw-medium ${filters.label_id == label.id ? 'btn-primary shadow-sm' : 'btn-body border'}`} onClick={() => handleFilter(search, label.id)}>{label.name}</button>
                    ))}
                    <button className="btn btn-sm btn-outline-secondary rounded-pill border-dashed ms-2" onClick={() => setShowLabelManager(true)}><i className="bi bi-tags-fill me-1"></i>Quản lý nhãn</button>
                    <div className="ms-auto btn-group shadow-sm bg-body border rounded-pill p-1">
                        <button className={`btn btn-sm border-0 rounded-circle ${viewMode === 'grid' ? 'btn-primary shadow-sm' : 'btn-link text-secondary'}`} onClick={() => setViewMode('grid')}><i className="bi bi-grid-fill"></i></button>
                        <button className={`btn btn-sm border-0 rounded-circle ${viewMode === 'list' ? 'btn-primary shadow-sm' : 'btn-link text-secondary'}`} onClick={() => setViewMode('list')}><i className="bi bi-list-ul"></i></button>
                    </div>
                </div>

                <div className={viewMode === 'grid' ? 'row g-4' : 'd-flex flex-column gap-3'}>
                    {notes.map(note => (
                        <div key={note.id} className={viewMode === 'grid' ? 'col-sm-6 col-md-4 col-xl-3' : 'w-100'}>
                            <div className={`card h-100 border shadow-sm rounded-4 note-card transition-all ${note.is_pinned ? 'border-primary border-2 bg-primary-subtle bg-opacity-10' : ''}`} onClick={() => openNote(note)}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h6 className="card-title fw-bold mb-0 text-truncate fs-5">{note.title || 'Ghi chú mới'}</h6>
                                        <div className="d-flex gap-2 align-items-center">
                                            {note.has_password && <i className="bi bi-lock-fill text-warning"></i>}
                                            {note.shared_with && note.shared_with.length > 0 && <i className="bi bi-people-fill text-info"></i>}
                                            <button className={`btn btn-sm p-0 border-0 ${note.is_pinned ? 'text-primary' : 'text-secondary opacity-25'}`} onClick={(e) => { e.stopPropagation(); togglePin(note); }}>
                                                <i className={`bi ${note.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'} fs-5`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="card-text opacity-75 mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '1.5em' }}>
                                        {note.has_password ? '••••••••••••••••' : (note.content || 'Nhấn để thêm nội dung...')}
                                    </p>
                                    <div className="d-flex flex-wrap gap-1 mt-auto">
                                        {note.labels.map(l => (
                                            <span key={l.id} className="badge rounded-pill bg-body-secondary text-primary border border-primary-subtle fw-normal">#{l.name}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent border-top-0 d-flex justify-content-between align-items-center p-4 pt-0">
                                    <span className="text-secondary opacity-50 small"><i className="bi bi-calendar3 me-1"></i>{new Date(note.updated_at).toLocaleDateString('vi-VN')}</span>
                                    <button className="btn btn-sm btn-link text-danger p-0 border-0 shadow-none opacity-25 hover-opacity-100" onClick={(e) => { e.stopPropagation(); confirmDelete(note); }}>
                                        <i className="bi bi-trash3 fs-6"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && selectedNote && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content border-0 shadow-2xl rounded-5 overflow-hidden bg-body">
                            <div className="modal-header border-0 px-4 pt-4 pb-0 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <button className={`btn rounded-pill px-4 btn-sm fw-bold transition-all ${selectedNote.is_pinned ? 'btn-primary shadow' : 'btn-outline-secondary'}`} onClick={() => togglePin(selectedNote)}>
                                        <i className={`bi ${selectedNote.is_pinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'} me-2`}></i> {selectedNote.is_pinned ? 'Đã ghim' : 'Ghim'}
                                    </button>
                                    <button className="btn btn-outline-info rounded-pill px-4 btn-sm fw-bold" onClick={() => setShowShareModal(true)}>
                                        <i className="bi bi-share me-2"></i> Chia sẻ
                                    </button>
                                    <div className="d-flex align-items-center gap-2 small">
                                        {isSaving ? <span className="text-secondary"><div className="spinner-border spinner-border-sm me-1"></div> Đang lưu...</span> : <span className="text-success fw-medium"><i className="bi bi-check2-circle me-1"></i> Đã đồng bộ</span>}
                                    </div>
                                </div>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            
                            <div className="modal-body p-4 p-lg-5 pt-3">
                                <div className="row g-4">
                                    <div className="col-lg-8 border-end-lg pe-lg-5">
                                        <input type="text" className="form-control form-control-lg border-0 bg-transparent fw-bold mb-4 p-0 shadow-none fs-1 text-body" placeholder="Tiêu đề" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
                                        <textarea className="form-control border-0 bg-transparent p-0 shadow-none fs-4 text-body opacity-75" rows="12" placeholder="Nội dung..." style={{ resize: 'none' }} value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}></textarea>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="d-flex flex-column gap-4 h-100">
                                            <section className="bg-light p-3 rounded-4 border">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center text-warning" onClick={() => setShowPasswordSettings(!showPasswordSettings)} style={{ cursor: 'pointer' }}>
                                                    <i className={`bi ${selectedNote.has_password ? 'bi-shield-lock-fill' : 'bi-shield-lock'} me-2`}></i> Bảo mật ghi chú
                                                    <i className={`bi bi-chevron-${showPasswordSettings ? 'up' : 'down'} ms-auto small`}></i>
                                                </h6>
                                                
                                                {showPasswordSettings && (
                                                    <form onSubmit={handlePasswordChange}>
                                                        {selectedNote.has_password && (
                                                            <div className="mb-2">
                                                                <input type="password" placeholder="Mật khẩu hiện tại" className="form-control form-control-sm rounded-pill" value={passwordForm.current_password} onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})} required />
                                                            </div>
                                                        )}
                                                        <div className="mb-2">
                                                            <input type="password" placeholder="Mật khẩu mới" className="form-control form-control-sm rounded-pill" value={passwordForm.password} onChange={(e) => setPasswordForm({...passwordForm, password: e.target.value})} required />
                                                        </div>
                                                        <div className="mb-3">
                                                            <input type="password" placeholder="Xác nhận mật khẩu" className="form-control form-control-sm rounded-pill" value={passwordForm.password_confirmation} onChange={(e) => setPasswordForm({...passwordForm, password_confirmation: e.target.value})} required />
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <button type="submit" className="btn btn-sm btn-primary rounded-pill px-3">Lưu</button>
                                                            {selectedNote.has_password && <button type="button" className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={disablePassword}>Tắt khóa</button>}
                                                        </div>
                                                    </form>
                                                )}
                                                {!showPasswordSettings && selectedNote.has_password && <span className="badge bg-warning-subtle text-warning border border-warning-opacity-25 rounded-pill px-3">Đã đặt mật khẩu</span>}
                                            </section>

                                            <section>
                                                <h6 className="fw-bold mb-3 d-flex align-items-center text-primary"><i className="bi bi-tags me-2"></i>Nhãn dán</h6>
                                                <form onSubmit={handleQuickAddLabel} className="mb-3">
                                                    <div className="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border">
                                                        <input type="text" className="form-control border-0 bg-transparent shadow-none" placeholder="Tạo nhãn mới & gán..." value={quickLabelName} onChange={(e) => setQuickLabelName(e.target.value)} />
                                                        <button className="btn btn-primary border-0" type="submit"><i className="bi bi-plus"></i></button>
                                                    </div>
                                                </form>
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    {labels.map(label => (
                                                        <button key={label.id} className={`btn btn-sm rounded-pill px-3 transition-all border ${selectedNote.labels.some(l => l.id === label.id) ? 'btn-primary shadow-sm' : 'btn-light'}`} onClick={() => handleLabelSync(label)}>#{label.name}</button>
                                                    ))}
                                                </div>
                                            </section>

                                            <section className="flex-grow-1">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center text-primary"><i className="bi bi-images me-2"></i>Hình ảnh</h6>
                                                <div className="row g-2 mb-3">
                                                    {selectedNote.images.map(img => (
                                                        <div key={img.id} className="col-4 position-relative image-manage-group">
                                                            <div className="ratio ratio-1x1 rounded-3 overflow-hidden shadow-sm border bg-body-secondary cursor-zoom-in" onClick={() => setPreviewImage(`/storage/${img.path}`)}><img src={`/storage/${img.path}`} className="object-fit-cover" alt="note" /></div>
                                                            <div className="position-absolute top-0 end-0 m-1 d-flex flex-column gap-1 opacity-0 image-manage-actions transition-all">
                                                                <button className="btn btn-danger btn-sm rounded-circle p-1" style={{ width: '24px', height: '24px', fontSize: '0.6rem' }} onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}><i className="bi bi-trash"></i></button>
                                                                <label className="btn btn-primary btn-sm rounded-circle p-1" style={{ width: '24px', height: '24px', fontSize: '0.6rem', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}><i className="bi bi-arrow-repeat"></i><input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e, img.id)} /></label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="col-4">
                                                        <label className="btn btn-body-secondary w-100 h-100 d-flex flex-column align-items-center justify-content-center border-dashed rounded-3 p-3 transition-all" style={{ border: '2px dashed #dee2e6', minHeight: '80px', cursor: 'pointer' }}><i className="bi bi-plus-circle text-secondary opacity-50 fs-4"></i><input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e)} /></label>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="mt-auto pt-3 border-top">
                                                <button className="btn btn-outline-danger w-100 rounded-pill fw-bold py-2 mb-3 shadow-none border-opacity-25" onClick={() => confirmDelete(selectedNote)}><i className="bi bi-trash3 me-2"></i>Xóa ghi chú này</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NotePasswordModal show={showPasswordModal} note={pendingAction?.note} onSuccess={handlePasswordSuccess} onCancel={() => { setShowPasswordModal(false); setPendingAction(null); }} />
            <NoteShareModal show={showShareModal} note={selectedNote} onClose={() => setShowShareModal(false)} />
            <Lightbox image={previewImage} onClose={() => setPreviewImage(null)} />
            <LabelManager show={showLabelManager} labels={labels} onClose={() => setShowLabelManager(false)} />
            <ConfirmationModal show={showDeleteModal} title="Xác nhận xóa" message="Dữ liệu ghi chú và hình ảnh sẽ bị xóa vĩnh viễn. Bạn chắc chắn chứ?" onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />

            <style dangerouslySetInnerHTML={{ __html: `
                .note-card { background-color: var(--bs-body-bg); color: inherit; cursor: pointer; }
                .note-card:hover { transform: translateY(-6px); box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important; }
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
                .border-dashed { border-style: dashed !important; }
                .image-manage-group:hover .image-manage-actions { opacity: 1 !important; }
                .cursor-zoom-in { cursor: zoom-in; }
            `}} />
        </BootstrapLayout>
    );
}

function Lightbox({ image, onClose }) {
    if (!image) return null;
    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }} onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content bg-transparent border-0 text-center">
                    <img src={image} className="img-fluid rounded shadow-lg max-vh-90 mx-auto" alt="Preview" style={{ maxHeight: '90vh' }} />
                </div>
            </div>
        </div>
    );
}
