from django.db.models import Q

from rest_framework import permissions, viewsets

from notifications.services import (
    create_project_member_notification,
)

from .models import Project
from .serializers import ProjectSerializer


class IsProjectOwnerOrMember(
    permissions.BasePermission
):
    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        is_owner = (
            obj.owner == request.user
        )

        is_member = (
            obj.members.filter(
                id=request.user.id
            ).exists()
        )

        if request.method in permissions.SAFE_METHODS:
            return (
                is_owner
                or is_member
            )

        return is_owner


class ProjectViewSet(
    viewsets.ModelViewSet
):
    serializer_class = ProjectSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        IsProjectOwnerOrMember,
    ]

    def get_queryset(self):
        user = self.request.user

        return (
            Project.objects
            .filter(
                Q(owner=user)
                | Q(members=user)
            )
            .select_related("owner")
            .prefetch_related("members")
            .distinct()
            .order_by("-created_at")
        )

    def perform_update(
        self,
        serializer,
    ):
        project = self.get_object()

        old_member_ids = set(
            project.members.values_list(
                "id",
                flat=True,
            )
        )

        updated_project = (
            serializer.save()
        )

        new_members = (
            updated_project.members.exclude(
                id__in=old_member_ids
            )
        )

        for user in new_members:
            create_project_member_notification(
                user=user,
                project=updated_project,
            )