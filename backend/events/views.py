from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import PermissionDenied
from .models import Event
from .serializers import EventSerializer
from .permissions import IsClientCoachOrAdmin

class EventViewSet(ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsClientCoachOrAdmin]

    def get_queryset(self):
        user = self.request.user

        if user.groups.filter(name="Admin").exists():
            return Event.objects.all()

        if user.groups.filter(name="Client").exists():
            return Event.objects.filter(client__user=user)

        if user.groups.filter(name="Coach").exists():
            return Event.objects.filter(client__coach__user=user)

        return Event.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        if user.groups.filter(name="Admin").exists():
            serializer.save()
            return

        if user.groups.filter(name="Client").exists():
            serializer.save(client=user.client)
            return

        if user.groups.filter(name="Coach").exists():
            client = serializer.validated_data["client"]
            if client.coach.user != user:
                raise PermissionDenied("Not your client.")
            serializer.save()
            return

        raise PermissionDenied("Invalid role.")
