/**
 * API Gateway Sample Application
 * GET endpoint: /items
 * POST endpoint: /items
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
// AWS_REGION is automatically set by Lambda runtime, but we can use it if available
// For local testing, fallback to us-east-1
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'poc-api-gateway-items';

/**
 * GET /items - Get all items
 */
exports.getItems = async (event) => {
  console.log('GET /items - Request:', JSON.stringify(event, null, 2));
  
  try {
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
        count: result.Items?.length || 0
      })
    };
  } catch (error) {
    console.error('Error getting items:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get items',
        message: error.message
      })
    };
  }
};

/**
 * POST /items - Create a new item
 */
exports.createItem = async (event) => {
  console.log('POST /items - Request:', JSON.stringify(event, null, 2));
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, name, description, price } = body;
    
    // Validation
    if (!id || !name) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: id and name are required'
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
        message: 'Item created successfully'
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
        message: error.message
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

