module.exports.verifyEmail = (verifyUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify Your Email</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f2f4f6; font-family:Arial, sans-serif;">

  <!-- Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header / Logo -->
    <tr>
      <td style="background-color:#0d6efd; text-align:center; padding:20px;">
        <h1 style="color:#ffffff; margin:0; font-size:24px;">Chat 220</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:30px; color:#333333; line-height:1.5;">
        <p style="font-size:16px; margin-bottom:24px;">
          Hey there! Ready to kick back with our insanely fast AI chat?
        </p>
        <p style="font-size:16px; margin-bottom:32px;">
          To get started, please confirm your email address by clicking the button below:
        </p>

        <!-- Button -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${ verifyUrl }" style="background-color:#0d6efd; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:4px; display:inline-block; font-size:16px;">
                Verify Your Email
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size:14px; color:#777777;">
          This link will expire in <strong>24 hours</strong>. If you didn’t create an account, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color:#f2f4f6; text-align:center; padding:20px; font-size:12px; color:#999999;">
         2025 Chat 220. All rights reserved.<br>
      </td>
    </tr>
  </table>

</body>
</html>

`;