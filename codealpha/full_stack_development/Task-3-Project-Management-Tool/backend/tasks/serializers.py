from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Task


class TaskUserSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = User
        fields = (
            "id",
            "username",
        )


class TaskSerializer(
    serializers.ModelSerializer
):

    assigned_to = TaskUserSerializer(
        many=True,
        read_only=True,
    )

    assigned_to_ids = serializers.PrimaryKeyRelatedField(
        source="assigned_to",
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    project_name = serializers.CharField(
        source="project.name",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )

    class Meta:

        model = Task

        fields = (
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "assigned_to",
            "assigned_to_ids",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "due_date",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "project_name",
            "status_display",
            "priority_display",
            "assigned_to",
        )

    def validate(self, attrs):

        project = attrs.get(
            "project",
            getattr(
                self.instance,
                "project",
                None,
            ),
        )

        assigned_users = attrs.get(
            "assigned_to"
        )

        if (
            assigned_users is not None
            and project is not None
        ):

            allowed_ids = set(
                project.members.values_list(
                    "id",
                    flat=True,
                )
            )

            allowed_ids.add(
                project.owner_id
            )

            invalid_users = [
                user.username
                for user in assigned_users
                if user.id not in allowed_ids
            ]

            if invalid_users:

                raise serializers.ValidationError(
                    {
                        "assigned_to_ids": (
                            "All assigned users must "
                            "be members of this project "
                            "or the project owner."
                        )
                    }
                )

        return attrs    