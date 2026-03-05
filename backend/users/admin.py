from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.models import User

from .models import Client, Coach
from .roles import apply_role, get_user_role


class CustomUserCreationForm(UserCreationForm):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("coach", "Coach"),
        ("client", "Client"),
    )

    role = forms.ChoiceField(choices=ROLE_CHOICES)
    coach = forms.ModelChoiceField(queryset=Coach.objects.select_related("user").all(), required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "first_name", "last_name")

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("role") == "client" and not cleaned.get("coach"):
            raise forms.ValidationError("Client users must have a coach assigned.")
        return cleaned

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            coach = self.cleaned_data.get("coach")
            apply_role(user, self.cleaned_data["role"], coach_id=coach.id if coach else None)
        return user


class CustomUserChangeForm(UserChangeForm):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("coach", "Coach"),
        ("client", "Client"),
    )

    role = forms.ChoiceField(choices=ROLE_CHOICES, required=True)
    coach = forms.ModelChoiceField(queryset=Coach.objects.select_related("user").all(), required=False)

    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        current_role = (get_user_role(self.instance) or "Client").lower()
        self.fields["role"].initial = current_role
        client = Client.objects.filter(user=self.instance).select_related("coach").first()
        self.fields["coach"].initial = client.coach if client else None

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("role") == "client" and not cleaned.get("coach"):
            raise forms.ValidationError("Client users must have a coach assigned.")
        return cleaned

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            coach = self.cleaned_data.get("coach")
            apply_role(user, self.cleaned_data["role"], coach_id=coach.id if coach else None)
        return user


admin.site.unregister(User)


@admin.register(User)
class CustomUserAdmin(DjangoUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Role", {"fields": ("role", "coach")}),
    )

    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Role", {"fields": ("role", "coach")}),
    )


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ("id", "user")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "coach")
