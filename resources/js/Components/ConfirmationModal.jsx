import { useState } from 'react';

export default function ConfirmationModal({ show, onConfirm, onCancel, title, message }) {
    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1080 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header border-0">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button type="button" className="btn-close" onClick={onCancel}></button>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                    </div>
                    <div className="modal-footer border-0">
                        <button type="button" className="btn btn-light" onClick={onCancel}>Hủy</button>
                        <button type="button" className="btn btn-danger" onClick={onConfirm}>Xóa</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
