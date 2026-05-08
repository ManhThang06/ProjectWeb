import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import useSync from '@/Hooks/useSync';
import useDebounce from '@/Hooks/useDebounce';
import axios from 'axios';
import LabelManager from '@/Components/LabelManager';
import ConfirmationModal from '@/Components/ConfirmationModal';
import NotePasswordModal from '@/Components/NotePasswordModal';

export default function SharedNotes({ notes: initialNotes, labels: propLabels, allLabels: propAllLabels, auth, openedNote }) {
    const [notes, setNotes] = useState(initialNotes);
    const [availableLabels, setAvailableLabels] = useState(propLabels);
    const [allLabels, setAllLabels] = useState(propAllLabels || propLabels);
    const [selectedNote, setSelectedNote] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [noteForm, setNoteForm] = useState({ title: '', content: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [quickLabelName, setQuickLabelName] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingNote, setPendingNote] = useState(null);
    const [searchTerm, setSearchTerm] = useState(initialNotes.search || '');

    const debouncedNoteForm = useDebounce(noteForm, 300);
    const debouncedSearch = useDebounce(searchTerm, 400);
    const { isOnline, saveNote } = useSync();

    // Sync initial notes and labels from props
    useEffect(() => {
        setNotes(initialNotes);
        setAvailableLabels(propLabels);
        setAllLabels(propAllLabels || propLabels);
        
        // Cập nhật selectedNote ngay lập tức khi props thay đổi (sau khi upload ảnh/gán nhãn)
        if (selectedNote) {
            const updated = initialNotes.find(n => n.id === selectedNote.id);
            if (updated) {
                setSelectedNote(prev => ({ 
                    ...prev, 
                    ...updated, 
                    images: updated.images || [], 
                    labels: updated.labels || [] 
                }));
            }
        }
    }, [initialNotes, propLabels]);

    // Auto-open note if requested from other pages
    useEffect(() => {
        if (openedNote && !showModal && !showPasswordModal && (!selectedNote || selectedNote.id !== openedNote.id)) {
            openNote(openedNote);
        }
    }, [openedNote?.id]);

    useEffect(() => {
        if (!selectedNote || selectedNote.permission !== 'edit') return;
        const titleChanged = debouncedNoteForm.title !== (selectedNote.title || '');
        const contentChanged = debouncedNoteForm.content !== (selectedNote.content || '');
        if (titleChanged || contentChanged) {
            handleAutoSave(selectedNote, debouncedNoteForm);
        }
    }, [debouncedNoteForm]);

    // REAL-TIME COLLABORATION (Laravel Echo)
    useEffect(() => {
        if (showModal && selectedNote) {
            const channel = window.Echo?.private(`note.${selectedNote.id}`);
            if (channel) {
                channel.listen('.note.updated', (e) => {
                    if (e.userId !== auth?.user?.id) {
                        setNoteForm({ title: e.title, content: e.content });
                        setNotes(prev => prev.map(n => n.id === e.noteId ? { ...n, title: e.title, content: e.content, images: e.images, labels: (e.labels || []).filter(l => l.user_id === auth.user.id) } : n));
                        setSelectedNote(prev => prev && prev.id === e.noteId ? { ...prev, title: e.title, content: e.content, images: e.images, labels: (e.labels || []).filter(l => l.user_id === auth.user.id) } : prev);
                        
                        // Cập nhật danh sách nhãn có sẵn nếu có nhãn mới xuất hiện
                        if (e.labels) {
                            const myLabels = e.labels.filter(l => l.user_id === auth.user.id);
                            
                            setAvailableLabels(prev => {
                                const combined = [...prev];
                                myLabels.forEach(newL => {
                                    if (!combined.find(l => l.id === newL.id)) {
                                        combined.push(newL);
                                    }
                                });
                                return combined;
                            });

                            setAllLabels(prev => {
                                const combined = [...prev];
                                myLabels.forEach(newL => {
                                    if (!combined.find(l => l.id === newL.id)) {
                                        combined.push(newL);
                                    }
                                });
                                return combined;
                            });
                        }
                    }
                });
                return () => channel.stopListening('.note.updated');
            }
        }
    }, [showModal, selectedNote?.id]);

    const handleFilter = useCallback((newSearch, newLabelIds) => {
        router.get(route('notes.shared-with-me'), { 
            search: newSearch, 
            label_ids: newLabelIds && newLabelIds.length > 0 ? newLabelIds.join(',') : undefined
        }, { preserveState: true, replace: true, preserveScroll: true });
    }, []);

    const selectedLabelIds = (new URLSearchParams(window.location.search)).get('label_ids')
        ? (new URLSearchParams(window.location.search)).get('label_ids').split(',')
        : [];

    const toggleLabelFilter = (labelId) => {
        let newIds;
        if (selectedLabelIds.includes(String(labelId))) {
            newIds = selectedLabelIds.filter(id => id !== String(labelId));
        } else {
            newIds = [...selectedLabelIds, String(labelId)];
        }
        handleFilter(searchTerm, newIds);
    };

    useEffect(() => {
        const currentSearch = (new URLSearchParams(window.location.search)).get('search') || '';
        if (debouncedSearch !== currentSearch) {
            handleFilter(debouncedSearch, selectedLabelIds);
        }
    }, [debouncedSearch]);

    const handleAutoSave = async (note, data) => {
        setIsSaving(true);
        try {
            // Đảm bảo ghi chú không bị rỗng hoàn toàn nếu có ảnh
            const finalData = { ...data };
            const hasText = data.title?.trim() || data.content?.trim();
            const hasImages = note.images && note.images.length > 0;

            if (!hasText && hasImages && !data.title?.trim()) {
                finalData.title = 'Không tiêu đề';
            }

            const updatedNote = await saveNote(finalData, note.id);
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, ...updatedNote } : n));
            
            // Nếu vừa tự điền 'Không tiêu đề', cập nhật cả form state để người dùng thấy
            if (finalData.title === 'Không tiêu đề' && data.title !== 'Không tiêu đề') {
                setNoteForm(prev => ({ ...prev, title: 'Không tiêu đề' }));
            }

            setSelectedNote(prev => ({ ...prev, ...updatedNote }));
        } catch (error) {
            console.error('Auto-save failed', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openNote = (note) => {
        if (note.has_password && !note.verified) {
            setPendingNote(note);
            setShowPasswordModal(true);
            return;
        }

        setSelectedNote(note);
        setNoteForm({ title: note.title || '', content: note.content || '' });
        setShowModal(true);

        // Update URL without full navigation
        const params = new URLSearchParams(window.location.search);
        if (params.get('open') !== String(note.id)) {
            router.get(route('notes.shared-with-me'), { open: note.id }, { 
                preserveState: true, 
                replace: true, 
                preserveScroll: true 
            });
        }
    };

    const closeNote = () => {
        setShowModal(false);
        setSelectedNote(null);
        
        // Remove open param from URL
        router.get(route('notes.shared-with-me'), {}, { 
            preserveState: true, 
            replace: true, 
            preserveScroll: true 
        });
    };

    const handleImageUpload = async (e, replaceId = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        if (replaceId) {
            router.post(route('notes.image.replace', replaceId), formData, {
                onSuccess: () => router.reload({ only: ['notes'] })
            });
            return;
        }

        router.post(route('notes.image', selectedNote.id), formData, {
            onSuccess: () => router.reload({ only: ['notes'] })
        });
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
        const currentLabels = (selectedNote.labels || []).map(l => l.id);
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
        router.post(route('notes.labels.add', selectedNote.id), { name: quickLabelName }, {
            preserveScroll: true,
            onSuccess: () => {
                setQuickLabelName('');
                router.reload({ only: ['notes', 'labels'] });
            }
        });
    };

    const confirmDelete = (note) => {
        setNoteToDelete(note);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        router.delete(route('notes.destroy', noteToDelete.id), {
            onSuccess: () => {
                setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
                setShowDeleteModal(false);
                setShowModal(false);
                closeNote();
            }
        });
    };

    const handlePasswordSuccess = () => {
        setShowPasswordModal(false);
        if (pendingNote) {
            const verifiedNote = { ...pendingNote, verified: true };
            openNote(verifiedNote);
            setPendingNote(null);
        }
    };
    return (
        <BootstrapLayout>
            <Head title="Ghi chú được chia sẻ" />
            
            <div className="container py-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
                    <div>
                        <h2 className="fw-bold mb-1">Ghi chú được chia sẻ</h2>
                        <p className="text-muted mb-0">Các ghi chú mà người khác đã chia sẻ với bạn</p>
                    </div>
                    
                    <div className="d-flex align-items-center gap-3">
                        <div className="position-relative flex-grow-1" style={{ minWidth: '250px' }}>
                            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                            <input 
                                type="text" 
                                className="form-control rounded-pill ps-5 border-0 shadow-sm" 
                                placeholder="Tìm kiếm tiêu đề hoặc nội dung..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Link href={route('dashboard')} className="btn btn-light rounded-pill px-4 border shadow-sm flex-shrink-0">
                            <i className="bi bi-arrow-left me-2"></i>Quay lại của tôi
                        </Link>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-5 align-items-center">
                    <button 
                        className={`btn btn-sm rounded-pill px-4 py-2 border transition-all text-nowrap ${selectedLabelIds.length === 0 ? 'btn-primary shadow-sm' : 'btn-light'}`}
                        onClick={() => handleFilter(searchTerm, [])}
                    >
                        Tất cả
                    </button>
                    {availableLabels.map(label => (
                        <button 
                            key={label.id} 
                            className={`btn btn-sm rounded-pill px-4 py-2 border transition-all text-nowrap ${selectedLabelIds.includes(String(label.id)) ? 'btn-primary shadow-sm' : 'btn-light'}`}
                            onClick={() => toggleLabelFilter(label.id)}
                        >
                            #{label.name}
                        </button>
                    ))}
                    {selectedLabelIds.length > 0 && (
                        <button 
                            className="btn btn-sm btn-link text-danger text-decoration-none ms-2 text-nowrap"
                            onClick={() => handleFilter(searchTerm, [])}
                        >
                            <i className="bi bi-x-circle me-1"></i>Xóa toàn bộ
                        </button>
                    )}
                </div>

                {notes.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="mb-4 opacity-25">
                            <i className="bi bi-people" style={{ fontSize: '5rem' }}></i>
                        </div>
                        <h5>Chưa có ghi chú nào được chia sẻ với bạn</h5>
                    </div>
                ) : (
                    <div className="row g-4">
                        {notes.map(note => (
                            <div key={note.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border shadow-sm rounded-4 transition-all hover-lift">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <span className={`badge rounded-pill ${note.permission === 'edit' ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'} border border-opacity-10 mb-2 px-3`}>
                                                <i className={`bi ${note.permission === 'edit' ? 'bi-pencil-square' : 'bi-eye'} me-1`}></i>
                                                {note.permission === 'edit' ? 'Có thể chỉnh sửa' : 'Chỉ xem'}
                                            </span>
                                            {note.is_pinned && <i className="bi bi-pin-angle-fill text-primary"></i>}
                                        </div>
                                        <h5 className="fw-bold mb-3">{note.title || 'Không tiêu đề'}</h5>
                                        <p className="text-muted small mb-4 line-clamp-3">
                                            {note.content || 'Trống...'}
                                        </p>
                                        
                                        <div className="pt-3 border-top mt-auto">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                        <i className="bi bi-person-fill"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold small mb-0">{note.owner_name}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{note.owner_email}</div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => openNote(note)}
                                                    className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
                                                >
                                                    Mở ngay
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             
            {showModal && selectedNote && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered">
                        <div className="modal-content border-0 shadow-2xl rounded-5 overflow-hidden bg-body">
                            <div className="modal-header border-0 px-4 pt-4 pb-0 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <span className={`badge rounded-pill ${selectedNote.permission === 'edit' ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'} border border-opacity-10 px-3 py-2 fw-bold`}>
                                        <i className={`bi ${selectedNote.permission === 'edit' ? 'bi-pencil-square' : 'bi-eye'} me-2`}></i>
                                        {selectedNote.permission === 'edit' ? 'Đang chỉnh sửa' : 'Đang xem'}
                                    </span>
                                    <div className="d-flex align-items-center gap-2 small">
                                        {isSaving ? <span className="text-secondary"><div className="spinner-border spinner-border-sm me-1"></div> Đang lưu...</span> : <span className="text-success fw-medium"><i className="bi bi-check2-circle me-1"></i> Đã đồng bộ</span>}
                                    </div>
                                </div>
                                <button type="button" className="btn-close shadow-none" onClick={closeNote}></button>
                            </div>
                            
                            <div className="modal-body p-4 p-lg-5 pt-3">
                                <div className="row g-4">
                                    <div className="col-lg-8 border-end-lg pe-lg-5">
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg border-0 bg-transparent fw-bold mb-4 p-0 shadow-none fs-1 text-body" 
                                            placeholder="Tiêu đề" 
                                            value={noteForm.title} 
                                            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                            disabled={selectedNote.permission !== 'edit'}
                                        />
                                        <textarea 
                                            className="form-control border-0 bg-transparent p-0 shadow-none fs-4 text-body opacity-75" 
                                            rows="12" 
                                            placeholder="Nội dung..." 
                                            style={{ resize: 'none' }} 
                                            value={noteForm.content} 
                                            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                                            disabled={selectedNote.permission !== 'edit'}
                                        ></textarea>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="d-flex flex-column gap-4 h-100">
                                            <section className="bg-light p-3 rounded-4 border">
                                                <h6 className="fw-bold mb-2 d-flex align-items-center text-primary">
                                                    <i className="bi bi-person-circle me-2"></i> Người sở hữu
                                                </h6>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                        <i className="bi bi-person-fill fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{selectedNote.owner_name}</div>
                                                        <div className="text-muted small">{selectedNote.owner_email}</div>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h6 className="fw-bold mb-3 d-flex align-items-center text-primary"><i className="bi bi-tags me-2"></i>Nhãn dán</h6>
                                                {selectedNote.permission === 'edit' && (
                                                    <form onSubmit={handleQuickAddLabel} className="mb-3">
                                                        <div className="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border">
                                                            <input type="text" className="form-control border-0 bg-transparent shadow-none" placeholder="Tạo nhãn mới & gán..." value={quickLabelName} onChange={(e) => setQuickLabelName(e.target.value)} />
                                                            <button className="btn btn-primary border-0" type="submit"><i className="bi bi-plus"></i></button>
                                                        </div>
                                                    </form>
                                                )}
                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    {(allLabels || availableLabels || []).map(label => (
        <button 
            key={label.id} 
            className={`btn btn-sm rounded-pill px-3 transition-all border ${selectedNote.labels?.some(l => l.id === label.id) ? 'btn-primary shadow-sm' : 'btn-light'}`} 
            onClick={() => selectedNote.permission === 'edit' && handleLabelSync(label)}
            disabled={selectedNote.permission !== 'edit'}
        >
            #{label.name}
        </button>
    ))}
</div>
                                            </section>

                                            <section className="flex-grow-1">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center text-primary"><i className="bi bi-images me-2"></i>Hình ảnh</h6>
                                                <div className="row g-2 mb-3">
                                                    {(selectedNote.images || []).map(img => (
                                                        <div key={img.id} className="col-4 position-relative image-manage-group">
                                                            <div className="ratio ratio-1x1 rounded-3 overflow-hidden shadow-sm border bg-body-secondary cursor-zoom-in" onClick={() => setPreviewImage(`/storage/${img.path}`)}><img src={`/storage/${img.path}`} className="object-fit-cover" alt="note" /></div>
                                                            {selectedNote.permission === 'edit' && (
                                                                <div className="position-absolute top-0 end-0 m-1 d-flex flex-column gap-1 opacity-0 image-manage-actions transition-all">
                                                                    <button className="btn btn-danger btn-sm rounded-circle p-1" style={{ width: '24px', height: '24px', fontSize: '0.6rem' }} onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}><i className="bi bi-trash"></i></button>
                                                                    <label className="btn btn-primary btn-sm rounded-circle p-1" style={{ width: '24px', height: '24px', fontSize: '0.6rem', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}><i className="bi bi-arrow-repeat"></i><input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e, img.id)} /></label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {selectedNote.permission === 'edit' && (
                                                        <div className="col-4">
                                                            <label className="btn btn-body-secondary w-100 h-100 d-flex flex-column align-items-center justify-content-center border-dashed rounded-3 p-3 transition-all" style={{ border: '2px dashed #dee2e6', minHeight: '80px', cursor: 'pointer' }}><i className="bi bi-plus-circle text-secondary opacity-50 fs-4"></i><input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e)} /></label>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>

                                            {selectedNote.permission === 'edit' && (
                                                <div className="mt-auto pt-3 border-top">
                                                    <button className="btn btn-outline-danger w-100 rounded-pill fw-bold py-2 mb-3 shadow-none border-opacity-25" onClick={() => confirmDelete(selectedNote)}><i className="bi bi-trash3 me-2"></i>Xóa ghi chú này</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NotePasswordModal 
                show={showPasswordModal} 
                note={pendingNote} 
                onSuccess={handlePasswordSuccess} 
                onCancel={() => { setShowPasswordModal(false); setPendingNote(null); }} 
            />
            <LabelManager show={showLabelManager} labels={availableLabels} onClose={() => setShowLabelManager(false)} />
            <ConfirmationModal show={showDeleteModal} title="Xác nhận xóa" message="Dữ liệu ghi chú và hình ảnh sẽ bị xóa vĩnh viễn. Bạn chắc chắn chứ?" onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />
            <Lightbox image={previewImage} onClose={() => setPreviewImage(null)} />

            <style dangerouslySetInnerHTML={{ __html: `
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .border-dashed { border-style: dashed !important; }
                .image-manage-group:hover .image-manage-actions { opacity: 1 !important; }
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
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
