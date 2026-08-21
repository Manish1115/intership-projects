from django.contrib.auth.models import User
from django.db import models


class Comment(models.Model):
    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.CASCADE,
        related_name="comments",
    )

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Comment by {self.author.username}"