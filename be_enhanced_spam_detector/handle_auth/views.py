from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from .jwt_utils import create_jwt_token, decode_jwt_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from requests.exceptions import HTTPError, Timeout, RequestException
from handle_gmail.utilities import parse_email_data, service_gmail
import requests
import json

@method_decorator(csrf_exempt, name='dispatch')
class GmailOAuth(APIView):
    '''
    Handle Google OAuth2 login requests.

    Verify the provided Google access token, create or update the user
    and return JWT tokens.
    '''

    def get_user_info(self, access_token):
        # define the userinfo endpoint
        user_info_url = 'https://www.googleapis.com/oauth2/v3/userinfo'

        # set up the headers with the access token
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        }

        # make the request to fetch user_information
        response = requests.get(user_info_url, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            return {'error': 'Failed to fetch user information'}
        
    def refresh_access_token(self, refresh_token, token_type='basic'):
        """
        Use refresh token to get new access token from Google
        """
        token_url = 'https://oauth2.googleapis.com/token'
        payload = {
            'refresh_token': refresh_token,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'grant_type': 'refresh_token',
        }
        
        try:
            response = requests.post(token_url, data=payload)
            response.raise_for_status()
            tokens = response.json()
            
            # Google might not return a new refresh token, so preserve the old one
            if 'refresh_token' not in tokens:
                tokens['refresh_token'] = refresh_token
                
            return tokens
        except RequestException as req_err:
            print(f'Refresh token error: {req_err}')
            raise ValueError(f'Failed to refresh token: {req_err}')
        

    # def validate_token(self, access_token):
    #     token_info_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo'
    #     params = {'access_token': access_token}

    #     response = requests.get(token_info_url, params=params)

    #     if response.status_code == 200:
    #         token_info = response.json()
    #         print("Token Info:", token_info)
    #         return token_info
    #     else:
    #         print(f"Error validating token: {response.status_code}")
    #         print(f"Response content: {response.text}")
    #         return None
        
    
    def create_or_update_user(self, user_info):
        # Extract user details
        email = user_info.get('email')
        name = user_info.get('name')
        user_id = user_info.get('sub')

        # Get or create the user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': user_id, 'first_name': name}
        )
        return user


    def exchange_code_with_token(self, authorization_code):  # Fixed typo
        token_url = 'https://oauth2.googleapis.com/token'
        payload = {
            'code': authorization_code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': 'http://localhost:3000/redirect',
            'grant_type': 'authorization_code',
        }
        try:
            response = requests.post(token_url, data=payload)
            response.raise_for_status()
            tokens = response.json()
            print(f"Full token response: {tokens}")  # Log the entire response
            return tokens
        except RequestException as req_err:
            print(f'Request error occurred: {req_err}')
            return {'error': f'Request error occurred: {req_err}'}
      
    def post(self, request):
        '''
        Handle POST requests for Google OAuth2 login.

        Args:
            request (Request) : The HTTP request object containing the access token
        
        Returns:
            Response: A DRF Response object containing the JWT tokens or an error message.
        '''
        action = request.data.get('action')

        if action == 'login':
            code = request.data.get('code')
            if not code:
                return Response({'error': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                google_tokens = self.exchange_code_with_token(code)
                access_token = google_tokens['access_token']

                user_info = self.get_user_info(access_token)
                user = self.create_or_update_user(user_info)

                # Create JWT token
                jwt_token = create_jwt_token(user_id=user)
                # emails = service_gmail(access_token)

                return Response({
                    'access_token' : google_tokens['access_token'],
                    'expires_in' : google_tokens['expires_in'],
                    'refresh_token' : google_tokens['refresh_token'],
                    'jwt_token': jwt_token,
                })
            except ValueError as e:
                # Return error response if token is invalid or expired
                return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        elif action == 'exchange_gmail_token':
            code = request.data.get('code')
            google_tokens = self.exchange_code_with_token(code)
            access_token = google_tokens['access_token']
            return Response({
                    'access_token' : google_tokens['access_token'],
                    'expires_in' : google_tokens['expires_in'],
                    'refresh_token' : google_tokens['refresh_token'],
                })
        
        elif action == 'retrieve_gmail':
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
                emails = service_gmail(access_token)
                return Response({
                    'gmails': emails
                })
            else:
                return Response({'error': 'Bearer Token was not provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
        elif action == 'refresh_token':
            refresh_token = request.data.get('refresh_token')
            token_type = request.data.get('token_type', 'basic')  # 'basic' or 'gmail'
            if not refresh_token:
                return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                new_tokens = self.refresh_access_token(refresh_token, token_type)
                return Response({
                    'access_token': new_tokens['access_token'],
                    'expires_in': new_tokens.get('expires_in', 3600),
                    'refresh_token': new_tokens['refresh_token'],
                    'token_type': token_type
                })
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'Failed to refresh token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)