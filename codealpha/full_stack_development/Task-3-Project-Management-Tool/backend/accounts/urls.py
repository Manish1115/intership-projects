from django.urls import path

from .views import (
    MeView,
    RegisterView,
    UserListView,
)

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
    path(
        "users/",
        UserListView.as_view(),
        name="users",
    ),
]