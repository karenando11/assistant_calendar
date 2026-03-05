from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Client, Coach
from .roles import apply_role, get_user_role


class ClientSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ["id", "name", "email", "coach_name"]

    def get_name(self, obj):
        full_name = obj.user.get_full_name().strip()
        return full_name or obj.user.username

    def get_coach_name(self, obj):
        if obj.coach and obj.coach.user:
            full_name = obj.coach.user.get_full_name().strip()
            return full_name or obj.coach.user.username
        return None


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["admin", "coach", "client"])
    coach_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        role = attrs["role"]
        coach_id = attrs.get("coach_id")

        if role == "client":
            if coach_id is None:
                raise serializers.ValidationError({"coach_id": "coach_id is required for client role."})
            if not Coach.objects.filter(id=coach_id).exists():
                raise serializers.ValidationError({"coach_id": "Coach not found."})

        if role in {"admin", "coach"} and coach_id is not None:
            raise serializers.ValidationError({"coach_id": "coach_id is only for client role."})

        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role")
        coach_id = validated_data.pop("coach_id", None)
        password = validated_data.pop("password")

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        apply_role(user, role, coach_id=coach_id)
        return user


class UserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["admin", "coach", "client"], required=False)
    coach_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        role = attrs.get("role")
        coach_id = attrs.get("coach_id")

        if coach_id is not None and not Coach.objects.filter(id=coach_id).exists():
            raise serializers.ValidationError({"coach_id": "Coach not found."})

        current_role = get_user_role(self.instance) if self.instance else None
        target_role = (role or (current_role or "")).lower()

        if coach_id is not None and target_role != "client":
            raise serializers.ValidationError({"coach_id": "coach_id is only for client role."})

        if target_role == "client":
            existing_client = Client.objects.filter(user=self.instance).select_related("coach").first() if self.instance else None
            existing_coach_id = existing_client.coach_id if existing_client else None
            if coach_id is None and (existing_coach_id is None or role == "client"):
                raise serializers.ValidationError({"coach_id": "coach_id is required for client role."})

        return attrs

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        coach_id_provided = "coach_id" in validated_data
        coach_id = validated_data.pop("coach_id", None)

        for field in ["first_name", "last_name", "email"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        if role is not None:
            effective_coach_id = coach_id if coach_id_provided else Client.objects.filter(user=instance).values_list("coach_id", flat=True).first()
            apply_role(instance, role, coach_id=effective_coach_id)
        elif coach_id_provided:
            client, _ = Client.objects.get_or_create(user=instance)
            client.coach = Coach.objects.filter(id=coach_id).first() if coach_id else None
            client.save()

        return instance
