import smtplib
from email.mime.text import MIMEText

def send_email(user, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = f"sender@{user}.com"
    msg['To'] = f"receiver@{user}.com"
    
    try:
        # Standard SMTP AUTH LOGIN via smtplib
        with smtplib.SMTP('127.0.0.1', 1025) as server:
            server.set_debuglevel(1)
            server.login(user, 'anypass')
            server.send_message(msg)
            print(f"Successfully sent signal for {user}")
    except Exception as e:
        print(f"Failed to send for {user}: {e}")

if __name__ == "__main__":
    send_email('laravel_app', 'Project Alpha: Payment Received', 'This is a secure signal for the Laravel project.')
    send_email('flutter_dev', 'Project Beta: Auth Success', 'This is a secure signal for the Flutter development project.')
