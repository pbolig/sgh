import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.parse
import os

# Configuración básica (Idealmente vendría de variables de entorno)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
DEFAULT_FROM = os.getenv("DEFAULT_FROM", "no-reply@institucion.edu")

def send_email(to_email: str, subject: str, body_html: str):
    """Envía un correo electrónico via SMTP."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"DEBUG: Email no enviado a {to_email} (credenciales no configuradas)")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = DEFAULT_FROM
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error enviando email: {e}")
        return False

def send_email_with_config(to_email: str, subject: str, body_html: str, config: dict):
    """Envía un correo electrónico via SMTP usando una configuración dinámica."""
    # Extraemos parámetros del JSON, con fallbacks razonables por si faltan
    smtp_server = config.get("server", "")
    smtp_port = int(config.get("port", 587))
    smtp_user = config.get("user", "")
    smtp_pass = config.get("pass", "")
    default_from = config.get("from_email", smtp_user)
    
    if not smtp_server or not smtp_user or not smtp_pass:
        print(f"DEBUG: Email fallido para {to_email}. Configuración incompleta en BD.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg["From"] = default_from
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error enviando email dinámico: {e}")
        return False


def generate_whatsapp_link(phone: str, message: str):
    """Genera un link de WhatsApp Web formatado."""
    # Limpiar el teléfono (solo números)
    clean_phone = "".join(filter(str.isdigit, phone))
    if not clean_phone.startswith("54"): # Prefijo Argentina por defecto si no está
        clean_phone = "54" + clean_phone
    
    encoded_msg = urllib.parse.quote(message)
    return f"https://wa.me/{clean_phone}?text={encoded_msg}"

def notify_new_ticket(ticket_asunto: str, destinatario_nombre: str, remitente_nombre: str):
    """Plantilla para notificación de nuevo ticket."""
    subject = f"Nuevo Ticket Académico: {ticket_asunto}"
    body = f"""
    <html>
        <body>
            <h2>Hola, {destinatario_nombre}</h2>
            <p>Se ha generado una nueva solicitud de <b>{remitente_nombre}</b>.</p>
            <p>Asunto: {ticket_asunto}</p>
            <p>Por favor, ingrese al sistema para responder.</p>
            <br>
            <p><i>Sistema de Gestión Institucional</i></p>
        </body>
    </html>
    """
    return subject, body
