import jwt
from datetime import datetime, timedelta
from django.conf import settings

def create_jwt_token(user_id):
    '''
    Create a JWT token for the given user ID.
    '''
    expiration = datetime.utcnow() + timedelta(hours=1)
    token = jwt.encode({
        'user_id': str(user_id),
        'exp': expiration
    }, settings.SECRET_KEY, algorithm = 'HS256')
    return token

def decode_jwt_token(token):
    '''
    Decode a JWT token and return the payload.
    '''
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None