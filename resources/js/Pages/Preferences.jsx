import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Preferences() {
    const { auth } = usePage().props;
    const preferences = auth.user.preferences || { 
        font_size: 'medium', 
        color_scheme: 'blue', 
        theme: 'light',
        text_color: '#000000'
    };

    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        font_size: preferences.font_size || 'medium',
        color_scheme: preferences.color_scheme || 'blue',
        theme: preferences.theme || 'light',
        text_color: preferences.text_color || (preferences.theme === 'dark' ? '#ffffff' : '#000000'),
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('preferences.update'));
    };

    return (
        <BootstrapLayout>
            <Head title="Cài đặt giao diện" />
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-4">
                            <h3 className="card-title mb-4 fw-bold text-body">Tùy chỉnh giao diện</h3>
                            
                            {recentlySuccessful && (
                                <div className="alert alert-success border-0 shadow-sm mb-4">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    Đã cập nhật tùy chọn thành công!
                                </div>
                            )}

                            <form onSubmit={submit}>
                                {/* Fix 2: Mode Sáng/Tối chuẩn BS5 */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-body">Chế độ hiển thị</label>
                                    <div className="row g-2">
                                        {['light', 'dark'].map((mode) => (
                                            <div key={mode} className="col-6">
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="theme"
                                                    id={`theme-${mode}`}
                                                    value={mode}
                                                    checked={data.theme === mode}
                                                    onChange={(e) => setData('theme', e.target.value)}
                                                />
                                                <label className={`btn w-100 py-3 rounded-3 border-2 ${data.theme === mode ? 'btn-outline-primary' : 'btn-outline-secondary'}`} htmlFor={`theme-${mode}`}>
                                                    <i className={`bi bi-${mode === 'light' ? 'sun' : 'moon-stars'}-fill me-2`}></i>
                                                    {mode === 'light' ? 'Sáng' : 'Tối'}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fix 1: Tách biệt Màu chữ và Màu chủ đạo */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-body">Màu chữ (Text Color)</label>
                                        <div className="d-flex align-items-center gap-2 p-2 border rounded-3 bg-body">
                                            <input 
                                                type="color" 
                                                className="form-control form-control-color border-0 p-0" 
                                                value={data.text_color}
                                                onChange={(e) => setData('text_color', e.target.value)}
                                                title="Chọn màu chữ"
                                            />
                                            <span className="small text-muted">{data.text_color.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold text-body">Tông màu chủ đạo</label>
                                        <select 
                                            className="form-select py-2 border-2 rounded-3" 
                                            value={data.color_scheme}
                                            onChange={(e) => setData('color_scheme', e.target.value)}
                                        >
                                            <option value="blue">Xanh dương</option>
                                            <option value="green">Xanh lá</option>
                                            <option value="red">Đỏ</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold text-body">Kích thước phông chữ</label>
                                    <div className="btn-group w-100 shadow-sm rounded-3">
                                        {['small', 'medium', 'large'].map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                className={`btn py-2 ${data.font_size === size ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => setData('font_size', size)}
                                            >
                                                {size === 'small' ? 'Nhỏ' : size === 'medium' ? 'Vừa' : 'Lớn'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="d-grid mt-5">
                                    <button type="submit" className="btn btn-primary btn-lg rounded-pill fw-bold" disabled={processing}>
                                        <i className="bi bi-save2 me-2"></i>
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
