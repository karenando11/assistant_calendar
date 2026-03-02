from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsClientCoachOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_superuser or user.groups.filter(name="Admin").exists():
            return True

        if user.groups.filter(name="Client").exists():
            return obj.client.user == user

        if user.groups.filter(name="Coach").exists():
            return obj.client.coach.user == user

        return False


class IsAdminWriteReadAll(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.groups.filter(name="Admin").exists()
            )
        )
