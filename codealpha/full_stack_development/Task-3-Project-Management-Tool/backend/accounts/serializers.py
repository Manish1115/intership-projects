from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Profile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        )
        read_only_fields = (
            "id",
            "username",
        )


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = (
            "id",
            "user",
            "bio",
            "profile_picture",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "created_at",
            "updated_at",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = (
            "first_name",
            "username",
            "password",
        )

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Name is required."
            )

        return value

    def validate_username(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Username is required."
            )

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop(
            "password"
        )

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        Profile.objects.get_or_create(
            user=user
        )

        return user


class MeSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(
        source="profile.bio",
        allow_blank=True,
        required=False,
    )

    profile_picture = serializers.URLField(
        source="profile.profile_picture",
        allow_blank=True,
        required=False,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "profile_picture",
        )
        read_only_fields = (
            "id",
            "username",
        )

    def update(
        self,
        instance,
        validated_data,
    ):
        profile_data = validated_data.pop(
            "profile",
            {},
        )

        instance.first_name = validated_data.get(
            "first_name",
            instance.first_name,
        )

        instance.last_name = validated_data.get(
            "last_name",
            instance.last_name,
        )

        instance.email = validated_data.get(
            "email",
            instance.email,
        )

        instance.save()

        profile = instance.profile

        if "bio" in profile_data:
            profile.bio = profile_data["bio"]

        if "profile_picture" in profile_data:
            profile.profile_picture = (
                profile_data["profile_picture"]
            )

        profile.save()

        return instance