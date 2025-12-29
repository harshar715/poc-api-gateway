# API Gateway Sample Application - POC

Sample API Gateway application with 1 GET and 1 POST endpoint for testing PR Metrics Comparison.

## Endpoints

1. `GET /items` - Get all items
2. `POST /items` - Create a new item

## Local Development

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Serverless Framework (required for deployment)

### Install Serverless Framework

```bash
# Install globally
npm install -g serverless

# Verify installation
serverless --version
# Should show: Framework Core: 3.x.x

# If you get "No version found for 3" error, see TROUBLESHOOTING.md
```

### Setup

```bash
# Install dependencies
npm install

# Install Serverless Framework (optional)
npm install -g serverless
```

### Testing Locally

You can test the handlers directly:

```javascript
// test-handler.js
const handler = require('./handler');

// Test GET
handler.getItems({}).then(console.log);

// Test POST
handler.createItem({
  body: JSON.stringify({
    id: '1',
    name: 'Test Item',
    description: 'Test Description',
    price: 10.99
  })
}).then(console.log);
```

## Deployment to AWS

### Option 1: Using Serverless Framework

```bash
# Deploy
serverless deploy

# Deploy to specific stage
serverless deploy --stage prod

# Remove
serverless remove
```

### Option 2: Manual Deployment

1. Create Lambda function via AWS Console
2. Upload handler.js as zip
3. Create API Gateway REST API
4. Create resources and methods
5. Deploy to stage

## Configuration for PR Metrics

The application is configured to work with PR Metrics Comparison:
- API Gateway REST API
- Lambda function integration
- Standard HTTP methods (GET, POST)

## Environment Variables

- `TABLE_NAME` - DynamoDB table name (default: `api-gateway-sample-app-dev-items`)
- `AWS_REGION` - AWS region (default: `us-east-1`)

## DynamoDB Table

The Serverless configuration automatically creates a DynamoDB table:
- Table name: `api-gateway-sample-app-{stage}-items`
- Primary key: `id` (String)
- Billing mode: Pay per request

## Testing Endpoints

After deployment:

```bash
# Get API Gateway URL from deployment output
API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com/dev"

# GET items
curl $API_URL/items

# POST item
curl -X POST $API_URL/items \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "name": "Test Item",
    "description": "Test Description",
    "price": 10.99
  }'
```

