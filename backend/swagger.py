from drf_yasg import openapi
from drf_yasg.views import get_schema_view

schema_view = get_schema_view(
    openapi.Info(
        title="API Mergius",
        default_version='v1',
        description="API для приложения Mergius",
    ),
    public=True,
)