import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function BootstrapLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const preferences = user?.preferences || { font_size: 'medium', color_scheme: 'blue', theme: 'light' };

    useEffect(() => {
        // Apply preferences
        document.documentElement.setAttribute('data-bs-theme', preferences.theme || 'light');
        document.body.className = `font-size-${preferences.font_size || 'medium'} color-scheme-${preferences.color_scheme || 'blue'}`;
    }, [preferences]);

    return (
        <div className="min-vh-100 d-flex flex-column">
            {user && !user.is_active && (
                <div className="alert alert-warning alert-dismissible fade show rounded-0 mb-0 text-center" role="alert">
                    <strong>Cảnh báo!</strong> Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt.
                </div>
            )}

            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
                <div className="container">
                    <Link className="navbar-brand fw-bold" href="/">Account Manager</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            {user ? (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" href={route('dashboard')}>Dashboard</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" href={route('preferences')}>Tùy chọn</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" href={route('logout')} method="post" as="button">Đăng xuất</Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" href={route('login')}>Đăng nhập</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" href={route('register')}>Đăng ký</Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>

            <main className="flex-grow-1 py-4 bg-light">
                <div className="container">
                    {children}
                </div>
            </main>

            <footer className="py-3 bg-white border-top text-center text-muted">
                &copy; 2024 Account Management System
            </footer>
        </div>
    );
}
