from django.contrib.auth.models import User
from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView

from .permissions import IsAdminGroupOrSuperuser, IsAdminOrCoachOrSuperuser
from .roles import get_user_role
from .serializers import ClientSerializer, UserCreateSerializer, UserUpdateSerializer
from users.models import Client, Coach


def serialize_user(user):
    client = Client.objects.filter(user=user).first()
    coach_name = None
    if client and client.coach and client.coach.user:
        coach_name = client.coach.user.get_full_name().strip() or client.coach.user.username

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": (get_user_role(user) or "").lower(),
        "coach_id": client.coach_id if client else None,
        "coach_name": coach_name,
    }


class ClientViewSet(ReadOnlyModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        base_qs = Client.objects.select_related("user", "coach", "coach__user")
        viewer_role = (get_user_role(self.request.user) or "").lower()

        if viewer_role == "admin":
            return base_qs.all()

        if viewer_role == "coach":
            return base_qs.filter(coach__user=self.request.user)

        if viewer_role == "client":
            return base_qs.filter(user=self.request.user)

        return base_qs.none()


class UserListView(APIView):
    permission_classes = [IsAdminOrCoachOrSuperuser]

    @extend_schema(responses={200: dict, 403: dict})
    def get(self, request):
        viewer_role = (get_user_role(request.user) or "").lower()

        if viewer_role == "admin":
            users = User.objects.all().order_by("id")
            return Response([serialize_user(user) for user in users], status=status.HTTP_200_OK)

        if viewer_role == "coach":
            coach = Coach.objects.filter(user=request.user).first()
            if not coach:
                return Response([], status=status.HTTP_200_OK)

            users = User.objects.filter(client__coach=coach).order_by("id").distinct()
            return Response([serialize_user(user) for user in users], status=status.HTTP_200_OK)

        return Response({"detail": "You do not have permission to view users."}, status=status.HTTP_403_FORBIDDEN)


class UserCreateView(APIView):
    permission_classes = [IsAdminGroupOrSuperuser]

    @extend_schema(
        request=UserCreateSerializer,
        responses={201: dict},
    )
    def post(self, request):
        is_bulk = isinstance(request.data, list)
        serializer = UserCreateSerializer(data=request.data, many=is_bulk)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            created = serializer.save()

        if is_bulk:
            return Response([serialize_user(user) for user in created], status=status.HTTP_201_CREATED)

        return Response(serialize_user(created), status=status.HTTP_201_CREATED)


class UserUpdateView(APIView):
    permission_classes = [IsAdminGroupOrSuperuser]

    @extend_schema(
        request=UserUpdateSerializer,
        responses={200: dict},
    )
    def put(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserUpdateSerializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response(serialize_user(updated_user), status=status.HTTP_200_OK)

    @extend_schema(
        request=UserUpdateSerializer,
        responses={200: dict},
    )
    def patch(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response(serialize_user(updated_user), status=status.HTTP_200_OK)

