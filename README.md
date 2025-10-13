# 🚗 AUTO ANI - Car Dealership Website

**Professional car dealership website for AUTO ANI in Mitrovicë, Kosovo**

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green.svg)]()
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black.svg)]()
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)]()
[![Render Deploy](https://img.shields.io/badge/Deploy-Render-purple.svg)]()

---

## 📊 Memory Usage Analysis

### Development Environment
- **Main Next.js Process**: 152MB RAM
- **Next.js Server**: 331MB RAM
- **Total Development**: **~483MB RAM**

### Production Environment
- **Estimated Production Usage**: **~200-300MB RAM**
- **Render Starter Plan**: 512MB RAM (sufficient)
- **Recommended**: Render Standard (2GB RAM) for high traffic

---

## 🏢 Business Information

### AUTO ANI Car Dealership
- **Location**: Gazmend Baliu, Mitrovicë, Kosovo 40000
- **Phone**: +383 49 204 242
- **Email**: aniautosallon@gmail.com
- **Website**: https://aniautosallon.com
- **Facebook**: https://www.facebook.com/autosallonani
- **Established**: 2015
- **Experience**: 9+ years in automotive sales

### Services
- ✅ New & Used Vehicle Sales
- ✅ Car Financing (0% on selected models)
- ✅ Vehicle Import Services
- ✅ Insurance Assistance
- ✅ Trade-in Program (€1,000 bonus)
- ✅ Post-sale Service & Support

Modern car dealership website built with Next.js 15, TypeScript, and Prisma ORM.

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Generate Prisma client
npm run db:generate:dev

# Seed database
npm run db:seed

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Build for Production

```bash
# Production build
npm run build:production

# Start production server
npm start
```

## 🌐 Deployment

This project is configured for Netlify deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Netlify

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables
4. Deploy

For complete deployment guide, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Step-by-step deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist

## 🛠 Tech Stack

- **Frontend**: Next.js 15.5.3, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Prisma ORM (SQLite dev, PostgreSQL prod)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Email**: Resend
- **SMS**: Twilio
- **Analytics**: Google Analytics, Facebook Pixel

## 📁 Project Structure

```
auto-ani-website/
├── app/              # Next.js app directory
├── components/       # React components
├── contexts/         # React contexts
├── lib/             # Utilities and libraries
├── prisma/          # Database schema and migrations
├── public/          # Static assets
├── docs/            # Essential documentation
├── archive/         # Archived documentation
├── mobile-app/      # React Native app (separate project)
├── netlify.toml     # Netlify configuration
└── package.json     # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
npm run dev                # Start development server
npm run build             # Build for production
npm run build:production  # Build with Prisma generation
npm run db:generate       # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with data
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
```

## 🔐 Environment Variables

See `.env.production` for required environment variables.

Critical variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service API key

## 📊 Features

- ✅ Multi-language support (Albanian, Serbian, English)
- ✅ Vehicle inventory management
- ✅ Admin dashboard
- ✅ Contact forms with email notifications
- ✅ WhatsApp integration
- ✅ SEO optimized
- ✅ Mobile responsive
- ✅ Performance optimized

## 🚀 Deployment Status

**Status**: READY FOR DEPLOYMENT ✅

All critical issues have been resolved:
- Fixed LanguageContext hook error
- Configured for Netlify deployment
- Database schema ready for PostgreSQL
- Environment templates created
- Documentation complete

## 📝 Documentation

- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) - Database setup
- [docs/STATUS.md](./docs/STATUS.md) - Current project status
- [archive/](./archive/) - Historical documentation

## 📞 Support

- **Email**: admin@autosalonani.com
- **WhatsApp**: +38349204242
- **Website**: https://autosalonani.com

---

**Version**: 1.0.0 | **Last Updated**: September 2025