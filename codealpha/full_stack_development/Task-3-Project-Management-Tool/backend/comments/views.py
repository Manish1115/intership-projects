from django.db.models import Q

from rest_framework import permissions, viewsets

from notifications.services import create_comment_notification

from .models import Comment
from .serializers import CommentSerializer


class IsTaskProjectMember(permissions.BasePermission):
    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        project = obj.task.project

        return (
            project.owner == request.user
            or project.members.filter(
                id=request.user.id
            ).exists()
        )


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        IsTaskProjectMember,
    ]

    def get_queryset(self):
        user = self.request.user

        return (
            Comment.objects
            .filter(
                Q(task__project__owner=user)
                | Q(task__project__members=user)
            )
            .select_related(
                "task",
                "author",
            )
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        comment = serializer.save(
            author=self.request.user
        )

        task = comment.task
        author = comment.author

        project_members = task.project.members.exclude(
            id=author.id
        )

        for user in project_members:
            create_comment_notification(
                user=user,
                task=task,
                comment_author=author,
            )