# AI Guard - Enhanced Spam Detection System

<div align="center">
  <img src="fe-enhanced-spam-detector/public/ai-guard-logo-large.svg" alt="AI Guard Logo" width="120" height="120">
  <h1>AI Guard</h1>
  <p><strong>Your intelligent shield against email threats</strong></p>
  <p>Advanced AI-powered detection for phishing, spam, and malicious content with seamless Gmail integration.</p>
</div>

## 🚀 Features

### 🛡️ Smart Protection
- **AI-Powered Detection**: Advanced machine learning algorithms to identify phishing attempts, spam, and malicious content with high accuracy
- **Real-time Analysis**: Instant email classification with confidence scores and detailed explanations
- **Multi-threat Detection**: Identifies various types of email threats including AI-generated phishing, human phishing, and legitimate emails

### 📧 Gmail Integration
- **Secure OAuth Authentication**: Seamless and secure integration with Gmail using Google OAuth 2.0
- **Email Import**: Automatically fetch and analyze emails from your Gmail account
- **Token Management**: Automatic token refresh and secure session management

### 📊 CSV Upload Support
- **Batch Processing**: Upload custom email datasets in CSV format for comprehensive analysis
- **Flexible Input**: Support for various email data formats and structures
- **Bulk Analysis**: Process multiple emails simultaneously for efficient threat detection

### 🔍 Detailed Analysis
- **Comprehensive Insights**: Get detailed breakdowns of email classification with probability scores
- **Visual Dashboard**: Modern, responsive interface with intuitive email management
- **Export Capabilities**: Save and export analysis results for further review

## 🏗️ Architecture

This project consists of two main components:

### Backend (Django REST API)
- **Framework**: Django 5.0.7 with Django REST Framework
- **Authentication**: Google OAuth 2.0 with JWT token management
- **Database**: PostgreSQL with psycopg2
- **Email Processing**: Gmail API integration with advanced email parsing
- **Security**: CORS configuration, CSRF protection, and secure token handling

### Frontend (React TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Custom components with modern design
- **Routing**: React Router for seamless navigation
- **State Management**: Local state with localStorage for token persistence
- **Styling**: CSS-in-JS with responsive design

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL**
- **Google Cloud Console Account** (for OAuth credentials)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd selu_research_project
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd GPTEnhancedSpam


# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env file with your configuration
```

#### Environment Variables (.env)

Create a `.env` file in the `be_enhanced_spam_detector` directory:

```env
SECRET_KEY=your_django_secret_key
DB_USER=your_postgres_username
PASSWORD=your_postgres_password
HOST=localhost
PORT=5432
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Database Setup

```bash
# Create PostgreSQL database
createdb GPT-ENHANCEDSPAM

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/redirect`
   - `http://localhost:3000/dashboard`
6. Copy Client ID and Client Secret to your `.env` file

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd fe-enhanced-spam-detector

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your Google Client ID
```

#### Environment Variables (.env)

Create a `.env` file in the `fe-enhanced-spam-detector` directory:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🚀 Running the Application

### 1. Start Backend Server

```bash
cd be_enhanced_spam_detector
source venv/bin/activate  # On Windows: venv\Scripts\activate
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`

### 2. Start Frontend Development Server

```bash
cd fe-enhanced-spam-detector
npm start
```

The frontend will be available at `http://localhost:3000`

## 📖 Usage

### 1. Authentication
- Visit the application homepage
- Click "Sign in with Google" to authenticate using your Google account
- Grant necessary permissions for Gmail access

### 2. Gmail Analysis
- After authentication, navigate to the Gmail tab
- Click "Fetch Gmail Emails" to import your emails
- Select emails for analysis
- Click "Scan Selected Emails" to analyze for threats

### 3. CSV Upload
- Switch to the CSV tab
- Upload a CSV file containing email data
- The system will parse and analyze the uploaded emails
- View detailed classification results

### 4. Results Interpretation
- **AI Phishing**: Emails generated by AI tools for malicious purposes
- **Human Phishing**: Traditional phishing emails created by humans
- **Legitimate**: Safe, legitimate emails

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/google/` - Google OAuth authentication and token management

### Actions
- `action=login` - Initial Google OAuth login
- `action=exchange_gmail_token` - Exchange authorization code for Gmail access
- `action=retrieve_gmail` - Fetch emails from Gmail
- `action=refresh_token` - Refresh expired access tokens

## 🛡️ Security Features

- **OAuth 2.0 Authentication**: Secure Google authentication flow
- **JWT Token Management**: Stateless authentication with automatic token refresh
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **CSRF Protection**: Cross-site request forgery protection
- **Secure Token Storage**: Client-side token management with localStorage

## 🧪 Testing

### Backend Testing
```bash
cd be_enhanced_spam_detector
python manage.py test
```

### Frontend Testing
```bash
cd fe-enhanced-spam-detector
npm test
```

## 📁 Project Structure

```
GPTEnhancedSpam/
├── be_enhanced_spam_detector/          # Django Backend
│   ├── be_enhanced_spam_detector/      # Django project settings
│   │   ├── handle_auth/                    # Authentication app
│   │   │   ├── views.py                   # OAuth and JWT handling
│   │   │   ├── jwt_utils.py               # JWT token utilities
│   │   │   └── urls.py                    # Authentication routes
│   │   ├── handle_gmail/                   # Gmail integration app
│   │   │   ├── utilities.py               # Gmail API utilities
│   │   │   └── views.py                   # Gmail processing views
│   │   ├── requirements.txt               # Python dependencies
│   │   └── manage.py                      # Django management script
│   ├── fe-enhanced-spam-detector/          # React Frontend
│   │   ├── src/
│   │   │   ├── components/                # React components
│   │   │   │   ├── simple_signup.tsx      # Login component
│   │   │   │   ├── RedirectHandler.tsx    # Dashboard component
│   │   │   │   └── Dashboard.css          # Dashboard styles
│   │   │   ├── App.tsx                    # Main app component
│   │   │   └── index.tsx                  # App entry point
│   │   ├── public/                        # Static assets
│   │   │   └── ai-guard-logo-large.svg    # Application logo
│   │   └── package.json                   # Node.js dependencies
│   └── README.md                          # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gmail API for email integration
- Django REST Framework for robust API development
- React and TypeScript for modern frontend development
- PostgreSQL for reliable data storage

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/your-repo/issues) page
2. Create a new issue with detailed description
3. Contact the development team

---

<div align="center">
  <p>Built with ❤️ for secure email communication</p>
  <p><strong>AI Guard</strong> - Protecting your inbox, one email at a time</p>
</div> 