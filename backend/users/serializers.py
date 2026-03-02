from rest_framework import serializers
from .models import Client, Coach
from django.contrib.auth.models import User, Group

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
    role = serializers.ChoiceField(choices=["coach", "client"])
    coach_id = serializers.IntegerField(required=False, allow_null=True)  # only for client

    def validate(self, attrs):
        role = attrs["role"]
        coach_id = attrs.get("coach_id")

        if role == "client" and coach_id is not None:
            if not Coach.objects.filter(id=coach_id).exists():
                raise serializers.ValidationError({"coach_id": "Coach not found."})

        if role == "coach" and coach_id is not None:
            raise serializers.ValidationError({"coach_id": "coach_id is only for client role."})

        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role")
        coach_id = validated_data.pop("coach_id", None)
        password = validated_data.pop("password")

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        if role == "coach":
            group, _ = Group.objects.get_or_create(name="Coach")
            user.groups.add(group)
            Coach.objects.get_or_create(user=user)

        if role == "client":
            group, _ = Group.objects.get_or_create(name="Client")
            user.groups.add(group)
            coach = Coach.objects.filter(id=coach_id).first() if coach_id else None
            Client.objects.get_or_create(user=user, defaults={"coach": coach})

        return user


class UserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    coach_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_coach_id(self, value):
        if value is None:
            return value
        if not Coach.objects.filter(id=value).exists():
            raise serializers.ValidationError("Coach not found.")
        return value

    def update(self, instance, validated_data):
        coach_id_provided = "coach_id" in validated_data
        coach_id = validated_data.pop("coach_id", None)

        for field in ["first_name", "last_name", "email"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        if coach_id_provided:
            client, _ = Client.objects.get_or_create(user=instance)
            client.coach = Coach.objects.filter(id=coach_id).first() if coach_id else None
            client.save()

        return instance
