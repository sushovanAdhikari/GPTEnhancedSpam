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
import requests


@method_decorator(csrf_exempt, name='dispatch')
class GoogleLogin(APIView):
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
        

    
    import requests

    def validate_token(self, access_token):
        token_info_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo'
        params = {'access_token': access_token}

        response = requests.get(token_info_url, params=params)

        if response.status_code == 200:
            token_info = response.json()
            print("Token Info:", token_info)
            return token_info
        else:
            print(f"Error validating token: {response.status_code}")
            print(f"Response content: {response.text}")
            return None
        
    
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



    def exchange_code_with_token(self, authoization_code):
        token_url = 'https://oauth2.googleapis.com/token'
        payload = {
            'code': authoization_code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': 'http://localhost:3000/redirect',
            'grant_type': 'authorization_code'
        }
        try:
            response = requests.post(token_url, data=payload)
            response.raise_for_status()
            tokens = response.json()
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
        authorization_code = request.data.get('authorization_code')

        if not authorization_code:
            return Response({'error': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tokens = self.exchange_code_with_token(authorization_code)

            access_token = tokens['access_token']
            # validate_token = self.validate_token(access_token)
            user_info = self.get_user_info(access_token)
            user = self.create_or_update_user(user_info)

            # Create JWT token
            jwt_token = create_jwt_token(user_id=user)
            result = list_emails(access_token)
            if 'error' in result:
                # Handle the error (log, notify user, etc.)
                print(f"Error: {result['error']}")
                print(f"Details: {result['details']}")
                # You can raise an exception or handle the error based on your application's needs
            else:
                # Process the successful result
                emails = result
                print("Emails fetched successfully:")
                print(emails)

                for email in emails:
                    get_email_details(access_token, email)


            return Response({
                'access_token': access_token,
                #start working here
                # 'refresh_token': refresh_token,
                'token': jwt_token,
                'emails': emails
            })
        except ValueError as e:
            # Return error response if token is invalid or expired
            return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)



def list_emails(access_token):
    # Define the endpoint URL for listing emails
    url = 'https://www.googleapis.com/gmail/v1/users/me/messages'
    
    # Set up the headers with the access token
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }

    params = {
        'maxResults': 30
    }
    
    try:
        # Make the request to fetch the email list
        response = requests.get(url, headers=headers, params=params)
        
        # Handle the response
        if response.status_code == 200:
            # Successfully retrieved the email list
            emails = response.json()
            return emails
        else:
            # Handle errors
            return {'error': 'Failed to fetch emails', 'details': response.json()}
    
    except requests.RequestException as e:
        # Handle exceptions
        return {'error': 'Request failed', 'details': str(e)}
    

def get_email_details(access_token, message_id):
    url = f'https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}'
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            return {'error': 'Failed to fetch email details', 'details': response.json()}
    except requests.RequestException as e:
        return {'error': 'Request failed', 'details': str(e)}
