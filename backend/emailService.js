const sendEmail = async ({ to, subject, html }) => {
    try {
        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    sender: {
                        name: "FACADE",
                        email: process.env.BREVO_SENDER_EMAIL
                    },
                    to: [
                        {
                            email: to
                        }
                    ],
                    subject: subject,
                    htmlContent: html
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Brevo email error:", data);

            return {
                success: false,
                error: data
            };
        }

        console.log(`📧 Email sent successfully to ${to}`);
        console.log("Brevo response:", data);

        return {
            success: true,
            data: data
        };

    } catch (error) {
        console.error("❌ Brevo email service error:", error);

        return {
            success: false,
            error: error
        };
    }
};

module.exports = { sendEmail };