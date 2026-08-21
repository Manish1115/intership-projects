from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    viewsets.ModelViewSet
):
    serializer_class = NotificationSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(
                recipient=self.request.user
            )
            .order_by("-created_at")
        )

    def broadcast_notification_update(
        self,
        notification,
        action,
    ):
        channel_layer = get_channel_layer()

        if channel_layer is None:
            return

        async_to_sync(
            channel_layer.group_send
        )(
            f"user_{notification.recipient_id}",
            {
                "type": "notification_update",
                "action": action,
                "notification": {
                    "id": notification.id,
                    "message": notification.message,
                    "notification_type": (
                        notification.notification_type
                    ),
                    "task": (
                        notification.task_id
                        if notification.task
                        else None
                    ),
                    "is_read": notification.is_read,
                    "created_at": (
                        notification.created_at.isoformat()
                    ),
                },
            },
        )

    def perform_create(
        self,
        serializer,
    ):
        notification = serializer.save(
            recipient=self.request.user
        )

        self.broadcast_notification_update(
            notification,
            "created",
        )

    def perform_update(
        self,
        serializer,
    ):
        notification = self.get_object()

        updated_notification = serializer.save()

        self.broadcast_notification_update(
            updated_notification,
            "updated",
        )

    def perform_destroy(
        self,
        instance,
    ):
        notification_data = {
            "id": instance.id,
        }

        recipient_id = instance.recipient_id

        instance.delete()

        channel_layer = get_channel_layer()

        if channel_layer is not None:
            async_to_sync(
                channel_layer.group_send
            )(
                f"user_{recipient_id}",
                {
                    "type": "notification_update",
                    "action": "deleted",
                    "notification": notification_data,
                },
            )

    @action(
        detail=False,
        methods=["delete"],
        url_path="clear-all",
    )
    def clear_all(
        self,
        request,
    ):
        notifications = (
            Notification.objects
            .filter(
                recipient=request.user
            )
        )

        deleted_ids = list(
            notifications.values_list(
                "id",
                flat=True,
            )
        )

        deleted_count, _ = (
            notifications.delete()
        )

        channel_layer = get_channel_layer()

        if channel_layer is not None:
            async_to_sync(
                channel_layer.group_send
            )(
                f"user_{request.user.id}",
                {
                    "type": "notification_update",
                    "action": "clear_all",
                    "notification": {
                        "ids": deleted_ids,
                    },
                },
            )

        return Response(
            {
                "message": (
                    "All notifications cleared."
                ),
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )