from django.contrib.auth.models import Group
from django.db import transaction

from .models import Client, Coach

ROLE_MAP = {
    "admin": "Admin",
    "coach": "Coach",
    "client": "Client",
}
ROLE_GROUP_NAMES = ["Admin", "Coach", "Client"]


def normalize_role(role: str) -> str:
    if not role:
        raise ValueError("Role is required.")
    normalized = ROLE_MAP.get(str(role).lower())
    if not normalized:
        raise ValueError("Invalid role.")
    return normalized


def ensure_default_groups():
    for group_name in ROLE_GROUP_NAMES:
        Group.objects.get_or_create(name=group_name)


def get_user_role(user) -> str | None:
    if user.groups.filter(name="Admin").exists() or user.is_superuser:
        return "Admin"
    if user.groups.filter(name="Coach").exists():
        return "Coach"
    if user.groups.filter(name="Client").exists():
        return "Client"
    return None


@transaction.atomic
def apply_role(user, role: str, coach_id=None):
    role_name = normalize_role(role)
    ensure_default_groups()

    # Keep exactly one app role group to avoid ambiguity.
    role_groups = Group.objects.filter(name__in=ROLE_GROUP_NAMES)
    user.groups.remove(*role_groups)

    group = Group.objects.get(name=role_name)
    user.groups.add(group)

    if role_name == "Coach":
        Coach.objects.get_or_create(user=user)
        Client.objects.filter(user=user).delete()
        return

    if role_name == "Client":
        coach = Coach.objects.filter(id=coach_id).first() if coach_id else None
        client, _ = Client.objects.get_or_create(user=user)
        client.coach = coach
        client.save()
        Coach.objects.filter(user=user).delete()
        return

    # Admin role: no profile model required.
    Client.objects.filter(user=user).delete()
    Coach.objects.filter(user=user).delete()


@transaction.atomic
def sync_profiles_from_groups(user):
    role = get_user_role(user)

    if role == "Coach":
        Coach.objects.get_or_create(user=user)
        Client.objects.filter(user=user).delete()
        return

    if role == "Client":
        Client.objects.get_or_create(user=user)
        Coach.objects.filter(user=user).delete()
        return

    # Admin or no role group: keep DB clean
    Client.objects.filter(user=user).delete()
    Coach.objects.filter(user=user).delete()
