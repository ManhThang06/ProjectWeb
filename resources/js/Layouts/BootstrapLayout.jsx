import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import ActivationWarningBanner from '@/Components/ActivationWarningBanner';

export default function BootstrapLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    
    // Default preferences
    const preferences = user?.preferences || { 
        font_size: 'medium', 
        color_scheme: 'blue', 
        theme: 'light',
        text_color: ''
    };

    useEffect(() => {
        const root = document.documentElement;
        
        // 1. Apply BS5 Theme
        root.setAttribute('data-bs-theme', preferences.theme || 'light');

        // 2. Apply Custom Text Color via CSS Variable (More powerful than direct style)
        if (preferences.text_color) {
            root.style.setProperty('--bs-body-color', preferences.text_color);
            root.style.setProperty('--bs-body-color-rgb', hexToRgb(preferences.text_color));
        } else {
            root.style.removeProperty('--bs-body-color');
            root.style.removeProperty('--bs-body-color-rgb');
        }
        
        // 3. Apply classes for font size and primary theme
        document.body.className = `font-size-${preferences.font_size || 'medium'} theme-${preferences.color_scheme || 'blue'}`;
    }, [preferences]);

    // Helper to convert hex to RGB for BS5 variables
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    }

    return (
        <div className="min-vh-100 d-flex flex-column bg-body text-body transition-all">
            <ActivationWarningBanner />

            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top py-2">
                <div className="container">
                    <Link className="navbar-brand fw-bold d-flex align-items-center" href="/">
                        <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                            <i className="bi bi-journal-text"></i>
                        </div>
                        NotePro
                    </Link>
                    <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto align-items-center gap-1">
                            {user ? (
                                <>
                                    <li className="nav-item">
                                        <Link className={`nav-link px-3 rounded-pill ${route().current('dashboard') ? 'active bg-white bg-opacity-10' : ''}`} href={route('dashboard')}>Ghi chú</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className={`nav-link px-3 rounded-pill ${route().current('settings.edit') ? 'active bg-white bg-opacity-10' : ''}`} href={route('settings.edit')}>
                                            {user.avatar ? (
                                                <img src={`/storage/${user.avatar}`} className="rounded-circle me-1" style={{ width: '20px', height: '20px', objectFit: 'cover' }} />
                                            ) : (
                                                <i className="bi bi-gear-fill me-1"></i>
                                            )}
                                            Cài đặt
                                        </Link>
                                    </li>
                                    <li className="nav-item ms-lg-2">
                                        <Link className="btn btn-outline-light btn-sm rounded-pill px-4 fw-bold border-2" href={route('logout')} method="post" as="button">
                                            Thoát
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" href={route('login')}>Đăng nhập</Link>
                                    </li>
                                    <li className="nav-item ms-lg-2">
                                        <Link className="btn btn-light btn-sm rounded-pill px-4 fw-bold" href={route('register')}>Đăng ký</Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>

            <main className="flex-grow-1 py-4 bg-body-tertiary">
                <div className="container">
                    {children}
                </div>
            </main>

            <footer className="py-4 bg-body border-top text-center opacity-75 small">
                <div className="container">
                    &copy; 2024 NotePro. Phát triển bởi Đội ngũ Senior Full-stack.
                </div>
            </footer>
        </div>
    );
}
