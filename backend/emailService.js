const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

const apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async ({ to, subject, html }) => {
    try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;

        sendSmtpEmail.sender = {
            name: "FACADE",
            email: process.env.BREVO_SENDER_EMAIL
        };

        sendSmtpEmail.to = [
            {
                email: to
            }
        ];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

        console.log(`📧 Email sent successfully to ${to}`);
        console.log("Brevo response:", data);

        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.error("❌ Brevo email error:", error);

        return {
            success: false,
            error: error
        };
    }
};

module.exports = { sendEmail };