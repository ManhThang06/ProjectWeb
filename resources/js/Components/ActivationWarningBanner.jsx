import { usePage } from '@inertiajs/react';

export default function ActivationWarningBanner() {
    const { auth } = usePage().props;
    const user = auth.user;

    // Chỉ hiển thị nếu người dùng đã đăng nhập nhưng chưa kích hoạt (is_active === false)
    if (!user || user.is_active) {
        return null;
    }

    return (
        <div className="alert alert-warning alert-dismissible fade show border-0 rounded-0 mb-0 shadow-sm" role="alert" style={{ zIndex: 1050 }}>
            <div className="container d-flex align-items-center justify-content-between">
                <div>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Tài khoản chưa kích hoạt!</strong> Vui lòng kiểm tra email <b>{user.email}</b> để nhận liên kết kích hoạt tài khoản. 
                    Bạn cần kích hoạt để sử dụng đầy đủ các tính năng.
                </div>
                <button type="button" className="btn btn-sm btn-outline-dark rounded-pill px-3 fw-bold" onClick={() => window.location.reload()}>
                    Tôi đã kích hoạt
                </button>
            </div>
        </div>
    );
}
