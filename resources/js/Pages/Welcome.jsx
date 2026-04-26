import BootstrapLayout from '@/Layouts/BootstrapLayout';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <BootstrapLayout>
            <Head title="Chào mừng" />
            <div className="py-5 text-center bg-white rounded shadow-sm">
                <h1 className="display-3 fw-bold text-primary mb-3">Hệ thống Quản lý Tài khoản</h1>
                <p className="lead mb-4">Giải pháp toàn diện cho việc quản lý tài khoản và tùy chọn người dùng.</p>
                
                {auth.user ? (
                    <Link href={route('dashboard')} className="btn btn-primary btn-lg px-4 gap-3">Vào Dashboard</Link>
                ) : (
                    <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                        <Link href={route('login')} className="btn btn-primary btn-lg px-4 gap-3">Đăng nhập</Link>
                        <Link href={route('register')} className="btn btn-outline-secondary btn-lg px-4">Đăng ký ngay</Link>
                    </div>
                )}
            </div>
        </BootstrapLayout>
    );
}
