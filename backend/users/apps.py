from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"

    def ready(self):
        from django.contrib.auth.models import Group

        Group.objects.get_or_create(name="Client")
        Group.objects.get_or_create(name="Coach")
        Group.objects.get_or_create(name="Admin")