from django.db.models import Q

from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Task
from .serializers import TaskSerializer

from notifications.services import (
    create_task_assignment_notification,
)


class IsProjectMember(
    permissions.BasePermission
):

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        return (
            obj.project.owner == request.user
            or obj.assigned_to.filter(
                id=request.user.id
            ).exists()
        )


class TaskViewSet(
    viewsets.ModelViewSet
):

    serializer_class = TaskSerializer

    permission_classes = [
        permissions.IsAuthenticated,
        IsProjectMember,
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = (
            Task.objects
            .filter(
                Q(project__owner=user)
                |
                Q(assigned_to=user)
            )
            .select_related(
                "project",
            )
            .prefetch_related(
                "assigned_to",
            )
            .distinct()
        )

        status = self.request.query_params.get(
            "status"
        )

        if status:
            queryset = queryset.filter(
                status=status.upper()
            )

        priority = self.request.query_params.get(
            "priority"
        )

        if priority:
            queryset = queryset.filter(
                priority=priority.upper()
            )

        project_id = self.request.query_params.get(
            "project"
        )

        if project_id:
            queryset = queryset.filter(
                project_id=project_id
            )

        assigned_to = self.request.query_params.get(
            "assigned_to"
        )

        if assigned_to:
            queryset = queryset.filter(
                assigned_to__id=assigned_to
            )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                |
                Q(description__icontains=search)
            )

        return queryset.order_by(
            "-created_at"
        )

    # ==================================================
    # BUILD TASK DATA
    # ==================================================

    def build_task_data(
        self,
        task,
    ):

        assigned_users = [
            {
                "id": user.id,
                "username": user.username,
            }
            for user in task.assigned_to.all()
        ]

        return {
            "id": task.id,

            "project": task.project_id,

            "project_name": task.project.name,

            "title": task.title,

            "description": task.description,

            "status": task.status,

            "status_display": (
                task.get_status_display()
            ),

            "priority": task.priority,

            "priority_display": (
                task.get_priority_display()
            ),

            "assigned_to": assigned_users,

            "due_date": (
                task.due_date.isoformat()
                if task.due_date
                else None
            ),

            "created_at": (
                task.created_at.isoformat()
            ),

            "updated_at": (
                task.updated_at.isoformat()
            ),
        }

    # ==================================================
    # WEBSOCKET BROADCAST
    # ==================================================

    def broadcast_task(
        self,
        action,
        task,
        previous_assigned_user_ids=None,
    ):

        channel_layer = get_channel_layer()

        if channel_layer is None:
            return

        task_data = self.build_task_data(
            task
        )

        recipient_ids = {
            task.project.owner_id
        }

        recipient_ids.update(
            task.assigned_to.values_list(
                "id",
                flat=True,
            )
        )

        if previous_assigned_user_ids:
            recipient_ids.update(
                previous_assigned_user_ids
            )

        for user_id in recipient_ids:

            async_to_sync(
                channel_layer.group_send
            )(
                f"user_{user_id}",
                {
                    "type": "task_update",
                    "action": action,
                    "task": task_data,
                },
            )

    # ==================================================
    # CREATE
    # ==================================================

    def perform_create(
        self,
        serializer,
    ):

        project = (
            serializer.validated_data.get(
                "project"
            )
        )

        user = self.request.user

        if project.owner != user:

            raise PermissionDenied(
                "Only the project owner can create tasks."
            )

        task = serializer.save()

        for assigned_user in (
            task.assigned_to.all()
        ):

            create_task_assignment_notification(
                user=assigned_user,
                task=task,
            )

        self.broadcast_task(
            "created",
            task,
        )

    # ==================================================
    # UPDATE
    # ==================================================

    def perform_update(
        self,
        serializer,
    ):

        task = self.get_object()

        user = self.request.user

        previous_assigned_user_ids = set(
            task.assigned_to.values_list(
                "id",
                flat=True,
            )
        )

        # OWNER
        if task.project.owner == user:

            updated_task = serializer.save()

            for assigned_user in (
                updated_task.assigned_to.all()
            ):

                create_task_assignment_notification(
                    user=assigned_user,
                    task=updated_task,
                )

            self.broadcast_task(
                "updated",
                updated_task,
                previous_assigned_user_ids,
            )

            return

        # MEMBER
        allowed_fields = {
            "status"
        }

        submitted_fields = set(
            serializer.validated_data.keys()
        )

        if not submitted_fields.issubset(
            allowed_fields
        ):

            raise PermissionDenied(
                "Only the project owner can edit task details."
            )

        new_status = (
            serializer.validated_data.get(
                "status"
            )
        )

        if task.status == "DONE":

            raise PermissionDenied(
                "Completed tasks can only be changed by the project owner."
            )

        if new_status == "DONE":

            raise PermissionDenied(
                "Only the project owner can mark a task as completed."
            )

        if new_status not in {
            "TODO",
            "IN_PROGRESS",
        }:

            raise PermissionDenied(
                "Invalid task status."
            )

        updated_task = serializer.save()

        self.broadcast_task(
            "updated",
            updated_task,
            previous_assigned_user_ids,
        )

    # ==================================================
    # DELETE
    # ==================================================

    def perform_destroy(
        self,
        instance,
    ):

        user = self.request.user

        if instance.project.owner != user:

            raise PermissionDenied(
                "Only the project owner can delete tasks."
            )

        recipient_ids = {
            instance.project.owner_id
        }

        recipient_ids.update(
            instance.assigned_to.values_list(
                "id",
                flat=True,
            )
        )

        task_data = {
            "id": instance.id,
            "project": instance.project_id,
        }

        instance.delete()

        channel_layer = get_channel_layer()

        if channel_layer is not None:

            for user_id in recipient_ids:

                async_to_sync(
                    channel_layer.group_send
                )(
                    f"user_{user_id}",
                    {
                        "type": "task_update",
                        "action": "deleted",
                        "task": task_data,
                    },
                )