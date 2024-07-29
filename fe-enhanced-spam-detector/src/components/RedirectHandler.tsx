import React, { useEffect, useState } from 'react' 

const RedirectHandler: React.FC = () => {

    const [error, setError] = useState<string | null> (null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // URLSearchParams is a built-in JS Object that allows you to work with the query string of a URL.
        // Parses the query string into a more manageable format where you can easily access individual parameters.
        const query = new URLSearchParams(window.location.search);
        const code = query.get('code')
        
        if (code) {
            const fetchTokens = async() => {
                try {
                    console.log('Fetching Tokens')
                    const response = await fetch ('http://127.0.0.1:8000/api/auth/google/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            authorization_code: code
                        })
                    })

                    if(!response.ok) {
                        throw new Error('Failed to exchange authorization code for tokens');
                    }

                    const data = await response.json()
                    setData(data)
                } catch (error) {
                    setError('Failed to exhanged authorization code for tokens');
                    console.error('Error:', error);
                }
            };

            fetchTokens()
        } else {
            setError('Authorization code not found');
        }
    }, []);

    if (error) {
        return <div>Error: {error}</div>
    }
    if (data){
        const emails = Array.isArray(data.emails) ? data.emails : [];
        return (
        <div>
            <div>Access Token: {data.access_token}</div>
            <div>Emails:</div>
            {emails.map((email: any, index: number) => (
                <div key={index}>{email}</div>
            ))}
        </div>
        )
    }

    return <div>Loading...</div>;
};

export default RedirectHandler