# 🔒 SECURITY NOTICE

## URGENT: Exposed API Token

**Date:** October 13, 2025  
**Status:** REQUIRES IMMEDIATE ACTION

### Issue
The Sanity API token in `.env.local` was committed to the repository and is now exposed in git history.

### Required Actions

1. **Revoke the exposed token immediately:**
   - Go to https://sanity.io/manage
   - Navigate to your project: `j2t31xge`
   - Go to API → Tokens
   - Find and revoke the token starting with: `skJ1mO2eocTQ9R2894PM...`

2. **Generate a new token:**
   - Create a new token with appropriate permissions
   - Save it securely in your password manager

3. **Update environment variables:**
   - Update `.env.local` locally (DO NOT COMMIT)
   - Update the token in your deployment environment (Render.com)

4. **Clean git history (optional but recommended):**
   ```bash
   # This rewrites history - coordinate with team first!
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (DANGER: coordinate with team)
   git push origin --force --all
   ```

### Prevention
- `.env.local` is already in `.gitignore` ✅
- Never commit files with sensitive credentials
- Use environment variable services (Vercel, Render) for production
- Consider using tools like `git-secrets` or pre-commit hooks

### Verification
After revoking:
```bash
# This should fail with authentication error
curl -H "Authorization: Bearer OLD_TOKEN" \
  https://j2t31xge.api.sanity.io/v2024-01-01/data/query/production
```

---
**This file can be deleted after the issue is resolved.**
