/**
 * API Gateway Sample Application
 * GET endpoint: /items
 * POST endpoint: /items
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * Helper function to simulate random delay
 */
const randomDelay = (min, max) => {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
};

// Initialize DynamoDB client
// AWS_REGION is automatically set by Lambda runtime, but we can use it if available
// For local testing, fallback to us-east-1
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'poc-api-gateway-items';

/**
 * GET /items - Get all items
 * Returns various response types with random execution times for testing metrics
 */
exports.getItems = async (event) => {
  // test change
  console.log('GET /items - Request:', JSON.stringify(event, null, 2));
  
  // Generate random scenario for testing different metrics
  // 70% success, 20% 4xx errors, 10% 5xx errors
  const random = Math.random();
  const scenario = random < 0.7 ? 'success' : random < 0.9 ? 'client_error' : 'server_error';
  
  // Random execution time: 15ms to 400ms for success, 5ms to 150ms for errors
  const delay = scenario === 'success'
    ? Math.floor(Math.random() * 385) + 15  // 15-400ms
    : Math.floor(Math.random() * 145) + 5;   // 5-150ms
  
  await randomDelay(delay, delay);
  
  try {
    // Simulate different scenarios
    if (scenario === 'client_error') {
      // 4xx error - Bad Request or Not Found (return HTTP error, not Lambda exception)
      // This will show up in API Gateway 4XXError metric, not Lambda Errors
      const errorType = Math.random() < 0.5 ? 400 : 404;
      return {
        statusCode: errorType,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: errorType === 400 ? 'Bad Request' : 'Not Found',
          message: `Simulated ${errorType} error for testing`,
          executionTime: `${delay}ms`
        })
      };
    }
    
    if (scenario === 'server_error') {
      // 5xx error - Internal Server Error
      // Throw exception WITHOUT catching it so Lambda counts it as an error
      // This will also generate API Gateway 5XXError metric
      throw new Error('Simulated server error for testing');
    }
    
    // Success scenario - try to get items from DynamoDB
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100
    });
    
    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
        count: result.Items?.length || 0,
        executionTime: `${delay}ms`
      })
    };
  } catch (error) {
    // Only catch unexpected errors (not simulated server errors)
    // If it's a simulated server error, it should have been thrown above
    // For other errors (like DynamoDB errors), return 500 but Lambda won't count it
    console.error('Error getting items:', error);
    
    // If this is a simulated server error, re-throw it so Lambda counts it
    if (error.message && error.message.includes('Simulated server error')) {
      throw error;
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get items',
        message: error.message,
        executionTime: `${delay}ms`
      })
    };
  }
};

/**
 * POST /items - Create a new item
 * Returns various response types with random execution times for testing metrics
 */
exports.createItem = async (event) => {
  console.log('POST /items - Request:', JSON.stringify(event, null, 2));
  
  // Generate random scenario for testing different metrics
  // 60% success, 25% 4xx errors (validation), 15% 5xx errors
  const random = Math.random();
  const scenario = random < 0.6 ? 'success' : random < 0.85 ? 'client_error' : 'server_error';
  
  // Random execution time: 20ms to 500ms for success, 10ms to 200ms for errors
  const delay = scenario === 'success'
    ? Math.floor(Math.random() * 480) + 20  // 20-500ms
    : Math.floor(Math.random() * 190) + 10; // 10-200ms
  
  await randomDelay(delay, delay);
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, name, description, price } = body;
    
    // Simulate client errors (4xx) - validation failures
    if (scenario === 'client_error') {
      const errorType = Math.random() < 0.5 ? 400 : 422;
      return {
        statusCode: errorType,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: errorType === 400 ? 'Bad Request' : 'Unprocessable Entity',
          message: errorType === 400 
            ? 'Missing required fields: id and name are required'
            : 'Validation failed: Invalid data format',
          executionTime: `${delay}ms`
        })
      };
    }
    
    // Simulate server errors (5xx)
    if (scenario === 'server_error') {
      // Throw exception WITHOUT catching it so Lambda counts it as an error
      // This will also generate API Gateway 5XXError metric
      throw new Error('Simulated server error for testing');
    }
    
    // Validation for success scenario (but allow some to pass without validation for variety)
    if (!id || !name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: id and name are required',
          executionTime: `${delay}ms`
        })
      };
    }
    
    const item = {
      id,
      name,
      description: description || '',
      price: price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });
    
    await docClient.send(command);
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: item,
        message: 'Item created successfully',
        executionTime: `${delay}ms`
      })
    };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create item',
        message: error.message,
        executionTime: `${delay}ms`
      })
    };
  }
};

/**
 * Lambda handler for API Gateway integration
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.path;
  
  if (httpMethod === 'GET' && path === '/items') {
    return await exports.getItems(event);
  } else if (httpMethod === 'POST' && path === '/items') {
    return await exports.createItem(event);
  } else {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Not found',
        path: path
      })
    };
  }
};

