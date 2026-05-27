<!DOCTYPE html>
<html>
<head>
    <title>Password Change Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{{ asset('images/OSeM.png') }}" alt="Aman@UIAM" style="height: 60px;">
            <h2 style="color: #D4A853;">Aman@UIAM Security</h2>
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 10px;">
            <h3>Hello {{ $name }},</h3>
            <p>You requested to change your password. Please use the verification code below:</p>

            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #D4A853; color: white; padding: 10px 20px; border-radius: 8px;">
                    {{ $code }}
                </span>
            </div>

            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email or contact support.</p>

            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Aman@UIAM Security Management System</p>
        </div>
    </div>
</body>
</html>
