import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { useState, useRef } from 'react';
import axios from 'axios';

export default function Settings({ status }) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('account');
    const avatarInput = useRef();
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Account Form
    const accountForm = useForm({
        display_name: auth.user.display_name || '',
    });

    // Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Appearance Form
    const preferences = auth.user.preferences || { 
        font_size: 'medium', 
        color_scheme: 'blue', 
        theme: 'light',
        text_color: '#000000'
    };
    const appearanceForm = useForm({
        font_size: preferences.font_size || 'medium',
        color_scheme: preferences.color_scheme || 'blue',
        theme: preferences.theme || 'light',
        text_color: preferences.text_color || (preferences.theme === 'dark' ? '#ffffff' : '#000000'),
    });

    const updateAccount = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('display_name', accountForm.data.display_name);
        if (accountForm.data.avatar) {
            formData.append('avatar', accountForm.data.avatar);
        }
        // Thêm _method=POST để route nhận đúng
        formData.append('_method', 'POST');

        setIsUploadingAvatar(true);
        try {
            await axios.post(route('profile.update'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Reload lại trang để cập nhật thông tin mới
            router.reload({ only: ['auth'] });
        } catch (err) {
            console.error('Cập nhật thất bại', err);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const updatePassword = (e) => {
        e.preventDefault();
        passwordForm.post(route('profile.password.update'), {
            onSuccess: () => passwordForm.reset(),
            preserveScroll: true,
        });
    };

    const updateAppearance = (e) => {
        e.preventDefault();
        appearanceForm.patch(route('preferences.update'), {
            preserveScroll: true,
        });
    };

    return (
        <BootstrapLayout>
            <Head title="Cài đặt" />
            
            <div className="container py-4">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3 mb-4">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="list-group list-group-flush border-0">
                                <button 
                                    className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center gap-3 ${activeTab === 'account' ? 'active bg-primary text-white' : ''}`}
                                    onClick={() => setActiveTab('account')}
                                >
                                    <i className="bi bi-person-circle fs-5"></i>
                                    Tài khoản
                                </button>
                                <button 
                                    className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center gap-3 ${activeTab === 'security' ? 'active bg-primary text-white' : ''}`}
                                    onClick={() => setActiveTab('security')}
                                >
                                    <i className="bi bi-shield-lock fs-5"></i>
                                    Bảo mật
                                </button>
                                <button 
                                    className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center gap-3 ${activeTab === 'appearance' ? 'active bg-primary text-white' : ''}`}
                                    onClick={() => setActiveTab('appearance')}
                                >
                                    <i className="bi bi-palette fs-5"></i>
                                    Tùy chỉnh giao diện
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9">
                        {status && (
                            <div className="alert alert-success border-0 shadow-sm rounded-4 mb-4">
                                <i className="bi bi-check-circle-fill me-2"></i> {status}
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-body p-4 p-lg-5">
                                
                                {/* Account Tab */}
                                {activeTab === 'account' && (
                                    <div className="animate-fade-in">
                                        <h4 className="fw-bold mb-4">Thông tin tài khoản</h4>
                                        <form onSubmit={updateAccount}>
                                            <div className="text-center mb-5">
                                                <div className="position-relative d-inline-block">
                                                    <img 
                                                        src={avatarPreview || (auth.user.avatar ? `/storage/${auth.user.avatar}` : `https://ui-avatars.com/api/?name=${auth.user.display_name}&background=random&size=128`)} 
                                                        alt="Avatar" 
                                                        className="rounded-circle shadow-sm border border-4 border-white"
                                                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 shadow"
                                                        onClick={() => avatarInput.current.click()}
                                                    >
                                                        <i className="bi bi-camera-fill"></i>
                                                    </button>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    ref={avatarInput} 
                                                    className="d-none" 
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            accountForm.setData('avatar', file);
                                                            setAvatarPreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                                <h5 className="mt-3 fw-bold">{auth.user.display_name}</h5>
                                                {accountForm.data.avatar && <div className="text-primary small mt-1">Đã chọn file: {accountForm.data.avatar.name}</div>}
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-bold small text-uppercase text-secondary">Tên hiển thị</label>
                                                <input 
                                                    type="text" 
                                                    className={`form-control form-control-lg rounded-3 border-2 ${accountForm.errors.display_name ? 'is-invalid' : ''}`}
                                                    value={accountForm.data.display_name}
                                                    onChange={(e) => accountForm.setData('display_name', e.target.value)}
                                                />
                                                {accountForm.errors.display_name && <div className="invalid-feedback">{accountForm.errors.display_name}</div>}
                                            </div>

                                            <button type="submit" className="btn btn-primary px-4 py-2 rounded-pill fw-bold" disabled={isUploadingAvatar}>
                                                {isUploadingAvatar ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang lưu...</> : 'Lưu thay đổi'}
                                            </button>
                                        </form>

                                        <hr className="my-5 opacity-25" />
                                        <div className="d-flex align-items-center justify-content-between p-4 bg-danger bg-opacity-10 rounded-4 border border-danger border-opacity-10">
                                            <div>
                                                <h6 className="fw-bold text-danger mb-1">Đăng xuất khỏi thiết bị</h6>
                                                <p className="text-muted small mb-0">Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng NotePro.</p>
                                            </div>
                                            <Link 
                                                href={route('logout')} 
                                                method="post" 
                                                as="button" 
                                                className="btn btn-danger px-4 rounded-pill fw-bold shadow-sm"
                                            >
                                                <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Security Tab */}
                                {activeTab === 'security' && (
                                    <div className="animate-fade-in">
                                        <h4 className="fw-bold mb-4">Cài đặt bảo mật</h4>
                                        
                                        <div className="mb-5">
                                            <label className="form-label fw-bold small text-uppercase text-secondary">Địa chỉ Email</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0 px-3"><i className="bi bi-envelope"></i></span>
                                                <input type="email" className="form-control bg-light border-0 py-2" value={auth.user.email} disabled />
                                            </div>
                                            <div className="form-text mt-2 text-warning"><i className="bi bi-info-circle me-1"></i> Email không thể thay đổi sau khi đăng ký.</div>
                                        </div>

                                        <hr className="my-4 opacity-50" />

                                        <form onSubmit={updatePassword}>
                                            <h5 className="fw-bold mb-3">Thay đổi mật khẩu</h5>
                                            
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold text-secondary">Mật khẩu hiện tại</label>
                                                <input 
                                                    type="password" 
                                                    className={`form-control rounded-3 ${passwordForm.errors.current_password ? 'is-invalid' : ''}`}
                                                    value={passwordForm.data.current_password}
                                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                                />
                                                {passwordForm.errors.current_password && <div className="invalid-feedback">{passwordForm.errors.current_password}</div>}
                                            </div>

                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold text-secondary">Mật khẩu mới</label>
                                                    <input 
                                                        type="password" 
                                                        className={`form-control rounded-3 ${passwordForm.errors.password ? 'is-invalid' : ''}`}
                                                        value={passwordForm.data.password}
                                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                                    />
                                                    {passwordForm.errors.password && <div className="invalid-feedback">{passwordForm.errors.password}</div>}
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold text-secondary">Xác nhận mật khẩu mới</label>
                                                    <input 
                                                        type="password" 
                                                        className="form-control rounded-3"
                                                        value={passwordForm.data.password_confirmation}
                                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button type="submit" className="btn btn-warning px-4 py-2 rounded-pill fw-bold" disabled={passwordForm.processing}>
                                                Cập nhật mật khẩu
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Appearance Tab */}
                                {activeTab === 'appearance' && (
                                    <div className="animate-fade-in">
                                        <h4 className="fw-bold mb-4">Tùy chỉnh giao diện</h4>
                                        <form onSubmit={updateAppearance}>
                                            {/* Mode Sáng/Tối */}
                                            <div className="mb-4">
                                                <label className="form-label fw-bold small text-uppercase text-secondary">Chế độ hiển thị</label>
                                                <div className="row g-2">
                                                    {['light', 'dark'].map((mode) => (
                                                        <div key={mode} className="col-6">
                                                            <input
                                                                type="radio"
                                                                className="btn-check"
                                                                name="theme"
                                                                id={`theme-${mode}`}
                                                                value={mode}
                                                                checked={appearanceForm.data.theme === mode}
                                                                onChange={(e) => appearanceForm.setData('theme', e.target.value)}
                                                            />
                                                            <label className={`btn w-100 py-3 rounded-3 border-2 ${appearanceForm.data.theme === mode ? 'btn-outline-primary' : 'btn-outline-secondary'}`} htmlFor={`theme-${mode}`}>
                                                                <i className={`bi bi-${mode === 'light' ? 'sun' : 'moon-stars'}-fill me-2`}></i>
                                                                {mode === 'light' ? 'Sáng' : 'Tối'}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Màu sắc & Kích thước */}
                                            <div className="row g-4 mb-4">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small text-uppercase text-secondary">Màu chữ</label>
                                                    <div className="d-flex align-items-center gap-2 p-2 border rounded-3 bg-body">
                                                        <input 
                                                            type="color" 
                                                            className="form-control form-control-color border-0 p-0" 
                                                            value={appearanceForm.data.text_color}
                                                            onChange={(e) => appearanceForm.setData('text_color', e.target.value)}
                                                        />
                                                        <span className="small text-muted">{appearanceForm.data.text_color.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold small text-uppercase text-secondary">Tông màu chủ đạo</label>
                                                    <select 
                                                        className="form-select border-2 rounded-3 py-2" 
                                                        value={appearanceForm.data.color_scheme}
                                                        onChange={(e) => appearanceForm.setData('color_scheme', e.target.value)}
                                                    >
                                                        <option value="blue">Xanh dương</option>
                                                        <option value="green">Xanh lá</option>
                                                        <option value="red">Đỏ</option>
                                                        <option value="orange">Cam</option>
                                                        <option value="purple">Tím</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-5">
                                                <label className="form-label fw-bold small text-uppercase text-secondary">Kích thước phông chữ</label>
                                                <div className="btn-group w-100 rounded-3 shadow-sm overflow-hidden">
                                                    {['small', 'medium', 'large'].map((size) => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            className={`btn py-2 ${appearanceForm.data.font_size === size ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                            onClick={() => appearanceForm.setData('font_size', size)}
                                                        >
                                                            {size === 'small' ? 'Nhỏ' : size === 'medium' ? 'Vừa' : 'Lớn'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button type="submit" className="btn btn-primary px-4 py-2 rounded-pill fw-bold" disabled={appearanceForm.processing}>
                                                Cập nhật giao diện
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .list-group-item.active {
                    z-index: 2;
                    color: #fff;
                    background-color: var(--bs-primary);
                    border-color: var(--bs-primary);
                }
            `}} />
        </BootstrapLayout>
    );
}
