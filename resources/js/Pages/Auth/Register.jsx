import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        display_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        
        // Ngăn chặn spam click bằng cách kiểm tra trạng thái processing của Inertia
        if (processing) return;

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <BootstrapLayout>
            <Head title="Đăng ký" />
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold text-primary">Đăng ký</h2>
                                    <p className="text-muted">Tham gia cùng chúng tôi ngay hôm nay!</p>
                                </div>
                                
                                <form onSubmit={submit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Tên hiển thị</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-person"></i></span>
                                            <input
                                                type="text"
                                                className={`form-control bg-light border-start-0 shadow-none ${errors.display_name ? 'is-invalid' : ''}`}
                                                value={data.display_name}
                                                onChange={(e) => setData('display_name', e.target.value)}
                                                placeholder="Nhập tên của bạn"
                                                required
                                            />
                                        </div>
                                        {errors.display_name && <div className="text-danger small mt-1">{errors.display_name}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Email</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope"></i></span>
                                            <input
                                                type="email"
                                                className={`form-control bg-light border-start-0 shadow-none ${errors.email ? 'is-invalid' : ''}`}
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="example@gmail.com"
                                                required
                                            />
                                        </div>
                                        {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Mật khẩu</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock"></i></span>
                                            <input
                                                type="password"
                                                className={`form-control bg-light border-start-0 shadow-none ${errors.password ? 'is-invalid' : ''}`}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="********"
                                                required
                                            />
                                        </div>
                                        {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">Xác nhận mật khẩu</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-shield-check"></i></span>
                                            <input
                                                type="password"
                                                className={`form-control bg-light border-start-0 shadow-none ${errors.password_confirmation ? 'is-invalid' : ''}`}
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                placeholder="Nhập lại mật khẩu"
                                                required
                                            />
                                        </div>
                                        {errors.password_confirmation && <div className="text-danger small mt-1">{errors.password_confirmation}</div>}
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary btn-lg rounded-3 fw-bold py-3 transition-all shadow-sm" 
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                'Tham gia ngay'
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <span className="text-muted small">Đã có tài khoản? </span>
                                        <Link href={route('login')} className="text-primary fw-bold text-decoration-none small">Đăng nhập</Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .transition-all { transition: all 0.2s ease-in-out; }
                .btn-primary:active { transform: scale(0.98); }
            `}} />
        </BootstrapLayout>
    );
}
