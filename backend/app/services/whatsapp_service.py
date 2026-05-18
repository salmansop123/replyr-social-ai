"""WhatsApp Business Cloud API client (Meta Graph v18.0)."""

from __future__ import annotations

import httpx


class WhatsAppService:
    BASE_URL = "https://graph.facebook.com/v18.0"

    async def send_text_message(
        self,
        phone_number_id: str,
        to_number: str,
        message_text: str,
        access_token: str,
    ) -> dict:
        """
        Send a text reply to a WhatsApp customer.
        API docs: POST /{phone-number-id}/messages
        """
        url = f"{self.BASE_URL}/{phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message_text[:4096],
            },
        }
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code != 200:
                raise Exception(
                    f"WhatsApp API error {response.status_code}: {response.text}"
                )
            return response.json()

    async def mark_message_read(
        self, phone_number_id: str, message_id: str, access_token: str
    ) -> None:
        """Mark incoming message as read (shows blue ticks to customer)."""
        url = f"{self.BASE_URL}/{phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
        }
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(url, json=payload, headers=headers)
