import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <BootstrapLayout>
            <Head title="Đăng nhập" />
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <h2 className="fw-bold text-primary">Đăng nhập</h2>
                                    <p className="text-muted">Chào mừng bạn quay trở lại!</p>
                                </div>
                                
                                {status && <div className="alert alert-success mb-4">{status}</div>}

                                <form onSubmit={submit}>
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

                                    <div className="mb-3 d-flex justify-content-between align-items-center">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                name="remember"
                                                className="form-check-input"
                                                id="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                            />
                                            <label className="form-check-label small text-muted" htmlFor="remember">Ghi nhớ đăng nhập</label>
                                        </div>
                                        {canResetPassword && (
                                            <Link href={route('password.request')} className="text-primary text-decoration-none small">Quên mật khẩu?</Link>
                                        )}
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
                                                'Đăng nhập'
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <span className="text-muted small">Chưa có tài khoản? </span>
                                        <Link href={route('register')} className="text-primary fw-bold text-decoration-none small">Tạo tài khoản mới</Link>
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
