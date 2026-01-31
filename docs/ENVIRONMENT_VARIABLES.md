# 🔧 Environment Variables Configuration

This document provides comprehensive information about environment variables required for the Classroom Learning Platform, particularly for production deployment on Vercel with Redis storage.

## 📋 Overview

The application uses environment variables to configure different storage backends and authentication settings based on the deployment environment:

- **Development**: Uses filesystem storage with local JSON files
- **Production**: Uses Redis storage via Upstash Redis for Vercel compatibility

## 🚀 Quick Setup

### Development Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update the JWT secret in `.env.local`:
   ```bash
   JWT_SECRET=your-secure-development-secret-here
   ```

### Production Setup (Vercel)
1. Set up Upstash Redis account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Configure environment variables in Vercel dashboard
4. Deploy your application

## 📝 Environment Variables Reference

### Required Variables

#### `JWT_SECRET`
- **Purpose**: Secret key for JWT token signing and verification
- **Required**: Yes (all environments)
- **Example**: `JWT_SECRET=super-secret-change-me-production-key-xyz789`
- **Security**: Must be a strong, random string (minimum 32 characters recommended)
- **Notes**: 
  - Use different secrets for development and production
  - Never commit production secrets to version control
  - Generate using: `openssl rand -base64 32`

### Production-Only Variables

#### `UPSTASH_REDIS_REST_URL`
- **Purpose**: Upstash Redis REST API endpoint URL
- **Required**: Yes (production only)
- **Example**: `UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io`
- **Source**: Upstash Redis dashboard → REST API section
- **Notes**: 
  - Only required when `NODE_ENV=production`
  - Must be the full HTTPS URL including protocol
  - Available in Upstash dashboard after creating Redis database

#### `UPSTASH_REDIS_REST_TOKEN`
- **Purpose**: Authentication token for Upstash Redis REST API
- **Required**: Yes (production only)
- **Example**: `UPSTASH_REDIS_REST_TOKEN=AXXXaGVsbG8gZnJvbSB1cHN0YXNoIQ`
- **Source**: Upstash Redis dashboard → REST API section
- **Security**: Keep this token secure and never expose in client-side code
- **Notes**: 
  - Only required when `NODE_ENV=production`
  - Token provides full access to your Redis database
  - Regenerate if compromised

### System Variables

#### `NODE_ENV`
- **Purpose**: Determines the application environment and storage backend
- **Required**: Automatically set by deployment platforms
- **Values**: 
  - `development` - Uses filesystem storage
  - `production` - Uses Redis storage
- **Notes**: 
  - Automatically set by Vercel to `production`
  - Manually set to `development` in local environment
  - Controls storage adapter selection in `lib/storage/adapter.js`

## 🏗️ Environment-Specific Configuration

### Development Environment
```bash
# .env.local (for local development)
JWT_SECRET=your-secure-development-secret-here

# Redis variables are NOT needed for development
# The app automatically uses filesystem storage
```

**Storage Behavior**: 
- Uses `FilesystemStorageAdapter`
- Stores data in local JSON files (`data/` directory)
- No external dependencies required
- Identical behavior to original application

### Production Environment (Vercel)
```bash
# Environment variables in Vercel dashboard
NODE_ENV=production
JWT_SECRET=your-secure-production-secret-here
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token-here
```

**Storage Behavior**:
- Uses `RedisStorageAdapter`
- Stores data in Upstash Redis
- Automatic JSON serialization/deserialization
- Retry logic with exponential backoff
- Graceful error handling

## 🔐 Security Best Practices

### JWT Secret Security
- **Length**: Minimum 32 characters, preferably 64+
- **Randomness**: Use cryptographically secure random generation
- **Rotation**: Rotate secrets periodically in production
- **Storage**: Never commit secrets to version control
- **Environment Separation**: Use different secrets for dev/staging/production

### Redis Token Security
- **Access Control**: Upstash tokens provide full database access
- **Network Security**: Always use HTTPS endpoints
- **Token Rotation**: Regenerate tokens if compromised
- **Monitoring**: Monitor Redis access logs for suspicious activity
- **Backup**: Keep secure backup of configuration for disaster recovery

## 🚀 Deployment Instructions

### Vercel Deployment

1. **Set up Upstash Redis**:
   ```bash
   # Visit https://upstash.com
   # Create account and new Redis database
   # Note down REST URL and token
   ```

2. **Configure Vercel Environment Variables**:
   ```bash
   # In Vercel dashboard → Project → Settings → Environment Variables
   JWT_SECRET=your-production-secret
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

3. **Deploy**:
   ```bash
   # Deploy via Vercel CLI or GitHub integration
   vercel --prod
   ```

### Alternative Deployment Platforms

For other platforms (Netlify, Railway, etc.), ensure:
- Set `NODE_ENV=production`
- Configure all required environment variables
- Use compatible Redis service (Upstash recommended)

## 🧪 Testing Configuration

### Local Testing with Redis
To test Redis functionality locally:

```bash
# .env.local (temporary for testing)
NODE_ENV=production
JWT_SECRET=test-secret
UPSTASH_REDIS_REST_URL=https://your-test-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-test-token
```

**Warning**: Only use test/development Redis instances for local testing.

### Environment Variable Validation
The application validates required environment variables on startup:

```javascript
// Automatic validation in RedisStorageAdapter
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Redis configuration missing');
}
```

## 🔍 Troubleshooting

### Common Issues

#### "Redis configuration missing" Error
**Cause**: Missing `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` in production
**Solution**: 
1. Verify environment variables are set in deployment platform
2. Check variable names match exactly (case-sensitive)
3. Ensure values don't have extra spaces or quotes

#### "Redis connection failed" Error
**Cause**: Invalid Redis URL or network connectivity issues
**Solution**:
1. Verify URL format: `https://your-instance.upstash.io`
2. Test URL accessibility from deployment environment
3. Check Upstash Redis dashboard for service status

#### "Redis authentication failed" Error
**Cause**: Invalid or expired Redis token
**Solution**:
1. Regenerate token in Upstash dashboard
2. Update environment variable with new token
3. Redeploy application

#### JWT Token Issues
**Cause**: Missing or invalid JWT secret
**Solution**:
1. Ensure `JWT_SECRET` is set in all environments
2. Use sufficiently long, random secret
3. Verify secret consistency across application restarts

### Debug Mode
Enable detailed logging by checking application logs:

```bash
# Vercel logs
vercel logs

# Local development
npm run dev
# Check console output for Redis connection status
```

## 📊 Monitoring and Maintenance

### Redis Monitoring
- **Upstash Dashboard**: Monitor connection count, memory usage, command statistics
- **Application Logs**: Check for Redis connection errors and retry attempts
- **Performance**: Monitor response times for storage operations

### Environment Variable Auditing
- **Regular Review**: Audit environment variables quarterly
- **Secret Rotation**: Rotate JWT secrets and Redis tokens periodically
- **Access Control**: Limit who can view/modify production environment variables
- **Documentation**: Keep this documentation updated with configuration changes

## 🔗 Related Documentation

- **[Storage Architecture](../lib/storage/README.md)** - Technical details of storage adapters
- **[Deployment Guide](../README.md)** - General deployment instructions
- **[Admin Testing Guide](../ADMIN_TESTING_GUIDE.md)** - Testing tools and procedures

## 📞 Support

For environment configuration issues:
1. Check this documentation first
2. Verify environment variables in deployment platform
3. Test with minimal configuration
4. Check application logs for specific error messages
5. Consult Upstash documentation for Redis-specific issues

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Compatibility**: Next.js 13.5.6, Vercel, Upstash Redis