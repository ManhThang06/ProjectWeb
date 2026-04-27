<!DOCTYPE html>
<html>
<head>
    <style>
        .button {
            background-color: #0d6efd;
            border: none;
            color: white;
            padding: 12px 24px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 8px;
            font-weight: bold;
        }
    </style>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #0d6efd;">Chào mừng {{ $displayName }}!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.</p>
        <p>Để đảm bảo tính bảo mật, vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn. Link này có hiệu lực trong vòng 60 phút.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $url }}" class="button" style="color: white;">Kích hoạt tài khoản</a>
        </div>
        
        <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Trân trọng,<br>Đội ngũ hỗ trợ PJWEB</p>
    </div>
</body>
</html>
