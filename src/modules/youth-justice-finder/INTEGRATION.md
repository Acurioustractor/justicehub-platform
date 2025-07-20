# 🔗 Integration Guide

**Easily integrate the Youth Justice Service Finder API into your website or application.**

## 🚀 Quick Integration

### Option 1: Simple Widget Integration
```html
<!-- Add this iframe to embed the service finder -->
<iframe 
  src="https://your-deployed-instance.railway.app" 
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### Option 2: API Integration
```javascript
// Basic search example
const searchServices = async (query) => {
  const response = await fetch(`https://your-api.railway.app/diagnostic-search?q=${query}`);
  const data = await response.json();
  return data.result.services;
};

// Usage
const services = await searchServices('legal aid');
console.log(services);
```

## 📚 API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `/diagnostic-search` | Main search endpoint | `?q=legal&limit=10` |
| `/services` | List all services | `?category=legal_aid` |
| `/services/{id}` | Get specific service | `/services/123` |
| `/stats` | Get system statistics | Basic stats |
| `/health` | Health check | System status |

## 🛠️ Setup Your Own Instance

### 1. Fork & Deploy
```bash
# Fork this repository on GitHub
git clone https://github.com/yourusername/Youth-Justice-Service-Finder
cd Youth-Justice-Service-Finder
npm install
```

### 2. Environment Setup
```bash
# Set required environment variables
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-secret
```

### 3. Deploy Options

**Railway (Recommended)**
- Connect GitHub repository
- Set environment variables
- Auto-deploys on push

**Vercel**
- Deploy frontend only
- Use external database
- Connect to Railway backend

**Self-hosted**
```bash
npm run build
npm start
```

## 📊 Response Format

### Search Response
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Brisbane Youth Legal Service",
      "description": "Free legal advice...",
      "categories": ["legal_aid", "youth_development"],
      "youth_specific": true,
      "location": { "city": "Brisbane", "state": "QLD" },
      "contact": { "phone": "07 3356 1002" }
    }
  ],
  "pagination": {
    "total": 603,
    "limit": 20,
    "offset": 0,
    "pages": 31
  }
}
```

## 🎨 Styling & Customization

### CSS Variables
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #f3f4f6;
  --text-color: #374151;
}
```

### Custom Components
```javascript
// React component example
import { useEffect, useState } from 'react';

function ServiceFinder({ location, category }) {
  const [services, setServices] = useState([]);
  
  useEffect(() => {
    fetch(`/diagnostic-search?q=${category}&region=${location}`)
      .then(res => res.json())
      .then(data => setServices(data.result.services));
  }, [location, category]);
  
  return (
    <div className="service-finder">
      {services.map(service => (
        <div key={service.id} className="service-card">
          <h3>{service.name}</h3>
          <p>{service.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔒 Security & Rate Limits

- **Rate Limit**: 50 requests/minute
- **CORS**: Configured for cross-origin requests
- **HTTPS**: SSL required for production
- **API Keys**: Not required for basic usage

## 📞 Support

- **Documentation**: `/docs`
- **API Docs**: `/docs` (Swagger UI)
- **Health Check**: `/health`
- **GitHub Issues**: [Report issues](https://github.com/yourusername/Youth-Justice-Service-Finder/issues)

## 📄 License

MIT License - Free for commercial and non-commercial use.

---

*This service finder contains 603+ youth justice services across Australia and is actively maintained.*