# Render.com Proxy Configuration Fix

## Issue
When deploying to Render.com, you may encounter this validation error:

```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default). This could indicate a misconfiguration which would prevent express-rate-limit from accurately identifying users.
```

## Root Cause
Render.com uses a reverse proxy that sets the `X-Forwarded-For` header to identify the original client IP address. However, Express.js doesn't trust proxy headers by default for security reasons. When using `express-rate-limit`, this causes a validation error because the rate limiter can't accurately identify unique users.

## Solution
Add the following line to your Express server configuration:

```javascript
// Trust proxy for Render.com (fixes X-Forwarded-For header validation)
app.set('trust proxy', 1);
```

### What This Does
- Tells Express to trust the first proxy in the chain (Render.com's proxy)
- Allows `express-rate-limit` to correctly identify unique users by their real IP
- Enables proper rate limiting functionality in production

### Security Considerations
- Setting `trust proxy` to `1` is safe for Render.com deployment
- This tells Express to trust only the first proxy (Render.com's infrastructure)
- The setting ensures rate limiting works correctly without compromising security

## Files Updated
- `server-render.js` - Primary Render.com server file
- `server.js` - Backup Render.com server file

## Verification
After applying this fix, your server should start without validation errors and rate limiting will work correctly for production traffic.

## References
- [Express.js Trust Proxy Documentation](https://expressjs.com/en/guide/behind-proxies.html)
- [express-rate-limit Proxy Issues](https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR/)
- [Render.com Proxy Configuration](https://render.com/docs/web-services#request-headers)