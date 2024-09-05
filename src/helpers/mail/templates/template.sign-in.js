export default function SignInMailTemplate(otp) {
    const template = `
        <!DOCTYPE html>
        <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <meta content="width=device-width, initial-scale=1.0" name="viewport" />
            <link href="http://fonts.cdnfonts.com/css/plance" rel="stylesheet" type="text/css">
            <link href="https://fonts.googleapis.com/css?family=Open+Sans" rel="stylesheet" type="text/css" />
        </head>
        <body style="padding: 0; margin: 0; box-sizing: border-box; background-color: #ffffff; -webkit-text-size-adjust: none;
            text-size-adjust: none; font-family: 'Plance', sans-serif !important; color: #000000;">
            <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 5px; padding: 20px;">
                <div class="wrapper" style="max-width: 450px; margin: 0 auto; display: block;">
                    <img style="padding-bottom: 25px;" src="https://res.cloudinary.com/sciensta/image/upload/v1711827969/iSchool/trans_logo1_1_1_t6fiyw.png" width="100"
                        alt="App logo" />
                    <h3 style="font-size: 30px; color: #0038A8;">OTP Verification</h3>
                    <p style="line-height: 30px; padding-bottom: 10px; color: #000000;">Our inbuilt Two Factor Authentication System requires that you confirm your identity with the 6-digit
                        code below in order to complete
                        your
                        login process.</p>
                    <b style="line-height: 30px; padding-bottom: 10px; color: #000000;">Warning: Do not issue the code to any third party</b>
                    <h3 style="letter-spacing: 3px; padding-bottom: 10px; font-size: 30px; color: #0038A8;">${otp}</h3>
                    <p style="line-height: 20px; padding-bottom: 10px; color: #000000;">Thank you</p>
                    <p style="line-height: 20px; padding-bottom: 10px; color: #000000;">EDUMINFO Team</p>
                </div>
            </div>
        </body>
        </html>
    `
    return template
}