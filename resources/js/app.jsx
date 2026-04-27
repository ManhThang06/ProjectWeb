import '../scss/app.scss';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Register PWA Service Worker
registerSW({
    onNeedRefresh() {
        if (confirm('Ứng dụng có bản cập nhật mới. Tải lại ngay?')) {
            window.location.reload();
        }
    },
    onOfflineReady() {
        console.log('Ứng dụng đã sẵn sàng hoạt động ngoại tuyến!');
    },
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#0d6efd',
    },
});
