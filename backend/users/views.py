from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView

from .permissions import IsAdminGroupOrSuperuser
from .serializers import ClientSerializer, UserCreateSerializer, UserUpdateSerializer
from users.models import Client


class ClientViewSet(ReadOnlyModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    queryset = Client.objects.select_related("user", "coach", "coach__user").all()


class UserCreateView(APIView):
    permission_classes = [IsAdminGroupOrSuperuser]

    @extend_schema(
        request=UserCreateSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"id": user.id, "username": user.username, "email": user.email},
            status=status.HTTP_201_CREATED,
        )


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

        return Response(
            {
                "id": updated_user.id,
                "username": updated_user.username,
                "first_name": updated_user.first_name,
                "last_name": updated_user.last_name,
                "email": updated_user.email,
            },
            status=status.HTTP_200_OK,
        )

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

        return Response(
            {
                "id": updated_user.id,
                "username": updated_user.username,
                "first_name": updated_user.first_name,
                "last_name": updated_user.last_name,
                "email": updated_user.email,
            },
            status=status.HTTP_200_OK,
        )
