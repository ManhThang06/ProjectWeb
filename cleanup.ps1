# Script dọn dẹp project trước khi nén file .zip nộp bài
Write-Host "Đang bắt đầu dọn dẹp project..." -ForegroundColor Cyan

$targets = @("node_modules", "vendor", ".env", "storage/framework/views/*", "storage/framework/cache/*", "storage/framework/sessions/*")

foreach ($target in $targets) {
    if (Test-Path $target) {
        Write-Host "Đang xóa: $target" -ForegroundColor Yellow
        Remove-Item -Path $target -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Hoàn tất! Bây giờ bạn có thể nén thư mục project thành file .zip để nộp." -ForegroundColor Green
Write-Host "Lưu ý: Sau khi nén xong, bạn cần chạy 'composer install' và 'npm install' lại nếu muốn tiếp tục code." -ForegroundColor Magenta
