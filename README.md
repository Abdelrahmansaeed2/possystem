# Café POS Pro - Advanced Point of Sale System

A comprehensive, modern Point of Sale (POS) system built with Next.js, TypeScript, and Tailwind CSS. Features offline functionality, real-time updates, customer management, inventory tracking, and advanced analytics.

## 🚀 Features

### Core POS Functionality
- **Intuitive Order Management** - Easy-to-use interface for taking orders
- **Multiple Payment Methods** - Cash, card, digital payments, and loyalty points
- **Order Customization** - Detailed drink customizations and special instructions
- **Receipt Generation** - Digital and printable receipts

### Advanced Features
- **Offline Mode** - Continue operations without internet connection
- **Real-time Sync** - Automatic synchronization when connection is restored
- **Voice Orders** - AI-powered voice recognition for hands-free ordering
- **QR Code Ordering** - Customer self-service mobile ordering
- **Loyalty Program** - Points-based rewards system with tier management

### Management & Analytics
- **Customer Management** - Detailed customer profiles and preferences
- **Inventory Tracking** - Real-time stock levels and low-stock alerts
- **Sales Analytics** - Comprehensive reporting and insights
- **Multi-user Support** - Role-based access control (Admin, Manager, Cashier, Barista)

### Technical Features
- **Progressive Web App (PWA)** - Install on any device
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode Support** - User preference-based theming
- **WebSocket Integration** - Real-time updates across devices
- **Database Integration** - Persistent data storage

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend & Database
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **WebSocket** - Real-time communication
- **SQLite/PostgreSQL** - Database options
- **Redis** - Caching and session management

### Development & Deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Vercel** - Frontend deployment
- **Railway** - Backend deployment

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**

2. **Install dependencies**
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. **Set up environment variables**
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` with your configuration:
\`\`\`env
# Database
DATABASE_URL="your_database_url"

# Authentication
NEXTAUTH_SECRET="your_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# Payment Processing (Optional)
STRIPE_SECRET_KEY="your_stripe_secret"
STRIPE_PUBLISHABLE_KEY="your_stripe_public"

# WebSocket (Optional)
WEBSOCKET_URL="ws://localhost:8080"

# Redis (Optional)
REDIS_URL="your_redis_url"
\`\`\`

4. **Run the development server**
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Accounts
- **Admin**: admin@cafe.com / admin123
- **Cashier**: cashier@cafe.com / cashier123

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone and navigate to project**
\`\`\`bash
git clone https://github.com/yourusername/cafe-pos-pro.git
cd cafe-pos-pro
\`\`\`

2. **Start with Docker Compose**
\`\`\`bash
docker-compose up -d
\`\`\`

This will start:
- Frontend (Next.js) on port 3000
- Backend (Node.js) on port 8080
- Database (PostgreSQL) on port 5432
- Redis on port 6379

### Manual Docker Build

\`\`\`bash
# Build the image
docker build -t cafe-pos-pro .

# Run the container
docker run -p 3000:3000 cafe-pos-pro
\`\`\`

## ☁️ Cloud Deployment

### Vercel (Frontend)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cafe-pos-pro)

### Railway (Backend)

1. **Connect your GitHub repository to Railway**
2. **Set environment variables**
3. **Deploy the backend service**

### Environment Variables for Production

\`\`\`env
# Production Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your_production_secret"
NEXTAUTH_URL="https://your-domain.com"

# Payment Processing
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# WebSocket
WEBSOCKET_URL="wss://your-backend-domain.com"

# Redis
REDIS_URL="redis://your-redis-url"
\`\`\`

## 🏗️ Project Structure

\`\`\`
cafe-pos-pro/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   └── page.tsx           # Main POS interface
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── backend/              # Backend server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Express middleware
├── mobile-app/           # React Native app (optional)
├── admin-portal/         # Admin web portal
├── docker-compose.yml    # Docker configuration
└── README.md
\`\`\`

## 🔧 Configuration

### Database Setup

#### SQLite (Development)
\`\`\`bash
# No additional setup required
# Database file will be created automatically
\`\`\`

#### PostgreSQL (Production)
\`\`\`bash
# Create database
createdb cafe_pos_pro

# Run migrations (if using Prisma)
npx prisma migrate deploy
\`\`\`

### WebSocket Configuration

The system uses WebSocket for real-time updates. Configure the WebSocket server:

\`\`\`javascript
// backend/src/services/WebSocketService.ts
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
\`\`\`

### Payment Integration

#### Stripe Setup
1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Add keys to environment variables
4. Configure webhook endpoints

## 📱 Mobile App (Optional)

The project includes a React Native mobile app for customers:

\`\`\`bash
cd mobile-app
npm install
npx expo start
\`\`\`

## 🔐 Security Features

- **JWT Authentication** - Secure user sessions
- **Role-based Access Control** - Different permissions for different roles
- **Input Validation** - Prevent SQL injection and XSS
- **HTTPS Enforcement** - Secure data transmission
- **Rate Limiting** - Prevent abuse

## 🧪 Testing

\`\`\`bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
\`\`\`

## 📊 Monitoring & Analytics

### Built-in Analytics
- Sales reports
- Customer analytics
- Inventory tracking
- Performance metrics

### External Integrations
- Google Analytics
- Mixpanel
- Sentry (Error tracking)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



### Demo Accounts
For testing purposes, use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cafe.com | admin123 |
| Manager | manager@cafe.com | manager123 |
| Cashier | cashier@cafe.com | cashier123 |
| Barista | barista@cafe.com | barista123 |


## 🏆 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Lucide](https://lucide.dev/) - Beautiful icons


\`\`\`


# possystem
# possystem
