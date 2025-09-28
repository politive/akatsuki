<p align="center">
  <img src="./logo.png" width="600" alt="Logo" />
</p>

<p align="center">
  A Social Login mock server for development and testing.
</p>

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# compose.yml

version: '3.8'
services:
  oauth-mock:
    image: ghcr.io/politive/akatsuki:latest
    ports:
      - "3001:3001"  # Google OAuth
      - "3002:3002"  # LINE OAuth
    environment:
      - ENABLE=google,line
      - GOOGLE_PORT=3001
      - LINE_PORT=3002
      - HOST=0.0.0.0
    volumes:
      - ./google.json:/app/google.json  # Optional: Override Google user data
      - ./line.json:/app/line.json      # Optional: Override LINE user data
EOF

# Start the server
docker compose up -d
```

### Option 2: Development Setup

```bash
# Clone Repository
git clone git@github.com:politive/akatsuki.git
cd akatsuki

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

**Servers will start on:**
- Google OAuth: `http://localhost:3001`
- LINE OAuth: `http://localhost:3002`

## ⚙️ Configuration

### Custom User Data

**Optional**: Place JSON files in the project root to override default mock user data. If files don't exist, default mock data will be used.

**google.json** (overrides default Google user)
```json
{
  "sub": "your-google-user-id",
  "email": "your-email@example.com",
  "email_verified": true,
  "name": "Your Name",
  "given_name": "Your",
  "family_name": "Name",
  "picture": "https://example.com/your-photo.jpg",
  "locale": "ja"
}
```

**line.json** (overrides default LINE user)
```json
{
  "userId": "your-line-user-id",
  "displayName": "Your Display Name",
  "pictureUrl": "https://example.com/your-photo.jpg",
  "statusMessage": "Your status message"
}
```

### Environment Variables

| Variable      | Description                                 | Default | Example       |
| ------------- | ------------------------------------------- | ------- | ------------- |
| `ENABLE`      | Comma-separated list of providers to enable | -       | `google,line` |
| `GOOGLE_PORT` | Port for Google OAuth server                | `3001`  | `3001`        |
| `LINE_PORT`   | Port for LINE OAuth server                  | `3002`  | `3002`        |

### Provider Enablement

Use the `ENABLE` environment variable to specify which providers to enable:

```bash
# Enable specific providers
ENABLE=google,line

# Enable Google only
ENABLE=google

# Enable LINE only
ENABLE=line
```

## 📋 Supported Providers

### Currently Supported
- ✅ **Google OAuth 2.0**
- ✅ **LINE OAuth 2.0**

### Future Support
Please let us know which providers you'd like to see supported by creating an [issue](https://github.com/politive/akatsuki/issues).

## 🔗 API Endpoints

### Google OAuth (Port 3001)

| Endpoint              | Method | Description            |
| --------------------- | ------ | ---------------------- |
| `/o/oauth2/v2/auth`   | GET    | Authorization endpoint |
| `/token`              | POST   | Token exchange         |
| `/oauth2/v2/userinfo` | GET    | User info              |
| `/health`             | GET    | Health check           |

### LINE OAuth (Port 3002)

| Endpoint                 | Method | Description            |
| ------------------------ | ------ | ---------------------- |
| `/oauth2/v2.1/authorize` | GET    | Authorization endpoint |
| `/oauth2/v2.1/token`     | POST   | Token exchange         |
| `/oauth2/v2.1/userinfo`  | GET    | User info              |
| `/health`                | GET    | Health check           |

## 💡 Usage Examples

### cURL Testing

```bash
# Get authorization code
curl "http://localhost:3001/o/oauth2/v2/auth?client_id=test&redirect_uri=http://localhost:3002/callback&response_type=code&scope=openid%20email%20profile&state=xyz"

# Exchange for token
curl -X POST http://localhost:3001/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=mock_auth_code_xxx&client_id=test&client_secret=test&redirect_uri=http://localhost:3002/callback"
```

## 📁 Project Structure

```
src/
├── app.ts              # Main application file
├── config/
│   └── config.ts       # Configuration
├── google/
│   └── app.ts          # Google OAuth server
├── line/
│   └── app.ts          # LINE OAuth server
├── lib/
│   ├── types.ts        # TypeScript type definitions
│   └── utils.ts        # Utility functions
└── __tests__/          # Test files
```

## 🛠️ Available Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot reload |
| `npm test`           | Run all tests                            |
| `npm run test:watch` | Run tests in watch mode                  |
| `npm run build`      | Build for production                     |
| `npm start`          | Start production server                  |

## ⚠️ Security Notice

**This server is for development and testing purposes only.**  
Do not use in production environments. Security features are minimal and this server is not a complete implementation of OAuth 2.0 specifications.

## 📄 License

AKATSUKI is released under the MIT License.  
See the [LICENSE](./LICENSE) file for full details.
