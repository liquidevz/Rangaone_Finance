# Rangaone Finance

A modern, high-performance financial platform built with Next.js 14, React 19, and TypeScript.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14, React 19, TypeScript
- **Optimized Performance**: Turbopack for dev, optimized Webpack for production
- **Docker Support**: Multi-stage builds with standalone output
- **Financial Tools**: Investment calculator, portfolio management, recommendations
- **Responsive Design**: Tailwind CSS with custom components
- **Production Ready**: Optimized for deployment with Docker

## 📋 Prerequisites

- Node.js 20.x or later
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## 🛠️ Installation

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd Rangaone_Finance-main

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f rangaone-fe

# Stop containers
docker-compose down
```

## 📦 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run analyze` - Analyze bundle size
- `npm run build:docker` - Build with custom build script (for Docker)
- `npm run verify` - Verify build output

## 🏗️ Project Structure

```
Rangaone_Finance-main/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication
│   └── ...
├── components/            # React components
├── lib/                   # Utility functions
├── services/              # API services
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── public/                # Static assets
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Production Docker image
└── next.config.mjs        # Next.js configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=your_api_url

# Add your environment variables here
```

### Next.js Configuration

The `next.config.mjs` is optimized for production with:
- Standalone output for Docker
- Turbopack for development
- Optimized Webpack for production builds
- Code splitting and bundle optimization

## 🐳 Docker

The application uses multi-stage Docker builds for optimal image size and performance:

- **Base Stage**: Node.js 20 Alpine with dependencies
- **Builder Stage**: Builds the application
- **Runner Stage**: Minimal runtime environment

### Docker Compose Features

- Health checks
- Resource limits (2 CPU, 3GB RAM)
- Log rotation
- Automatic restarts
- Tmpfs mounts for cache optimization

## 📊 Performance

- **Dev Build**: ~2-3 seconds with Turbopack
- **Production Build**: Optimized with code splitting
- **Docker Image**: ~200MB (standalone output)
- **Memory Usage**: ~2GB typical, 3GB limit

## 🔒 Security

- Non-root user in Docker container
- Read-only filesystem where possible
- No new privileges in container
- Environment-based configuration
- Secure headers configuration

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Production

```bash
# Build and deploy
docker-compose up --build -d

# Check health
curl http://localhost:3000/api/health
```

## 📝 License

Private - All rights reserved

## 🤝 Contributing

This is a private repository. Contact the maintainers for contribution guidelines.

## 📧 Support

For support, contact your development team.

---

**Built with ❤️ by Rangaone Finance Team**
