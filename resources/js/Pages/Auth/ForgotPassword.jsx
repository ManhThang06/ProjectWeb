import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <BootstrapLayout>
            <Head title="Quên mật khẩu" />
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4 fw-bold">Quên mật khẩu</h2>
                            
                            <div className="mb-4 text-muted small">
                                Quên mật khẩu? Đừng lo lắng. Hãy cho chúng tôi biết địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn link đặt lại mật khẩu.
                            </div>

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
                                        autoFocus
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary" disabled={processing}>
                                        Gửi link đặt lại mật khẩu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </BootstrapLayout>
    );
}
