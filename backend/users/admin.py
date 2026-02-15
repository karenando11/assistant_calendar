from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User, Group
from django import forms

from .models import Coach, Client

class CustomUserCreationForm(forms.ModelForm):
    ROLE_CHOICES = (
        ("Client", "Client"),
        ("Coach", "Coach"),
        ("Admin", "Admin"),
    )

    role = forms.ChoiceField(choices=ROLE_CHOICES)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])

        if commit:
            user.save()

            role = self.cleaned_data["role"]
            group = Group.objects.get(name=role)
            user.groups.add(group)

            if role == "Coach":
                Coach.objects.create(user=user)

            if role == "Client":
                Client.objects.create(user=user)

        return user
    
    admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(DjangoUserAdmin):
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password", "role"),
        }),
    )

