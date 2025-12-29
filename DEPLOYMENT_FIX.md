# Deployment Fix - AWS_REGION Error

## The Error

```
Lambda was unable to configure your environment variables because the environment 
variables you have provided contains reserved keys that are currently not supported 
for modification. Reserved keys used in this request: AWS_REGION
```

## The Problem

AWS Lambda **automatically sets** `AWS_REGION` based on where the function is deployed. You cannot set it manually as an environment variable.

## The Fix

I've removed `AWS_REGION` from the `serverless.yml` environment variables.

**Before:**
```yaml
environment:
  TABLE_NAME: ${self:service}-${self:provider.stage}-items
  AWS_REGION: ${self:provider.region}  # ❌ This causes the error
```

**After:**
```yaml
environment:
  TABLE_NAME: ${self:service}-${self:provider.stage}-items
  # AWS_REGION is automatically available in Lambda runtime ✅
```

## Code Update

The handler code has been updated to use `AWS_REGION` from the Lambda runtime (which is always available):

```javascript
// Lambda automatically provides AWS_REGION
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
```

## Deploy Again

Now try deploying again:

```bash
cd POC/api-gateway
serverless deploy --stage dev
```

This should work now! ✅

## Why This Happens

Lambda runtime automatically sets these environment variables:
- `AWS_REGION` - The region where the function is deployed
- `AWS_EXECUTION_ENV` - The execution environment
- `AWS_LAMBDA_FUNCTION_NAME` - Function name
- And others...

You cannot override these reserved variables.

## Alternative: Use Provider Region

If you need the region in your code, it's automatically available as `process.env.AWS_REGION` in Lambda - no need to set it in serverless.yml!

