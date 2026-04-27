TRƯỜNG ĐẠI HỌC ... (Vui lòng điền tên trường)
KHOA CÔNG NGHỆ THÔNG TIN
--------------------------------------------------
ĐỒ ÁN: HỆ THỐNG QUẢN LÝ GHI CHÚ THÔNG MINH (SMART NOTES)
Sinh viên thực hiện: Nguyễn Mạnh Thắng
Mã số sinh viên: 52400036
--------------------------------------------------

1. GIỚI THIỆU DỰ ÁN
Ứng dụng quản lý ghi chú được xây dựng trên nền tảng Laravel 12 (Backend) và React JS (Frontend).
Các tính năng chính:
- Quản lý ghi chú (Thêm, Sửa, Xóa, Ghim).
- Bảo mật ghi chú bằng mật khẩu riêng.
- Chia sẻ ghi chú giữa các người dùng.
- Gán nhãn (Labels) và phân loại.
- Hỗ trợ PWA (Progressive Web App): Hoạt động ngoại tuyến (Offline Mode) và đồng bộ dữ liệu khi có mạng trở lại.
- Real-time Collaboration: Tự động cập nhật nội dung khi có nhiều người cùng chỉnh sửa.

2. YÊU CẦU HỆ THỐNG
- Docker Desktop (Khuyên dùng để chạy nhanh nhất).
- Hoặc cài đặt thủ công: PHP >= 8.2, Node.js >= 18, MySQL.

3. HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN (DÙNG DOCKER)
Bước 1: Mở Terminal tại thư mục gốc của project.
Bước 2: Chạy lệnh build và khởi động container:
   docker-compose up -d --build
Bước 3: Cài đặt thư viện và khởi tạo dữ liệu (Chỉ chạy lần đầu):
   docker-compose exec app composer install
   docker-compose exec app php artisan key:generate
   docker-compose exec app php artisan migrate --seed
Bước 4: Truy cập ứng dụng tại: http://localhost:8000

4. TÀI KHOẢN TRẢI NGHIỆM (TEST ACCOUNTS)
Hệ thống đã được seed sẵn các tài khoản sau:
- Tài khoản 1: test@example.com / password
- Tài khoản 2: user@example.com / password

5. TÍNH NĂNG NÂNG CAO (PWA & OFFLINE)
- Ứng dụng có thể "Cài đặt" (Install) vào điện thoại hoặc máy tính như một phần mềm độc lập.
- Khi mất mạng: Bạn vẫn có thể xem và tạo ghi chú mới. Dữ liệu được lưu an toàn vào IndexedDB của trình duyệt.
- Khi có mạng: Hệ thống tự động đẩy các thay đổi lên Server.

6. HƯỚNG DẪN DỌN DẸP TRƯỚC KHI NÉN ZIP
Để giảm dung lượng file khi nộp bài (tránh nộp node_modules và vendor), hãy chạy lệnh sau:
- Windows (PowerShell):
  rm -r -Force node_modules, vendor, storage/framework/views/*, .env
- Linux/Mac:
  rm -rf node_modules vendor .env

--------------------------------------------------
Cảm ơn Giảng viên đã xem xét đồ án này!
