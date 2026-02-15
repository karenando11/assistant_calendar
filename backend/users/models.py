from django.contrib.auth.models import User
from django.db import models



class Coach(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username


class Client(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    coach = models.ForeignKey(Coach, on_delete=models.SET_NULL, null=True, related_name="clients")

    def __str__(self):
        return self.user.username