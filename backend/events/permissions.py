from rest_framework.permissions import BasePermission

class IsClientCoachOrAdmin(BasePermission):

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.groups.filter(name="Admin").exists():
            return True

        if user.groups.filter(name="Client").exists():
            return obj.client.user == user

        if user.groups.filter(name="Coach").exists():
            return obj.client.coach.user == user

        return False
