from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(
    AsyncJsonWebsocketConsumer
):
    async def connect(self):
        user = self.scope["user"]

        if user.is_anonymous:
            await self.close()
            return

        self.group_name = (
            f"user_{user.id}"
        )

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

        await self.send_json(
            {
                "type": "connection",
                "message": (
                    "WebSocket connected successfully."
                ),
            }
        )

    async def disconnect(
        self,
        close_code,
    ):
        user = self.scope["user"]

        if user.is_anonymous:
            return

        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name,
        )

    async def receive_json(
        self,
        content,
        **kwargs,
    ):
        message_type = content.get(
            "type"
        )

        if message_type == "ping":
            await self.send_json(
                {
                    "type": "pong",
                }
            )

    async def notification_message(
        self,
        event,
    ):
        await self.send_json(
            {
                "type": "notification",
                "notification": event[
                    "notification"
                ],
            }
        )

    async def notification_update(
        self,
        event,
    ):
        await self.send_json(
            {
                "type": "notification_update",
                "action": event[
                    "action"
                ],
                "notification": event[
                    "notification"
                ],
            }
        )