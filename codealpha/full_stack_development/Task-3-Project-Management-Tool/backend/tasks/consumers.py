from channels.generic.websocket import (
    AsyncJsonWebsocketConsumer
)


class TaskConsumer(
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
                    "Task WebSocket connected successfully."
                ),
            }
        )

    async def disconnect(
        self,
        close_code,
    ):

        if hasattr(
            self,
            "group_name",
        ):

            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def task_update(
        self,
        event,
    ):

        await self.send_json(
            {
                "type": "task_update",
                "action": event["action"],
                "task": event["task"],
            }
        )