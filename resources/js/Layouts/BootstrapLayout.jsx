import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ActivationWarningBanner from '@/Components/ActivationWarningBanner';

export default function BootstrapLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    // --- Tab Animation Logic ---
    // For Guests
    const guestTab = route().current('register') ? 'register' : 'login';
    const [guestSliderPos, setGuestSliderPos] = useState(() => {
        const last = sessionStorage.getItem('last_guest_tab');
        return last === 'register' ? 'calc(50%)' : '4px';
    });

    // For Auth Users
    const authTab = route().current('settings.edit') ? 'settings' : 'dashboard';
    const [authSliderPos, setAuthSliderPos] = useState(() => {
        const last = sessionStorage.getItem('last_auth_tab');
        return last === 'settings' ? 'calc(50%)' : '4px';
    });

    useEffect(() => {
        // Animation delay to ensure mount is complete
        const timer = setTimeout(() => {
            setGuestSliderPos(guestTab === 'register' ? 'calc(50%)' : '4px');
            setAuthSliderPos(authTab === 'settings' ? 'calc(50%)' : '4px');
        }, 50);

        sessionStorage.setItem('last_guest_tab', guestTab);
        sessionStorage.setItem('last_auth_tab', authTab);

        return () => clearTimeout(timer);
    }, [guestTab, authTab]);
    // ----------------------------
    
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
                                <li className="nav-item ms-lg-3">
                                    <div className="d-flex bg-white bg-opacity-25 rounded-pill p-1 position-relative" style={{ width: '240px', height: '40px' }}>
                                        {/* Sliding Background */}
                                        <div 
                                            className="position-absolute bg-white rounded-pill shadow-sm" 
                                            style={{ 
                                                width: 'calc(50% - 4px)', 
                                                height: '32px', 
                                                top: '4px', 
                                                left: authSliderPos, 
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                zIndex: 0,
                                                opacity: route().current('notes.shared-with-me') ? 0 : 1
                                            }} 
                                        />
                                        
                                        <Link 
                                            href={route('dashboard')} 
                                            className={`flex-fill d-flex align-items-center justify-content-center text-decoration-none rounded-pill position-relative z-1 transition-all ${route().current('dashboard') && !route().current('notes.shared-with-me') ? 'text-primary fw-bold' : 'text-white'}`}
                                            style={{ fontSize: '0.9rem' }}
                                        >
                                            <i className="bi bi-journal-text me-2"></i> Ghi chú
                                        </Link>
                                        
                                        <Link 
                                            href={route('settings.edit')} 
                                            className={`flex-fill d-flex align-items-center justify-content-center text-decoration-none rounded-pill position-relative z-1 transition-all ${route().current('settings.edit') ? 'text-primary fw-bold' : 'text-white'}`}
                                            style={{ fontSize: '0.9rem' }}
                                        >
                                            <i className="bi bi-gear-fill me-2"></i> Cài đặt
                                        </Link>
                                    </div>
                                </li>
                            ) : (
                                <li className="nav-item ms-lg-3">
                                    <div className="d-flex bg-white bg-opacity-25 rounded-pill p-1 position-relative" style={{ width: '210px', height: '40px' }}>
                                        {/* Sliding Background */}
                                        <div 
                                            className="position-absolute bg-white rounded-pill shadow-sm" 
                                            style={{ 
                                                width: 'calc(50% - 4px)', 
                                                height: '32px', 
                                                top: '4px', 
                                                left: guestSliderPos, 
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                zIndex: 0
                                            }} 
                                        />
                                        
                                        <Link 
                                            href={route('login')} 
                                            className={`flex-fill d-flex align-items-center justify-content-center text-decoration-none rounded-pill position-relative z-1 transition-all ${route().current('login') || (!route().current('login') && !route().current('register')) ? 'text-primary fw-bold' : 'text-white'}`}
                                            style={{ fontSize: '0.9rem' }}
                                        >
                                            Đăng nhập
                                        </Link>
                                        
                                        <Link 
                                            href={route('register')} 
                                            className={`flex-fill d-flex align-items-center justify-content-center text-decoration-none rounded-pill position-relative z-1 transition-all ${route().current('register') ? 'text-primary fw-bold' : 'text-white'}`}
                                            style={{ fontSize: '0.9rem' }}
                                        >
                                            Đăng ký
                                        </Link>
                                    </div>
                                </li>
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
