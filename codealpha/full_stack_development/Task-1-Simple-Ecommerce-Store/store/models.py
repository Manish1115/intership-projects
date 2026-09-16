from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)

    description = models.TextField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    image = models.URLField(
        blank=True,
        null=True
    )

    stock = models.PositiveIntegerField(
        default=10
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name

    @property
    def is_available(self):
        return self.stock > 0