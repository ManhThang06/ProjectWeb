import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function LabelManager({ show, labels, onClose }) {
    const [newLabel, setNewLabel] = useState('');
    const [editingLabel, setEditingLabel] = useState(null);
    const [editName, setEditName] = useState('');

    if (!show) return null;

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        router.post(route('labels.store'), { name: newLabel }, {
            onSuccess: () => setNewLabel('')
        });
    };

    const handleUpdate = (label) => {
        if (!editName.trim()) return;
        router.patch(route('labels.update', label.id), { name: editName }, {
            onSuccess: () => setEditingLabel(null)
        });
    };

    const handleDelete = (id) => {
        if (confirm('Xóa nhãn này sẽ gỡ nó khỏi tất cả ghi chú. Tiếp tục?')) {
            router.delete(route('labels.destroy', id));
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Quản lý nhãn</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleAdd} className="mb-4">
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Tạo nhãn mới..." 
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                                <button className="btn btn-primary" type="submit">Thêm</button>
                            </div>
                        </form>

                        <div className="list-group list-group-flush">
                            {labels.map(label => (
                                <div key={label.id} className="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                                    {editingLabel === label.id ? (
                                        <div className="input-group">
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm" 
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                            <button className="btn btn-sm btn-success" onClick={() => handleUpdate(label)}>OK</button>
                                            <button className="btn btn-sm btn-light" onClick={() => setEditingLabel(null)}>X</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{label.name}</span>
                                            <div className="btn-group">
                                                <button className="btn btn-sm btn-link text-muted" onClick={() => { setEditingLabel(label.id); setEditName(label.name); }}>
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button className="btn btn-sm btn-link text-danger" onClick={() => handleDelete(label.id)}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
