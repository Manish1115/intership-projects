from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Comment


class CommentAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
        )


class CommentSerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = (
            "id",
            "task",
            "author",
            "content",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "author",
            "created_at",
            "updated_at",
        )