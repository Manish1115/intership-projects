from django.urls import path

from notifications.consumers import NotificationConsumer
from tasks.consumers import TaskConsumer


websocket_urlpatterns = [
    path(
        "ws/notifications/",
        NotificationConsumer.as_asgi(),
    ),

    path(
        "ws/tasks/",
        TaskConsumer.as_asgi(),
    ),
]