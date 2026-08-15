const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "FACADE <onboarding@resend.dev>",
            to: [to],
            subject: subject,
            html: html
        });

        if (error) {
            console.error("❌ Resend email error:", error);
            return { success: false, error };
        }

        console.log(`📧 Email sent successfully to ${to}`);
        console.log("Resend ID:", data.id);

        return { success: true, data };

    } catch (err) {
        console.error("❌ Email service error:", err);
        return { success: false, error: err };
    }
};

module.exports = { sendEmail };