import React, { useState } from 'react';

const LogIn: React.FC = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'default-client-id';
  const redirectUri = 'http://localhost:3000/redirect';
  const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

  const [isHovered, setIsHovered] = useState(false);

  const handleGoogleLogin = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    margin: 0,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  };

  const backgroundPatternStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
    `,
    zIndex: 1,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '50px 40px',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
    maxWidth: '520px',
    width: '100%',
    position: 'relative',
    zIndex: 2,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  };

  const logoContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '30px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '42px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    letterSpacing: '-0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '30px',
    fontWeight: '500',
    lineHeight: '1.5',
  };

  const featuresContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  };

  const featureItemStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    textAlign: 'left',
  };

  const featureIconStyle: React.CSSProperties = {
    fontSize: '24px',
    marginBottom: '12px',
    display: 'block',
  };

  const featureTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  };

  const featureDescriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: isHovered ? '#5a67d8' : '#667eea',
    color: '#ffffff',
    padding: '16px 32px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    boxShadow: isHovered 
      ? '0 8px 25px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
      : '0 4px 15px rgba(102, 126, 234, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    margin: '0 auto',
    width: 'fit-content',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundPatternStyle}></div>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <img 
            src="/ai-guard-logo-large.svg" 
            alt="AI Guard Logo" 
            style={{ 
              width: '72px', 
              height: '72px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
            }} 
          />
          <h1 style={titleStyle}>AI Guard</h1>
        </div>
        
        <p style={subtitleStyle}>
          Your intelligent shield against email threats. Advanced AI-powered detection for phishing, spam, and malicious content.
        </p>

        <div style={featuresContainerStyle}>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🛡️</span>
            <div style={featureTitleStyle}>Smart Protection</div>
            <div style={featureDescriptionStyle}>
              AI-powered detection of phishing attempts, spam, and malicious content with high accuracy
            </div>
          </div>
          
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>📧</span>
            <div style={featureTitleStyle}>Gmail Integration</div>
            <div style={featureDescriptionStyle}>
              Seamlessly import and analyze emails from your Gmail account with secure OAuth authentication
            </div>
          </div>
          
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>📊</span>
            <div style={featureTitleStyle}>CSV Upload</div>
            <div style={featureDescriptionStyle}>
              Upload custom email datasets in CSV format for batch analysis and threat detection
            </div>
          </div>
          
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🔍</span>
            <div style={featureTitleStyle}>Detailed Analysis</div>
            <div style={featureDescriptionStyle}>
              Get comprehensive insights into email classification with confidence scores and explanations
            </div>
          </div>
        </div>

        <button
          style={buttonStyle}
          onClick={handleGoogleLogin}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21.805 10.023H12.33v4.11h5.376c-.234 1.32-.96 2.46-1.974 3.3v2.742h3.192c1.866-1.716 2.952-4.224 2.952-7.152 0-.636-.06-1.266-.15-1.896z"
              fill="#ffffff"
            />
            <path
              d="M12.33 22.023c2.688 0 4.944-.888 6.594-2.406l-3.192-2.742c-.894.606-2.028.966-3.402.966-2.616 0-4.842-1.77-5.628-4.164H3.33v2.742c1.638 3.246 5.004 5.604 8.976 5.604z"
              fill="#ffffff"
            />
            <path
              d="M6.702 13.785c-.198-.594-.306-1.23-.306-1.89s.108-1.296.306-1.89V7.263H3.33c-.564 1.11-.888 2.364-.888 3.636 0 1.272.324 2.526.888 3.636l3.372-2.742z"
              fill="#ffffff"
            />
            <path
              d="M12.33 5.457c1.494 0 2.838.516 3.894 1.524l2.916-2.916C17.406 2.457 15.15 1.557 12.33 1.557c-3.972 0-7.338 2.358-8.976 5.604L6.702 9.903c.786-2.394 3.012-4.164 5.628-4.164z"
              fill="#ffffff"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default LogIn;