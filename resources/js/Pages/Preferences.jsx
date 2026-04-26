import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Preferences() {
    const { auth } = usePage().props;
    const preferences = auth.user.preferences || { font_size: 'medium', color_scheme: 'blue', theme: 'light' };

    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        font_size: preferences.font_size || 'medium',
        color_scheme: preferences.color_scheme || 'blue',
        theme: preferences.theme || 'light',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('preferences.update'));
    };

    return (
        <BootstrapLayout>
            <Head title="Tùy chọn người dùng" />
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <h2 className="card-title mb-4 fw-bold">Tùy chọn cá nhân</h2>
                            
                            {recentlySuccessful && (
                                <div className="alert alert-success">Đã cập nhật tùy chọn thành công!</div>
                            )}

                            <form onSubmit={submit}>
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Cỡ chữ (Font size)</label>
                                    <div className="d-flex gap-3">
                                        {['small', 'medium', 'large'].map((size) => (
                                            <div key={size} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="font_size"
                                                    id={`font-${size}`}
                                                    value={size}
                                                    checked={data.font_size === size}
                                                    onChange={(e) => setData('font_size', e.target.value)}
                                                />
                                                <label className="form-check-label text-capitalize" htmlFor={`font-${size}`}>
                                                    {size}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Tông màu chủ đạo (Color scheme)</label>
                                    <select 
                                        className="form-select" 
                                        value={data.color_scheme}
                                        onChange={(e) => setData('color_scheme', e.target.value)}
                                    >
                                        <option value="blue">Xanh dương (Blue)</option>
                                        <option value="green">Xanh lá (Green)</option>
                                        <option value="red">Đỏ (Red)</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Chế độ giao diện (Mode)</label>
                                    <div className="d-flex gap-3">
                                        {['light', 'dark'].map((mode) => (
                                            <div key={mode} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="theme"
                                                    id={`theme-${mode}`}
                                                    value={mode}
                                                    checked={data.theme === mode}
                                                    onChange={(e) => setData('theme', e.target.value)}
                                                />
                                                <label className="form-check-label text-capitalize" htmlFor={`theme-${mode}`}>
                                                    {mode}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary btn-lg" disabled={processing}>
                                        Lưu thay đổi
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
