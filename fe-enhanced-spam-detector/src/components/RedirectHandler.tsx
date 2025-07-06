import React, { useEffect, useState, useRef } from 'react';
import sanitizeHtml from 'sanitize-html';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface Email {
  text: string;
  html?: string;
  subject: string[] | null;
  from_sender?: string[] | null;
  to_recipient?: string[] | null;
  delivered_to?: string[] | null;
  datetime?: string[] | null;
  return_path?: string[] | null;
}

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_received_at: number;
  scope: string;
}

interface UserTokens {
  basic?: TokenData;
  gmail?: TokenData;
  jwt_token?: string;
}

interface ApiResponse {
  token_type: 'basic' | 'gmail';
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope: string;
  jwt_token?: string;
}

interface DashboardState {
  basic?: TokenData;
  gmail?: TokenData;
  jwt_token?: string;
  emails: Email[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardState>({ emails: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<number>(-1);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'gmail' | 'csv'>('gmail');
  const [csvEmails, setCsvEmails] = useState<Email[]>([]);
  const dividerRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState<number>(400);
  const [gmailTabHovered, setGmailTabHovered] = useState<boolean>(false);
  const [csvTabHovered, setCsvTabHovered] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<Array<{
    emailIndex: number;
    prediction: string;
    probabilities: {
      "AI Phishing": number;
      "Human Phishing": number;
      "Legitimate": number;
    };
  }>>([]);



  const isTokenExpired = (tokenData: TokenData): boolean => {
    if (!tokenData.expires_in || !tokenData.token_received_at) return true;
    
    const expiryTime = tokenData.token_received_at + tokenData.expires_in;
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes buffer
    return currentTime >= (expiryTime - bufferTime);
  };

  const getStoredTokens = (): UserTokens => {
    const storedData = localStorage.getItem('userTokens');
    return storedData ? JSON.parse(storedData) : {};
  };

  const saveTokens = (tokens: UserTokens): void => {
    localStorage.setItem('userTokens', JSON.stringify(tokens));
  };

  const clearTokens = (): void => {
    localStorage.removeItem('userTokens');
    localStorage.removeItem('gmailData'); // Clear legacy data
  };

  // Updated useEffect with dual token support
  useEffect(() => {
    console.log('useEffect triggered - checking for OAuth code or stored tokens');
        // Handle OAuth redirect
    const query = new URLSearchParams(window.location.search);
    const code = query.get('code');
    const scope = query.get('scope');
    
    if (code && scope) {
      const decodedScope = decodeURIComponent(scope);
      console.log('Received scope:', decodedScope); // Add this debug line
      
      // Determine which type of authorization this is
      let tokenType: 'basic' | 'gmail';
      let apiEndpoint: string;
      let action: string;
      
      if (decodedScope.includes('gmail') || decodedScope.includes('https://www.googleapis.com/auth/gmail.readonly')) {
        tokenType = 'gmail';
        apiEndpoint = 'http://127.0.0.1:8000/api/auth/google/';
        action = 'exchange_gmail_token';
      } else if (decodedScope.includes('userinfo') || decodedScope.includes('https://www.googleapis.com/auth/userinfo')) {
          tokenType = 'basic';
          apiEndpoint = 'http://127.0.0.1:8000/api/auth/google/';
          action = 'login';
      } else {
          console.log('Received scope:', decodedScope); // Add this for debugging
          setError('Unknown authorization scope');
          navigate('/');
          return;
      }

      
      const fetchTokens = async () => {
        try {
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, action: action }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error:', errorText)
            throw new Error(`Failed to exchange ${tokenType} authorization code: ${response.status}`);
          }
          
          const fetchedData: ApiResponse = await response.json();
          
          // Create token data with timestamp
          const tokenData: TokenData = {
            access_token: fetchedData.access_token,
            refresh_token: fetchedData.refresh_token,
            expires_in: fetchedData.expires_in || 3600,
            token_received_at: Math.floor(Date.now() / 1000),
            scope: fetchedData.scope || ''
          };
          
          // Get existing tokens and update with new token
          const existingTokens = getStoredTokens();
          const updatedTokens: UserTokens = {
            ...existingTokens,
            [tokenType]: tokenData,
            jwt_token: fetchedData.jwt_token || existingTokens.jwt_token
          };
          
          // Save updated tokens
          saveTokens(updatedTokens);
          
          // Update component state
          console.log('OAuth callback: Setting data, current emails:', data.emails?.length || 0);
          setData(prev => {
            console.log('OAuth callback: Previous emails:', prev.emails?.length || 0);
            const newState = {
              basic: updatedTokens.basic,
              gmail: updatedTokens.gmail,
              jwt_token: updatedTokens.jwt_token,
              emails: prev.emails || [] // Preserve existing emails
            };
            console.log('OAuth callback: New state emails:', newState.emails.length);
            return newState;
          });
          
          // Clean up URL
          window.history.replaceState({}, document.title, '/dashboard');
          
          console.log(`${tokenType} authentication successful`);

          // Reset OAuth progress flag
          setIsOAuthInProgress(false);

          // Only auto-fetch Gmail emails if this is a fresh Gmail authentication
          // and we're not already on the dashboard
          if (tokenType === 'gmail' && !existingTokens.gmail && window.location.pathname === '/dashboard') {
            console.log('Auto-fetching Gmail emails after fresh authentication...');
            // Fetch emails immediately without setTimeout
            fetchGmailEmails();
          } else {
            console.log('Skipping auto-fetch:', {
              tokenType,
              hadExistingGmail: !!existingTokens.gmail,
              currentPath: window.location.pathname
            });
          }

          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          setError(`${tokenType} authentication failed: ${errorMessage}`);
          clearTokens();
          navigate('/');
        }
      };
      
      fetchTokens();
    } else {
      // No authorization code - check if we have stored tokens
      const storedTokens = getStoredTokens();
      if (storedTokens.basic || storedTokens.gmail) {
        console.log('No auth code but found stored tokens, checking validity...');
        // Let the rest of the useEffect handle token validation
      } else {
        // No stored tokens and no authorization code - redirect to login
        console.log('No auth code and no stored tokens, redirecting to login...');
        navigate('/');
      }
    }


    // First check for legacy data and migrate if needed
    const legacyData = localStorage.getItem('gmailData');
    if (legacyData) {
      try {
        const parsedLegacy = JSON.parse(legacyData);
        // Migrate to new format
        const migratedTokens: UserTokens = {
          basic: {
            access_token: parsedLegacy.access_token,
            refresh_token: parsedLegacy.refresh_token,
            expires_in: parsedLegacy.expires_in || 3600,
            token_received_at: Math.floor(Date.now() / 1000) - 3600, // Assume expired
            scope: 'basic'
          },
          jwt_token: parsedLegacy.jwt_token
        };
        saveTokens(migratedTokens);
        localStorage.removeItem('gmailData');
      } catch (e) {
        console.error('Failed to migrate legacy data:', e);
        localStorage.removeItem('gmailData');
      }
    }

    const storedTokens = getStoredTokens();
    
    // Check if we have valid tokens stored
    if (storedTokens.basic || storedTokens.gmail) {
      let hasValidToken = false;
      
      // Check basic token
      if (storedTokens.basic && !isTokenExpired(storedTokens.basic)) {
        hasValidToken = true;
      } else if (storedTokens.basic?.refresh_token) {
        refreshAccessToken('basic', storedTokens.basic.refresh_token);
        return;
      }
      
      // Check Gmail token
      if (storedTokens.gmail && !isTokenExpired(storedTokens.gmail)) {
        hasValidToken = true;
      } else if (storedTokens.gmail?.refresh_token) {
        refreshAccessToken('gmail', storedTokens.gmail.refresh_token);
        return;
      }
      
      if (hasValidToken) {
        console.log('useEffect: Setting data with stored tokens, current emails:', data.emails?.length || 0);
        setData(prev => {
          console.log('useEffect: Previous emails:', prev.emails?.length || 0);
          const newState = {
            basic: storedTokens.basic,
            gmail: storedTokens.gmail,
            jwt_token: storedTokens.jwt_token,
            emails: prev.emails || [] // Preserve existing emails
          };
          console.log('useEffect: New state emails:', newState.emails.length);
          return newState;
        });
        return;
      }
    }
  }, []);

  // Updated refresh function to handle token types
  const refreshAccessToken = async (tokenType: 'basic' | 'gmail', refreshToken: string) => {

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'refresh_token',
          refresh_token: refreshToken,
          token_type: tokenType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh ${tokenType} token`);
      }
      
      const refreshedData = await response.json();
      
      // Update stored tokens
      const existingTokens = getStoredTokens();
      const updatedTokenData: TokenData = {
        access_token: refreshedData.access_token,
        refresh_token: refreshedData.refresh_token || refreshToken,
        expires_in: refreshedData.expires_in || 3600,
        token_received_at: Math.floor(Date.now() / 1000),
        scope: existingTokens[tokenType]?.scope || ''
      };
      
      const updatedTokens: UserTokens = {
        ...existingTokens,
        [tokenType]: updatedTokenData
      };
      
      saveTokens(updatedTokens);
      
      // Update component state
      setData(prev => ({
        basic: updatedTokens.basic,
        gmail: updatedTokens.gmail,
        jwt_token: updatedTokens.jwt_token,
        emails: prev.emails || [] // Preserve existing emails
      }));
      
      console.log(`${tokenType} token refreshed successfully`);
      
    } catch (err) {
      console.error(`Failed to refresh ${tokenType} token:`, err);
      clearTokens();
      navigate('/');
    }
  };

  const fetchGmailEmails = async () => {
    // Prevent multiple OAuth flows
    if (isOAuthInProgress) {
      console.log('OAuth flow already in progress, skipping...');
      return;
    }

    // Debug: Log current authentication state
    console.log('Current authentication state:', {
      hasBasicToken: !!data.basic?.access_token,
      hasGmailToken: !!data.gmail?.access_token,
      basicTokenExpired: data.basic ? isTokenExpired(data.basic) : 'N/A',
      gmailTokenExpired: data.gmail ? isTokenExpired(data.gmail) : 'N/A',
      storedTokens: getStoredTokens()
    });

    // Check if we have basic authentication first
    // Also check stored tokens if component state is empty
    const storedTokens = getStoredTokens();
    if (!data.basic?.access_token && !storedTokens.basic?.access_token) {
      console.log('No basic authentication found, redirecting to login...');
      setError('Please complete basic authentication first');
      navigate('/');
      return;
    }

    // If component state is empty but stored tokens exist, load them
    if (!data.basic?.access_token && storedTokens.basic?.access_token) {
      console.log('Loading stored tokens into component state...');
      setData({
        basic: storedTokens.basic,
        gmail: storedTokens.gmail,
        jwt_token: storedTokens.jwt_token,
        emails: data.emails || []
      });
      // Continue with the fetch using stored tokens
    }

    // Check if we have Gmail token
    if (!data.gmail?.access_token && !storedTokens.gmail?.access_token) {
      // No Gmail token - initiate Gmail OAuth
      console.log('No Gmail token found, initiating OAuth flow...');
      setIsOAuthInProgress(true);
      const gmailScope = 'https://www.googleapis.com/auth/gmail.readonly';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:3000/redirect&scope=${encodeURIComponent(gmailScope)}&access_type=offline&prompt=consent`;
      window.location.href = authUrl;
      return;
    }

    // If component state is missing Gmail token but stored token exists, load it
    if (!data.gmail?.access_token && storedTokens.gmail?.access_token) {
      console.log('Loading stored Gmail token into component state...');
      setData(prev => ({
        ...prev,
        gmail: storedTokens.gmail
      }));
      // Continue with the fetch using stored token
    }

    // Prevent multiple simultaneous requests
    if (loading) {
      console.log('Gmail fetch already in progress, skipping...');
      return;
    }

    setLoading(true);
    try {
      // Get the current Gmail token (either from state or stored)
      const currentGmailToken = data.gmail?.access_token || storedTokens.gmail?.access_token;
      if (!currentGmailToken) {
        throw new Error('No Gmail access token available');
      }

      const response = await fetch('http://127.0.0.1:8000/api/auth/google/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentGmailToken}`},
        body: JSON.stringify({
          action: 'retrieve_gmail'
        })
      });

      if (!response.ok) {
        console.log(`Gmail API response not ok: ${response.status} ${response.statusText}`);
        
        // If token is invalid or expired, try to refresh
        const currentGmailRefreshToken = data.gmail?.refresh_token || storedTokens.gmail?.refresh_token;
        if ((response.status === 403 || response.status === 401) && currentGmailRefreshToken) {
          console.log('Token appears invalid, attempting refresh...');
          try {
            await refreshAccessToken('gmail', currentGmailRefreshToken);
            // Retry the request with new token
            const updatedTokens = getStoredTokens();
            if (updatedTokens.gmail) {
              const retryResponse = await fetch('http://127.0.0.1:8000/api/auth/google/', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${updatedTokens.gmail.access_token}`
                },
                body: JSON.stringify({ action: 'retrieve_gmail' })
              });
              if (!retryResponse.ok) {
                console.error('Retry failed after token refresh:', retryResponse.status, retryResponse.statusText);
                throw new Error(`Failed to fetch emails after token refresh: ${retryResponse.statusText}`);
              }
              const retryData = await retryResponse.json();
              const emailData: Email[] = retryData.gmails;
              setData(prev => ({ ...prev, emails: emailData }));
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear invalid tokens to prevent loops
            clearTokens();
            setError('Gmail authentication failed. Please try logging in again.');
            navigate('/');
            return;
          }
        } else {
          console.error('Gmail API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch emails: ${response.statusText}`);
        }
      } else {
        const responseData = await response.json();
        console.log('Full response:', responseData)
        const emailData: Email[] = responseData.gmails;
        console.log('Setting emails:', emailData.length, 'emails');
        setData(prev => {
          console.log('Previous state emails:', prev.emails?.length || 0);
          const newState = { ...prev, emails: emailData };
          console.log('New state emails:', newState.emails.length);
          return newState;
        });
      }
      
      setSelectedEmails([]);
      setSelectedEmail(-1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => {
        const cols = row.match(/(".*?"|[^",\n]+)(?=\s*,|\s*$)/g) || [];
        return cols.map(col => col.replace(/^"|"$/g, '').trim());
      });
      const headers = rows[0];
      const emails = rows.slice(1).filter(row => row.length >= 2).map(row => ({
        text: row[headers.indexOf('content')] || '',
        html: '',
        subject: [row[headers.indexOf('subject')] || 'No Subject'],
        from_sender: null,
        to_recipient: null,
        delivered_to: null,
        datetime: null,
        return_path: null,
      }));
      setCsvEmails(emails);
      setSelectedEmails([]);
      setSelectedEmail(-1);
    };
    reader.readAsText(file);
  };

  const toggleEmailSelection = (index: number) => {
    setSelectedEmails(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanResults([]);
    
    const selectedIndices = selectedEmails;
    const results: Array<{
      emailIndex: number;
      prediction: string;
      probabilities: {
        "AI Phishing": number;
        "Human Phishing": number;
        "Legitimate": number;
      };
    }> = [];

    try {
      for (let i = 0; i < selectedIndices.length; i++) {
        const emailIndex = selectedIndices[i];
        const email = emails[emailIndex];
        
        // Prepare email content for analysis
        let emailContent = email.html || email.text || '';
        
        // Strip HTML tags to reduce token count
        if (email.html) {
          emailContent = emailContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        
        const emailSubject = email.subject?.[0] || '';
        
        // Truncate content to fit BERT model's token limit (roughly 1000 characters to be very safe)
        const maxContentLength = 1000;
        const truncatedContent = emailContent.length > maxContentLength 
          ? emailContent.substring(0, maxContentLength) + '...'
          : emailContent;
        
        const fullContent = `Subject: ${emailSubject}\n\nContent: ${truncatedContent}`;

        // Call Hugging Face API
        const apiUrl = process.env.REACT_APP_HUGGING_FACE_API || '';
        const apiToken = process.env.REACT_APP_HUGGING_FACE_TOKEN || '';
        
        if (!apiUrl) {
          throw new Error('REACT_APP_HUGGING_FACE_API environment variable is not set');
        }
        
        if (!apiToken) {
          throw new Error('REACT_APP_HUGGING_FACE_TOKEN environment variable is not set');
        }
        
        // For Hugging Face Spaces, we need to use a different request format
        const isSpaceUrl = apiUrl.includes('.hf.space') || apiUrl.includes('/predict');
        
        console.log('API Debug Info:', {
          apiUrl,
          hasToken: !!apiToken,
          emailIndex,
          contentLength: fullContent.length,
          isSpaceUrl
        });
        
        // Hugging Face Spaces typically expect the data in a specific format
        const requestBody = isSpaceUrl 
          ? { text: fullContent }  // Space API format - your specific format
          : { inputs: fullContent }; // Inference API format
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`, // Always include Authorization header
        };
        
        // Use the API URL directly - no CORS proxy needed
        const finalUrl = apiUrl;
        
        const response = await fetch(finalUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        console.log(`the api being called is ${finalUrl}`)
        console.log(`also the headers is ${headers}`)
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            url: finalUrl,
            errorText,
            requestBody,
            headers
          });
          throw new Error(`API call failed for email ${i + 1}: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        
        // Handle different response formats
        let prediction: string;
        let probabilities: any;
        
        if (isSpaceUrl) {
          // Space API response format
          const spaceResult = result.data?.[0] || result;
          prediction = spaceResult.prediction || spaceResult.label || 'Unknown';
          probabilities = spaceResult.probabilities || spaceResult.scores || {
            "AI Phishing": 0,
            "Human Phishing": 0,
            "Legitimate": 0
          };
        } else {
          // Inference API response format
          prediction = result.prediction || result[0]?.label || 'Unknown';
          probabilities = result.probabilities || result[0]?.score || {
            "AI Phishing": 0,
            "Human Phishing": 0,
            "Legitimate": 0
          };
        }

        results.push({
          emailIndex,
          prediction,
          probabilities,
        });

        // Update results incrementally for better UX
        setScanResults([...results]);
      }

      console.log('Scan completed:', results);
      
      // TODO: Navigate to results page or show results in modal
      // For now, we'll show results in the console and prepare for future implementation
      
    } catch (error) {
      console.error('Scan failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsScanning(false);
    }
  };

  const selectAllEmails = () => {
    setSelectedEmails(emails.map((_, index) => index));
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };



  const logout = () => {
    clearTokens();
    navigate('/');
  };

  // Resizer logic
  useEffect(() => {
    const divider = dividerRef.current;
    if (!divider) return;

    let isDragging = false;
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !divider) return;
      const newWidth = e.clientX - divider.getBoundingClientRect().left - divider.offsetWidth / 2;
      if (newWidth > 200 && newWidth < 600) setPaneWidth(newWidth);
    };
    const onMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    };

    divider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      divider.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Styles moved to Dashboard.css





  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  const emails = activeTab === 'gmail' ? (data.emails || []) : (csvEmails || []);
  const hasBasicAuth = !!data.basic?.access_token;
  const hasGmailAuth = !!data.gmail?.access_token;

  console.log('emails value:', emails);
  console.log('emails type:', typeof emails);
  console.log('is array:', Array.isArray(emails));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <img 
            src="/ai-guard-logo-large.svg" 
            alt="AI Guard Logo" 
            className="dashboard-logo"
          />
          AI Guard
        </h1>
        <div className="dashboard-status">
          <div className="dashboard-status-item">
            <span>🔐 Basic Auth:</span>
            <span className="dashboard-status-indicator">
              {hasBasicAuth ? '✅' : '❌'}
            </span>
          </div>
          <div className="dashboard-status-item">
            <span>📧 Gmail Access:</span>
            <span className="dashboard-status-indicator">
              {hasGmailAuth ? '✅' : '❌'}
            </span>
          </div>
          <button 
            onClick={logout} 
            className="dashboard-logout-button"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tab-container">
        <div
          className={`dashboard-tab ${activeTab === 'gmail' ? 'active' : ''} ${gmailTabHovered ? 'hover' : ''}`}
          onClick={() => setActiveTab('gmail')}
          onMouseEnter={() => setGmailTabHovered(true)}
          onMouseLeave={() => setGmailTabHovered(false)}
        >
          <span style={{ fontSize: '18px' }}>📧</span>
          Import from Gmail
        </div>
        <div
          className={`dashboard-tab ${activeTab === 'csv' ? 'active' : ''} ${csvTabHovered ? 'hover' : ''}`}
          onClick={() => setActiveTab('csv')}
          onMouseEnter={() => setCsvTabHovered(true)}
          onMouseLeave={() => setCsvTabHovered(false)}
        >
          <span style={{ fontSize: '18px' }}>📊</span>
          Upload CSV
        </div>
      </div>

      {activeTab === 'gmail' && (
        <div className="dashboard-gmail-section">
          <button
            className={`dashboard-button ${loading ? 'disabled' : ''}`}
            onClick={fetchGmailEmails}
            disabled={loading}
          >
            {loading ? '⏳ Fetching...' : hasGmailAuth ? '📥 Fetch Emails' : '🔗 Connect Gmail'}
          </button>
          {!hasGmailAuth && (
            <div className="dashboard-gmail-info">
              <span>ℹ️</span>
              <span>Click to grant Gmail permissions for email analysis</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="dashboard-csv-upload-container">
          <div className="dashboard-button-row">
            <div>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCsvUpload} 
                className="dashboard-file-input"
                id="csv-file-input"
              />
              <label 
                htmlFor="csv-file-input"
                className="dashboard-file-input-label"
              >
                📁 Choose CSV File
              </label>
            </div>
            <a 
              href="/sample-email.csv" 
              download 
              className="dashboard-download-button"
            >
              📥 Download Sample CSV
            </a>
          </div>
          <div className="dashboard-csv-instructions">
            <div className="dashboard-instruction-title">
              📋 Instructions
            </div>
            <div className="dashboard-instruction-item">
              Download the sample CSV template to see the required format
            </div>
            <div className="dashboard-instruction-item">
              Your CSV should have columns: <code style={{ backgroundColor: '#f1f3f4', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>subject</code> and <code style={{ backgroundColor: '#f1f3f4', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>content</code>
            </div>
            <div className="dashboard-instruction-item">
              Upload your CSV file to analyze the emails for spam detection
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        <div className="dashboard-email-list" style={{ flex: `0 0 ${paneWidth}px` }}>
          {emails.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                {activeTab === 'gmail' ? '📧' : '📊'}
              </div>
              <div className="dashboard-empty-title">
                {activeTab === 'gmail' ? 'No emails fetched yet' : 'No CSV data loaded'}
              </div>
              <div className="dashboard-empty-subtitle">
                {activeTab === 'gmail' 
                  ? 'Click "Fetch Emails" to import your Gmail messages' 
                  : 'Upload a CSV file to analyze your email data'
                }
              </div>
            </div>
          ) : (
            <>
              <div className="dashboard-email-list-header">
                <div className="dashboard-email-count">
                  {selectedEmails.length > 0 
                    ? `${selectedEmails.length} of ${emails.length} emails selected`
                    : `${emails.length} emails`
                  }
                </div>
                <div className="dashboard-selection-controls">
                  {selectedEmails.length > 0 && (
                    <button
                      className="dashboard-selection-button"
                      onClick={clearSelection}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    className={`dashboard-selection-button ${selectedEmails.length === emails.length ? 'hover' : ''}`}
                    onClick={selectedEmails.length === emails.length ? clearSelection : selectAllEmails}
                  >
                    {selectedEmails.length === emails.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th className="dashboard-table-header" style={{ width: '40px' }}></th>
                      <th className="dashboard-table-header">Subject</th>
                      {activeTab === 'gmail' && <th className="dashboard-table-header">From</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {emails.map((email, index) => {
                      // Skip rendering if email is undefined or null
                      if (!email) {
                        return null;
                      }
                      
                      return (
                        <tr
                          key={index}
                          className={`dashboard-email-row ${
                            selectedEmails.includes(index) 
                              ? 'selected' 
                              : selectedEmail === index 
                                ? 'hover' 
                                : ''
                          }`}
                          onClick={() => setSelectedEmail(index)}
                          onMouseEnter={(e) => {
                            if (!selectedEmails.includes(index)) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedEmails.includes(index)) {
                              e.currentTarget.style.backgroundColor = '';
                            }
                          }}
                        >
                          <td className="dashboard-table-cell">
                            <input
                              type="checkbox"
                              className="dashboard-checkbox"
                              checked={selectedEmails.includes(index)}
                              onChange={() => toggleEmailSelection(index)}
                              onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                            />
                          </td>
                          <td className="dashboard-table-cell">
                            <div style={{ fontWeight: selectedEmails.includes(index) ? '600' : '400' }}>
                              {email.subject?.[0] || 'No Subject'}
                            </div>
                          </td>
                          {activeTab === 'gmail' && (
                            <td className="dashboard-table-cell">
                              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                {email.from_sender?.[0] || 'Unknown Sender'}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div ref={dividerRef} className="dashboard-divider" />
        <div className="dashboard-email-content">
          {selectedEmail >= 0 && emails[selectedEmail] ? (
            <>
              <h2>{emails[selectedEmail].subject?.[0] || 'No Subject'}</h2>
              {activeTab === 'gmail' && (
                <p>From: {emails[selectedEmail].from_sender?.[0] || 'Unknown Sender'}</p>
              )}
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(emails[selectedEmail].html || emails[selectedEmail].text) }} />
            </>
          ) : (
            <p>Select an email to view its content</p>
          )}
        </div>
      </div>

            {/* Scan Results Section */}
      {scanResults.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '24px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 Scan Results ({scanResults.length} email{scanResults.length !== 1 ? 's' : ''})
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  // Export results to CSV
                  const csvContent = scanResults.map((result, index) => {
                    const email = emails[result.emailIndex];
                    
                    // Handle undefined email
                    if (!email) {
                      return {
                        'Email Index': index + 1,
                        'Subject': 'Unknown Email',
                        'From': 'Unknown',
                        'Prediction': result.prediction,
                        'AI Phishing %': (result.probabilities['AI Phishing'] * 100).toFixed(1),
                        'Human Phishing %': (result.probabilities['Human Phishing'] * 100).toFixed(1),
                        'Legitimate %': (result.probabilities['Legitimate'] * 100).toFixed(1),
                        'Confidence': Math.max(...Object.values(result.probabilities)) >= 0.8 ? 'High' : 
                                    Math.max(...Object.values(result.probabilities)) >= 0.6 ? 'Medium' : 'Low'
                      };
                    }
                    
                    return {
                      'Email Index': index + 1,
                      'Subject': email.subject?.[0] || 'No Subject',
                      'From': email.from_sender?.[0] || 'Unknown',
                      'Prediction': result.prediction,
                      'AI Phishing %': (result.probabilities['AI Phishing'] * 100).toFixed(1),
                      'Human Phishing %': (result.probabilities['Human Phishing'] * 100).toFixed(1),
                      'Legitimate %': (result.probabilities['Legitimate'] * 100).toFixed(1),
                      'Confidence': Math.max(...Object.values(result.probabilities)) >= 0.8 ? 'High' : 
                                  Math.max(...Object.values(result.probabilities)) >= 0.6 ? 'Medium' : 'Low'
                    };
                  });
                  
                  const csv = [
                    Object.keys(csvContent[0]).join(','),
                    ...csvContent.map(row => Object.values(row).map(v => `"${v}"`).join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `phishing-scan-results-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📊 Export CSV
              </button>
              <button
                onClick={() => setScanResults([])}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  transition: 'all 0.2s ease'
                }}
              >
                Clear Results
              </button>
            </div>
          </div>
          
          {/* Scan Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Guidance Card */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              gridColumn: 'span 3'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 Understanding Your Results
              </div>
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                lineHeight: '1.5'
              }}>
                <strong>AI Phishing:</strong> Emails generated by AI tools that mimic legitimate communications. 
                <strong>Human Phishing:</strong> Traditional phishing emails crafted by humans. 
                <strong>Legitimate:</strong> Safe, legitimate emails. 
                Click on any result card to view the full email content and make informed decisions.
              </div>
            </div>
            {(() => {
              const summary = {
                'AI Phishing': scanResults.filter(r => r.prediction === 'AI Phishing').length,
                'Human Phishing': scanResults.filter(r => r.prediction === 'Human Phishing').length,
                'Legitimate': scanResults.filter(r => r.prediction === 'Legitimate').length
              };
              
              return Object.entries(summary).map(([category, count]) => {
                const color = category === 'AI Phishing' ? '#dc2626' : 
                             category === 'Human Phishing' ? '#ea580c' : '#059669';
                const percentage = ((count / scanResults.length) * 100).toFixed(1);
                
                return (
                  <div key={category} style={{
                    backgroundColor: '#ffffff',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: color,
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      marginBottom: '4px'
                    }}>
                      {count}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      marginBottom: '2px'
                    }}>
                      {category}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                      {percentage}%
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          
          <div style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
          }}>
            {scanResults.map((result, index) => {
              const email = emails[result.emailIndex];
              
              // Skip rendering if email is undefined or null
              if (!email) {
                return null;
              }
              
              const maxProbability = Math.max(...Object.values(result.probabilities));
              const predictionColor = result.prediction === 'AI Phishing' ? '#dc2626' : 
                                    result.prediction === 'Human Phishing' ? '#ea580c' : '#059669';
              const confidenceLevel = maxProbability >= 0.8 ? 'High' : 
                                    maxProbability >= 0.6 ? 'Medium' : 'Low';
              const confidenceColor = maxProbability >= 0.8 ? '#059669' : 
                                    maxProbability >= 0.6 ? '#d97706' : '#dc2626';
              
              return (
                <div key={index} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: result.prediction === 'AI Phishing' ? '2px solid #dc2626' : 
                         result.prediction === 'Human Phishing' ? '2px solid #ea580c' : '1px solid #e5e7eb',
                  boxShadow: result.prediction === 'AI Phishing' ? '0 4px 12px rgba(220, 38, 38, 0.15)' :
                             result.prediction === 'Human Phishing' ? '0 4px 12px rgba(234, 88, 12, 0.15)' :
                             '0 2px 8px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setSelectedEmail(result.emailIndex)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = result.prediction === 'AI Phishing' ? '0 6px 16px rgba(220, 38, 38, 0.2)' :
                                                   result.prediction === 'Human Phishing' ? '0 6px 16px rgba(234, 88, 12, 0.2)' :
                                                   '0 4px 12px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = result.prediction === 'AI Phishing' ? '0 4px 12px rgba(220, 38, 38, 0.15)' :
                                                   result.prediction === 'Human Phishing' ? '0 4px 12px rgba(234, 88, 12, 0.15)' :
                                                   '0 2px 8px rgba(0, 0, 0, 0.08)';
                }}
                >
                  {/* Priority indicator for high-risk emails */}
                  {result.prediction === 'AI Phishing' && maxProbability >= 0.7 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '20px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      zIndex: 1
                    }}>
                      ⚠️ HIGH RISK
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{ flex: '1' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        marginBottom: '4px'
                      }}>
                        {email.subject?.[0] || 'No Subject'}
                      </div>
                      {activeTab === 'gmail' && email.from_sender?.[0] && (
                        <div style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                          From: {email.from_sender[0]}
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '8px'
                    }}>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: predictionColor,
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {result.prediction}
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        backgroundColor: confidenceColor,
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                      }}>
                        {confidenceLevel} Confidence
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginTop: '16px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                      marginBottom: '4px'
                    }}>
                      Classification Probabilities:
                    </div>
                    {Object.entries(result.probabilities)
                      .sort(([,a], [,b]) => b - a) // Sort by probability descending
                      .map(([label, probability]) => {
                        const isTopPrediction = probability === maxProbability;
                        const barColor = label === 'AI Phishing' ? '#dc2626' : 
                                        label === 'Human Phishing' ? '#ea580c' : '#059669';
                        
                        return (
                          <div key={label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            backgroundColor: isTopPrediction ? '#f3f4f6' : 'transparent',
                            borderRadius: '8px',
                            border: isTopPrediction ? '1px solid #d1d5db' : '1px solid transparent'
                          }}>
                            <div style={{
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: isTopPrediction ? '600' : '500',
                              color: isTopPrediction ? '#111827' : '#374151',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {isTopPrediction && '🏆 '}
                              {label}
                            </div>
                            <div style={{
                              flex: '2',
                              height: '10px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '5px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <div style={{
                                width: `${probability * 100}%`,
                                height: '100%',
                                backgroundColor: barColor,
                                transition: 'width 0.5s ease',
                                borderRadius: '5px',
                                boxShadow: isTopPrediction ? '0 0 4px rgba(0,0,0,0.2)' : 'none'
                              }} />
                            </div>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: isTopPrediction ? '#111827' : '#374151',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                              minWidth: '45px',
                              textAlign: 'right'
                            }}>
                              {(probability * 100).toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmail(result.emailIndex);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👁️ View Email
                    </button>
                    {result.prediction !== 'Legitimate' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Copy email details to clipboard for reporting
                          const reportText = `Subject: ${email.subject?.[0] || 'No Subject'}\nFrom: ${email.from_sender?.[0] || 'Unknown'}\nPrediction: ${result.prediction}\nConfidence: ${(maxProbability * 100).toFixed(1)}%`;
                          navigator.clipboard.writeText(reportText);
                          alert('Email details copied to clipboard for reporting');
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        📋 Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className={`dashboard-floating-action-bar ${selectedEmails.length > 0 ? 'visible' : ''}`}>
        <div className="dashboard-scan-status">
          {isScanning 
            ? `Scanning ${scanResults.length + 1} of ${selectedEmails.length}...`
            : `${selectedEmails.length} email${selectedEmails.length !== 1 ? 's' : ''} selected`
          }
        </div>
        <button
          className={`dashboard-scan-button ${isScanning || loading ? 'disabled' : ''}`}
          onClick={handleScan}
          disabled={isScanning || loading}
        >
          {isScanning ? '⏳ Scanning...' : '🔍 Scan Emails'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;