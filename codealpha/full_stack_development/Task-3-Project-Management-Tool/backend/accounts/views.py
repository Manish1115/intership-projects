from django.contrib.auth.models import User

from rest_framework import generics
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import Profile
from .serializers import (
    MeSerializer,
    RegisterSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user

        Profile.objects.get_or_create(
            user=user,
        )

        return user


class UserListView(generics.ListAPIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            User.objects
            .all()
            .order_by("username")
        )

    def list(
        self,
        request,
        *args,
        **kwargs,
    ):
        users = self.get_queryset()

        data = [
            {
                "id": user.id,
                "username": user.username,
            }
            for user in users
        ]

        return Response(data)