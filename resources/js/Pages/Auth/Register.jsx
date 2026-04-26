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
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <BootstrapLayout>
            <Head title="Đăng ký" />
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4 fw-bold">Đăng ký tài khoản</h2>
                            <form onSubmit={submit}>
                                <div className="mb-3">
                                    <label className="form-label">Tên hiển thị</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.display_name ? 'is-invalid' : ''}`}
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        required
                                    />
                                    {errors.display_name && <div className="invalid-feedback">{errors.display_name}</div>}
                                </div>

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

                                <div className="mb-4">
                                    <label className="form-label">Xác nhận mật khẩu</label>
                                    <input
                                        type="password"
                                        className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                    {errors.password_confirmation && <div className="invalid-feedback">{errors.password_confirmation}</div>}
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary btn-lg" disabled={processing}>
                                        Đăng ký
                                    </button>
                                </div>

                                <div className="mt-3 text-center">
                                    <Link href={route('login')} className="text-decoration-none">Đã có tài khoản? Đăng nhập</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </BootstrapLayout>
    );
}
