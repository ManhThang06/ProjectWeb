import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function SharedNotes({ notes }) {
    return (
        <BootstrapLayout>
            <Head title="Ghi chú được chia sẻ" />
            
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h2 className="fw-bold mb-1">Ghi chú được chia sẻ</h2>
                        <p className="text-muted">Các ghi chú mà người khác đã chia sẻ với bạn</p>
                    </div>
                    <Link href={route('dashboard')} className="btn btn-light rounded-pill px-4 border shadow-sm">
                        <i className="bi bi-arrow-left me-2"></i>Quay lại của tôi
                    </Link>
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
                                                <Link 
                                                    href={route('dashboard', { open: note.id, from: 'shared' })} 
                                                    className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
                                                >
                                                    Mở ngay
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            `}} />
        </BootstrapLayout>
    );
}
