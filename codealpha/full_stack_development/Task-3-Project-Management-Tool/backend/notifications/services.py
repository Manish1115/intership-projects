from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from notifications.models import Notification


def send_notification(
    recipient,
    notification,
):
    channel_layer = get_channel_layer()

    if channel_layer is None:
        return

    async_to_sync(
        channel_layer.group_send
    )(
        f"user_{recipient.id}",
        {
            "type": "notification_message",
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


def create_task_assignment_notification(
    user,
    task,
):
    notification = Notification.objects.create(
        recipient=user,
        task=task,
        notification_type=(
            Notification.NotificationType.TASK_ASSIGNED
        ),
        message=(
            f'You have been assigned to task "{task.title}".'
        ),
    )

    send_notification(
        user,
        notification,
    )

    return notification


def create_comment_notification(
    user,
    task,
    comment_author,
):
    notification = Notification.objects.create(
        recipient=user,
        task=task,
        notification_type=(
            Notification.NotificationType.COMMENT
        ),
        message=(
            f'{comment_author.username} commented on '
            f'task "{task.title}".'
        ),
    )

    send_notification(
        user,
        notification,
    )

    return notification


def create_project_member_notification(
    user,
    project,
):
    notification = Notification.objects.create(
        recipient=user,
        notification_type=(
            Notification.NotificationType.GENERAL
        ),
        message=(
            f'You have been added to project '
            f'"{project.name}".'
        ),
    )

    send_notification(
        user,
        notification,
    )

    return notification


def create_general_notification(
    user,
    message,
):
    notification = Notification.objects.create(
        recipient=user,
        notification_type=(
            Notification.NotificationType.GENERAL
        ),
        message=message,
    )

    send_notification(
        user,
        notification,
    )

    return notification