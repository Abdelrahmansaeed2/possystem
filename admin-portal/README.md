# 🖥️ Café POS Admin Portal

A comprehensive React-based admin dashboard for managing café operations, analytics, and system administration.

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context API + useReducer
- **HTTP Client**: Fetch API with custom hooks
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Deployment**: Static hosting (Netlify, Vercel, S3)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Navigate to admin portal directory**
   \`\`\`bash
   cd admin-portal
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Configuration**
   Create `.env` file:
   \`\`\`env
   VITE_API_URL=http://localhost:3001
   VITE_API_KEY=your-secure-api-key
   VITE_APP_NAME=Café POS Admin
   VITE_ENVIRONMENT=development
   \`\`\`

4. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Build for production**
   \`\`\`bash
   npm run build
   \`\`\`

6. **Preview production build**
   \`\`\`bash
   npm run preview
   \`\`\`

## 🔄 Offline Logic Approach

### Strategy Overview
The admin portal implements a **"Cache-First"** approach with intelligent fallbacks:

#### **1. Data Caching Strategy**
\`\`\`typescript
// Service Worker for offline caching
const CACHE_NAME = 'cafe-pos-admin-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/api/analytics/summary' // Cache critical data
]

// Cache API responses with TTL
const cacheWithTTL = (key: string, data: any, ttl: number) => {
  const item = {
    data,
    timestamp: Date.now(),
    ttl
  }
  localStorage.setItem(key, JSON.stringify(item))
}
\`\`\`

#### **2. Progressive Web App Features**
- **Service Worker**: Cache static assets and API responses
- **Background Sync**: Queue actions when offline
- **Push Notifications**: Alert admins of critical events
- **App Shell**: Core UI loads instantly from cache

#### **3. Graceful Degradation**
\`\`\`typescript
// Fallback to cached data when offline
const useApiData = (endpoint: string) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint)
        const result = await response.json()
        setData(result)
        // Cache successful response
        cacheWithTTL(endpoint, result, 5 * 60 * 1000) // 5 minutes
      } catch (err) {
        // Fallback to cached data
        const cached = getCachedData(endpoint)
        if (cached) {
          setData(cached)
          setError('Using cached data (offline)')
        } else {
          setError('No data available offline')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpoint])

  return { data, loading, error }
}
\`\`\`

## 🌐 Real-World Deployment & Scaling

### Deployment Architecture

#### **1. Static Site Hosting**
\`\`\`yaml
# Netlify deployment configuration
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
\`\`\`

#### **2. CDN Distribution**
\`\`\`
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Global CDN    │    │   Edge Locations │    │   Origin Server │
│   (CloudFlare)  │────│   (Worldwide)    │────│   (Vercel/S3)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
\`\`\`

#### **3. Performance Optimization**
\`\`\`typescript
// Code splitting for optimal loading
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Orders = lazy(() => import('./pages/Orders'))

// Preload critical routes
const preloadRoute = (routeComponent: () => Promise<any>) => {
  const componentImport = routeComponent()
  return componentImport
}

// Preload on user interaction
const handleMouseEnter = () => {
  preloadRoute(() => import('./pages/Analytics'))
}
\`\`\`

### Scaling Strategy

#### **1. Multi-tenant Architecture**
\`\`\`typescript
// Support multiple café locations
interface TenantConfig {
  id: string
  name: string
  apiEndpoint: string
  theme: ThemeConfig
  features: FeatureFlags
}

const useTenant = () => {
  const tenantId = useParams().tenantId
  const [tenant, setTenant] = useState<TenantConfig | null>(null)

  useEffect(() => {
    // Load tenant configuration
    loadTenantConfig(tenantId).then(setTenant)
  }, [tenantId])

  return tenant
}
\`\`\`

#### **2. Feature Flags System**
\`\`\`typescript
// Dynamic feature enabling/disabling
const useFeatureFlag = (flag: string) => {
  const tenant = useTenant()
  return tenant?.features[flag] ?? false
}

// Conditional rendering based on features
const AdvancedAnalytics = () => {
  const hasAdvancedAnalytics = useFeatureFlag('advancedAnalytics')
  
  if (!hasAdvancedAnalytics) {
    return <BasicAnalytics />
  }
  
  return <AdvancedAnalyticsComponent />
}
\`\`\`

#### **3. Real-time Updates**
\`\`\`typescript
// WebSocket connection for live data
const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setData(message)
    }

    ws.onclose = () => {
      // Reconnect with exponential backoff
      setTimeout(() => {
        setSocket(new WebSocket(url))
      }, Math.min(1000 * Math.pow(2, retryCount), 30000))
    }

    setSocket(ws)
    return () => ws.close()
  }, [url])

  return data
}
\`\`\`

### Security Considerations

#### **1. Authentication Flow**
\`\`\`typescript
// Secure token management
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('adminToken')
    if (token) {
      validateToken(token)
        .then(setUser)
        .catch(() => localStorage.removeItem('adminToken'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (response.ok) {
      const { user, token } = await response.json()
      localStorage.setItem('adminToken', token)
      setUser(user)
      return user
    }

    throw new Error('Invalid credentials')
  }

  return (
    <AuthContext.Provider value={{ user, login, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
\`\`\`

#### **2. Role-based Access Control**
\`\`\`typescript
// Component-level permission checking
const ProtectedComponent = ({ 
  children, 
  requiredPermission 
}: { 
  children: ReactNode
  requiredPermission: string 
}) => {
  const { user } = useAuth()
  
  if (!user?.permissions.includes(requiredPermission)) {
    return <AccessDenied />
  }
  
  return <>{children}</>
}

// Usage
<ProtectedComponent requiredPermission="analytics.view">
  <AdvancedAnalytics />
</ProtectedComponent>
\`\`\`

### Monitoring & Analytics

#### **1. Error Tracking**
\`\`\`typescript
// Comprehensive error boundary
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service
    errorTracker.captureException(error, {
      extra: errorInfo,
      user: this.context.user,
      timestamp: new Date().toISOString()
    })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
\`\`\`

#### **2. Performance Monitoring**
\`\`\`typescript
// Track user interactions and performance
const useAnalytics = () => {
  const trackEvent = (event: string, properties?: object) => {
    analytics.track(event, {
      ...properties,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent
    })
  }

  const trackPageView = (page: string) => {
    analytics.page(page, {
      timestamp: Date.now(),
      referrer: document.referrer
    })
  }

  return { trackEvent, trackPageView }
}
\`\`\`

This admin portal architecture provides a scalable, secure, and performant solution for managing café operations across multiple locations while maintaining excellent user experience both online and offline.
\`\`\`
