from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/auth/",
        include("accounts.urls"),
    ),

    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "api/accounts/",
        include("accounts.urls"),
    ),

    path(
        "api/projects/",
        include("projects.urls"),
    ),

    path(
        "api/tasks/",
        include("tasks.urls"),
    ),

    path(
        "api/comments/",
        include("comments.urls"),
    ),

    path(
        "api/notifications/",
        include("notifications.urls"),
    ),
]