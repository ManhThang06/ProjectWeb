import { useState } from 'react';
import axios from 'axios';

export default function NotePasswordModal({ show, note, onSuccess, onCancel }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!show || !note) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(route('notes.verify-password', note.id), { password });
            if (response.data.success) {
                onSuccess(password);
                setPassword('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Mật khẩu không đúng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content border-0 shadow rounded-4 p-3">
                    <div className="modal-header border-0 text-center d-block pt-4 pb-0">
                        <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-lock-fill fs-2"></i>
                        </div>
                        <h5 className="modal-title fw-bold">Ghi chú đã bị khóa</h5>
                        <p className="text-muted small mt-2">Vui lòng nhập mật khẩu để tiếp tục</p>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <input 
                                    type="password" 
                                    className={`form-control rounded-pill text-center ${error ? 'is-invalid' : ''}`} 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    required
                                />
                                {error && <div className="invalid-feedback text-center mt-2">{error}</div>}
                            </div>
                            <div className="d-grid gap-2">
                                <button type="submit" className="btn btn-primary rounded-pill fw-bold" disabled={loading}>
                                    {loading ? 'Đang kiểm tra...' : 'Xác nhận'}
                                </button>
                                <button type="button" className="btn btn-link text-secondary text-decoration-none small" onClick={onCancel}>
                                    Hủy bỏ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
