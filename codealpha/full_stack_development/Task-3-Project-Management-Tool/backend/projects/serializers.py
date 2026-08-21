from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Project


class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        )


class ProjectSerializer(serializers.ModelSerializer):
    owner = ProjectMemberSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)

    member_ids = serializers.PrimaryKeyRelatedField(
        source="members",
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "owner",
            "members",
            "member_ids",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "members",
            "created_at",
            "updated_at",
        )

    def create(self, validated_data):
        members = validated_data.pop("members", [])

        request = self.context["request"]

        project = Project.objects.create(
            owner=request.user,
            **validated_data,
        )

        project.members.add(request.user)

        if members:
            project.members.add(*members)

        return project

    def update(self, instance, validated_data):
        members = validated_data.pop("members", None)

        instance.name = validated_data.get(
            "name",
            instance.name,
        )

        instance.description = validated_data.get(
            "description",
            instance.description,
        )

        instance.save()

        if members is not None:
            instance.members.set(members)
            instance.members.add(instance.owner)

        return instance