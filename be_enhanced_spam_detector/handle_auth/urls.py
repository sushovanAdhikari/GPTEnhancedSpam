from django.urls import path
from .views import GoogleLogin
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('google/', GoogleLogin.as_view(), name='google-login')
    # path('google/', csrf_exempt(GoogleLogin.as_view()), name='google-login'),
]