import html.parser
import email
import base64
import requests
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from bs4 import BeautifulSoup
import re

class HTMLTextExtractor(html.parser.HTMLParser):
    def __init__(self):
        super(HTMLTextExtractor, self).__init__()
        self.result = [ ]

    def handle_data(self, d):
        self.result.append(d)

    def get_text(self):
        return ''.join(self.result)

def html_to_text(html):
    s = HTMLTextExtractor()
    s.feed(html)
    return s.get_text()


def parse_email_data(service, message_id):
    message = service.users().messages().get(userId='me', id=message_id, format='raw').execute()
    msg_str = base64.urlsafe_b64decode(message['raw'])
    email_msg = email.message_from_bytes(msg_str)
    body = None
    html = ''

    # Extract headers
    email_subject = email_msg.get_all('Subject')
    from_sender = email_msg.get_all('From')
    to_recipient = email_msg.get_all('To')
    return_path = email_msg.get_all('Return-Path')
    delivered_to = email_msg.get_all('Delivered-To')
    datetime_rx = email_msg.get_all('Date')

    if email_msg.is_multipart():
        for part in email_msg.walk():
            content_type = part.get_content_type()
            disp = str(part.get('Content-Disposition'))
            if part.get_content_charset() is None:
                body = part.get_payload(decode=True)
                continue
            if content_type == 'text/plain' and 'attachment' not in disp:
                charset = part.get_content_charset()
                body = part.get_payload(decode=True).decode(encoding=charset, errors="ignore")
            if content_type == 'text/html' and 'attachment' not in disp:
                charset = part.get_content_charset()
                html = part.get_payload(decode=True).decode(encoding=charset, errors="ignore")
    else:
        # Non-multipart email - use email_msg directly
        content_type = email_msg.get_content_type()
        if email_msg.get_content_charset() is None:
            body = email_msg.get_payload(decode=True)
        else:
            charset = email_msg.get_content_charset()
            if content_type == 'text/plain':
                body = email_msg.get_payload(decode=True).decode(encoding=charset, errors="ignore")
            if content_type == 'text/html':
                html = email_msg.get_payload(decode=True).decode(encoding=charset, errors="ignore")

    if body is None and html:
        body = html_to_text(html).strip()

    return {
        "text": body.strip() if body else "",
        "html": html.strip() if html else "",
        "delivered_to": delivered_to,
        "return_path": return_path,
        "from_sender": from_sender,
        "to_recipient": to_recipient,
        "datetime": datetime_rx,
        "subject": email_subject
    }



def service_gmail(access_token):
    credentials = Credentials(token=access_token)
    service = build('gmail', 'v1', credentials=credentials)
    results = service.users().messages().list(userId='me', maxResults=40).execute()
    messages = results.get('messages', [])

    parsed_emails = []
    for message in messages:
        email_data = parse_email_data(service, message['id'])
        # Preprocess text if needed, but keep HTML raw
        email_data["text"] = preprocess_email(email_data["text"])
        parsed_emails.append(email_data)
    return parsed_emails


def preprocess_email(email_body):
    # Remove HTML tags if present
    soup = BeautifulSoup(email_body, 'html.parser')
    text = soup.get_text()

    # Remove unwanted characters and extra spaces
    text = re.sub(r'\[image: Google\]', '', text)  # Remove specific unwanted content
    text = re.sub(r'\r\n+', '\n', text)  # Replace multiple newlines with a single newline
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with a single space
    text = text.strip()  # Remove leading and trailing spaces

    # Convert to lowercase
    text = text.lower()

    return text