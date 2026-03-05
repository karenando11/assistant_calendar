from django.contrib.auth.models import Group, User
from django.db.models.signals import m2m_changed, post_migrate
from django.dispatch import receiver

from .roles import ensure_default_groups, sync_profiles_from_groups


@receiver(post_migrate)
def create_default_groups(sender, **kwargs):
    ensure_default_groups()


@receiver(m2m_changed, sender=User.groups.through)
def sync_user_profiles_when_groups_change(sender, instance, action, **kwargs):
    if action in {"post_add", "post_remove", "post_clear"}:
        sync_profiles_from_groups(instance)
