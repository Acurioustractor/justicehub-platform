# 🔐 Security Recommendations for JusticeHub

## 🔥 Immediate Actions Required

1. **Revoke the Exposed API Keys**
   - OpenAI API Key: `sk-proj-[REDACTED]`
   - Anthropic API Key: `sk-ant-api03-[REDACTED]`
   - Firecrawl API Key: `fc-[REDACTED]`

2. **Generate New Keys**
   - Visit each service's dashboard to create new API keys
   - Update your .env.local file with the new keys

## 🛡️ Best Practices

1. **Environment Variables**
   - Always store API keys in environment variables, not in code
   - Add .env.local to .gitignore to prevent accidental commits
   - Use different keys for development and production

2. **Git Hooks**
   - Install pre-commit hooks to scan for secrets
   - Use tools like git-secrets or talisman

3. **Key Rotation**
   - Regularly rotate API keys
   - Monitor API usage for unusual activity

4. **Access Control**
   - Use the principle of least privilege
   - Restrict keys to only necessary permissions

## 📋 .gitignore Update

Ensure your .gitignore includes:
```
# Environment variables
.env.local
.env*.local

# Security
.env*.production
```

## 🔄 Updated .env.local Template

Update your .env.local with placeholder values:
```
# AI Services Configuration
OPENAI_API_KEY=YOUR_NEW_OPENAI_API_KEY
ANTHROPIC_API_KEY=YOUR_NEW_ANTHROPIC_API_KEY
FIRECRAWL_API_KEY=YOUR_NEW_FIRECRAWL_API_KEY

# Other configurations...
```

## 🛠️ Automated Secret Scanning

Consider adding to your development workflow:
```
# Install git-secrets
brew install git-secrets

# Install hooks in repository
git secrets --install

# Add patterns to scan for
git secrets --add 'sk-[a-zA-Z0-9]{48}'
git secrets --add 'sk-ant-api03-[a-zA-Z0-9\-_]{80}'
git secrets --add 'fc-[a-f0-9]{32}'
```