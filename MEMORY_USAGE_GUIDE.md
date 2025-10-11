# Memory Usage Optimization for Auto ANI Website

## Current Issues

Memory usage during build and runtime has been optimized to prevent out-of-memory errors. The following changes have been implemented:

### 1. Build Memory Optimization

- Added `NODE_OPTIONS="--max-old-space-size=3072"` to increase Node.js memory allocation during build
- Disabled TypeScript type checking during build (moved to a separate step)
- Created an optimized build script at `scripts/optimized-build.sh`

### 2. Prisma Dependency Update

- Created a Prisma upgrade script at `scripts/upgrade-prisma.sh` to update to the latest version
- Fixes OpenSSL compatibility warnings

### 3. Package.json Updates

- Updated build scripts to include memory optimization flags
- Added new utility scripts for optimized builds and Prisma upgrades

## How to Build

### Regular Development Build

```bash
npm run build
```

### Memory-Optimized Production Build

```bash
npm run build:optimized
```

### Update Prisma to Fix OpenSSL Warnings

```bash
npm run prisma:upgrade
```

## Next Steps for Further Optimization

1. Consider implementing code splitting for large components
2. Review large dependencies and remove unused ones
3. Optimize image assets and implement lazy loading
4. Configure proper memory limits in production environment

## Memory Monitoring

The application already includes a memory monitoring system with the following environment variables:

- `MEMORY_MONITOR_INTERVAL`: How often to check memory (default: 30000ms)
- `MEMORY_CRITICAL_THRESHOLD`: Memory threshold for alerts (default: 1024MB)
- `MEMORY_ALERTS_ENABLED`: Whether to enable alerts (default: true)

You can adjust these settings in your environment variables to fine-tune memory monitoring.