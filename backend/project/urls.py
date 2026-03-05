from django.contrib import admin
from django.urls import path
from django.urls import include
from rest_framework.routers import DefaultRouter
from events.views import EventViewSet, CategoryViewSet
from users.views import ClientViewSet, CoachViewSet, UserCreateView, UserListView, UserUpdateView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

router = DefaultRouter()
router.register(r"event", EventViewSet, basename="event")
router.register(r"category", CategoryViewSet, basename="category")
router.register(r"client", ClientViewSet, basename="client")
router.register(r"coach", CoachViewSet, basename="coach")

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include(router.urls)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("accounts/", include("django.contrib.auth.urls")),
    path("api/user/", UserListView.as_view(), name="user_list"),
    path("api/user/create/", UserCreateView.as_view(), name="user_create"),
    path("api/user/<int:user_id>/", UserUpdateView.as_view(), name="user_update"),

    # JWT auth endpoints
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
