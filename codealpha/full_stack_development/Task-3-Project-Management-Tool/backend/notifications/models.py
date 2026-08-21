from django.conf import settings
from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        GENERAL = "GENERAL", "General"
        TASK_ASSIGNED = "TASK_ASSIGNED", "Task Assigned"
        COMMENT = "COMMENT", "Comment"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.recipient.username}: "
            f"{self.message}"
        )