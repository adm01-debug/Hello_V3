# Troubleshooting Playbook

## Common Issues

### Application Won't Start
1. Check node version: `node --version`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check environment variables in `.env`
4. Check port availability: `lsof -i :3000`

### Database Connection Errors
1. Verify Supabase URL and key
2. Check network connectivity
3. Verify database is running
4. Check firewall rules

### Build Failures
1. Clear build cache: `rm -rf dist`
2. Update dependencies: `npm update`
3. Check TypeScript errors: `npm run type-check`
4. Check for conflicting packages

### Slow Performance
1. Check bundle size: `npm run analyze`
2. Review network requests in DevTools
3. Check for memory leaks
4. Review database query performance

### Authentication Issues
1. Verify JWT token validity
2. Check session expiration
3. Clear browser cache/cookies
4. Verify API key configuration
