import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function NoteShareModal({ show, note, onClose }) {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('read');
    const [processing, setProcessing] = useState(false);

    if (!show || !note) return null;

    const handleShare = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('notes.share', note.id), { email, permission }, {
            onSuccess: () => {
                setEmail('');
                setProcessing(false);
            },
            onError: () => setProcessing(false)
        });
    };

    const handleUpdate = (userId, newPermission) => {
        router.patch(route('notes.share.update', [note.id, userId]), { permission: newPermission });
    };

    const handleRevoke = (userId) => {
        if (confirm('Thu hồi quyền truy cập của người dùng này?')) {
            router.patch(route('notes.share.update', [note.id, userId]), { revoke: true });
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                    <div className="modal-header border-0 px-4 pt-4">
                        <h5 className="modal-title fw-bold">Chia sẻ ghi chú</h5>
                        <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
                    </div>
                    <div className="modal-body px-4 pb-4">
                        <form onSubmit={handleShare} className="mb-4">
                            <label className="form-label small fw-bold text-muted">Mời người dùng</label>
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    className="form-control rounded-start-pill ps-3" 
                                    placeholder="Nhập email..." 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <select 
                                    className="form-select border-start-0" 
                                    style={{ maxWidth: '120px' }}
                                    value={permission}
                                    onChange={(e) => setPermission(e.target.value)}
                                >
                                    <option value="read">Xem</option>
                                    <option value="edit">Sửa</option>
                                </select>
                                <button className="btn btn-primary rounded-end-pill px-3" type="submit" disabled={processing}>
                                    {processing ? '...' : 'Gửi'}
                                </button>
                            </div>
                        </form>

                        <div className="shared-list">
                            <h6 className="fw-bold mb-3 small text-muted">Những người có quyền truy cập</h6>
                            <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                                {note.shared_with && note.shared_with.length > 0 ? (
                                    note.shared_with.map(user => (
                                        <div key={user.id} className="list-group-item d-flex align-items-center justify-content-between py-3">
                                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                <div className="bg-light rounded-circle p-2 text-primary">
                                                    <i className="bi bi-person"></i>
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="fw-bold small text-truncate">{user.display_name}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user.email}</div>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <select 
                                                    className="form-select form-select-sm border-0 bg-light rounded-pill px-3 py-1"
                                                    value={user.pivot.permission}
                                                    onChange={(e) => handleUpdate(user.id, e.target.value)}
                                                    style={{ width: '80px', fontSize: '0.75rem' }}
                                                >
                                                    <option value="read">Xem</option>
                                                    <option value="edit">Sửa</option>
                                                </select>
                                                <button className="btn btn-link text-danger btn-sm p-0 border-0" onClick={() => handleRevoke(user.id)}>
                                                    <i className="bi bi-x-circle"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="list-group-item text-center py-4 text-muted small">
                                        Ghi chú này chưa được chia sẻ với ai.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
