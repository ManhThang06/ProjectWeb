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
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4 fw-bold">Đăng nhập</h2>
                            
                            {status && <div className="alert alert-success mb-4">{status}</div>}

                            <form onSubmit={submit}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Mật khẩu</label>
                                    <input
                                        type="password"
                                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                </div>

                                <div className="mb-3 form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="remember">Ghi nhớ đăng nhập</label>
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary btn-lg" disabled={processing}>
                                        Đăng nhập
                                    </button>
                                </div>

                                <div className="mt-3 d-flex justify-content-between">
                                    {canResetPassword && (
                                        <Link href={route('password.request')} className="text-decoration-none small">Quên mật khẩu?</Link>
                                    )}
                                    <Link href={route('register')} className="text-decoration-none small">Tạo tài khoản mới</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </BootstrapLayout>
    );
}
