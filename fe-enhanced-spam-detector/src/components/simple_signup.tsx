// LogIn.tsx
// This component handles Google OAuth login using the @react-oauth/google package.
// It includes both success and error handlers for the login process.

import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
// import axios from 'axios';

/**
 * LogIn Component
 * This component renders a Google Login button and handles the response.
 */
function LogIn() {
    /**
     * Handles the response after a successful login.
     * @param {CredentialResponse} response - The response object from Google.
     */

    const responseMessage = (response: CredentialResponse) => {
        console.log(response);
    };
 
    /** 
     * Handles the response when an error occurs during login
     * Logs an error message to the console
     * @returns {void}
    */

    const errorMessage = () => {
        console.log("An error occurred during login.");
    };

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'default-client-id';
    const redirectUri = 'http://localhost:3000/redirect'; 
    const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly'; // Combined scopes
    
        const handleGoogleLogin = () => {
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&access_type=offline`;
            window.location.href = authUrl;
        };
    
        return (
            <div>
                <h2>React Google Login</h2>
                <button onClick={handleGoogleLogin}>Login with Google</button>
            </div>
        );
}

export default LogIn;
