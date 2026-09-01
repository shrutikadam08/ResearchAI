import os

import resend

from dotenv import load_dotenv


load_dotenv()


def send_password_reset_email(
    recipient_email: str,
    reset_link: str
):

    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise ValueError(
            "RESEND_API_KEY is not configured."
        )

    resend.api_key = api_key

    subject = "Reset your ResearchAI password"

    html = f"""
    <html>
        <body>
            <h2>Reset your ResearchAI password</h2>

            <p>
                We received a request to reset your
                ResearchAI password.
            </p>

            <p>
                Click the button below to create a new password:
            </p>

            <p>
                <a
                    href="{reset_link}"
                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#4f46e5;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    Reset Password
                </a>
            </p>

            <p>
                This link will expire in 30 minutes.
            </p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>

            <p>
                Regards,<br>
                ResearchAI
            </p>
        </body>
    </html>
    """

    params = {
        "from": "ResearchAI <onboarding@resend.dev>",
        "to": [recipient_email],
        "subject": subject,
        "html": html,
    }

    return resend.Emails.send(params)