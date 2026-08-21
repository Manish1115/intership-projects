from django.contrib.auth.models import User
from django.db import models


class Project(models.Model):
    name = models.CharField(
        max_length=200,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_projects",
    )

    members = models.ManyToManyField(
        User,
        related_name="projects",
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name