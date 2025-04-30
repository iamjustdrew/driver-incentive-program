const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

// dynamodb access
const dynamodb = new AWS.DynamoDB.DocumentClient();
const points_table = "team04-point-balance-table";

// paths for catalog information
const points_path = "/points";
const points_id_path = "/points/{id}";

exports.handler = async function (event)
{
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;

    switch (true)
    {
     // events for /points
        case event.httpMethod === "GET" && event.resource === points_path:
            response = await getUserPoints();
            break;
     case event.httpMethod === "POST" && event.resource === points_path:
            response = await addUserBalance(JSON.parse(event.body));
            break;
            
     // events for /points/{id}
        case event.httpMethod === "GET" && event.resource === points_id_path:
            response = await getUserPoints(event.pathParameters.id, event.queryStringParameters.sponsor);
            break;
        case event.httpMethod === "PATCH" && event.resource === points_id_path:
            response = await updateUserPoints(event.pathParameters.id, JSON.parse(event.body));
            break;
            
        case event.httpMethod === "OPTIONS" && event.resource === points_id_path:
        response = buildResponse(200, null, {
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
            "Access-Control-Allow-Origin": "*"
        });
        break;

     // default event
        default:
            response = buildResponse(404, "Not Found");
    }

    return response;
};

// POST
async function addUserBalance(requestBody)
{
 // if id is unique
    const params = 
    {
        TableName: points_table,
        Item: requestBody
    };

    try
    {
        await dynamodb.put(params).promise();
        const body =
        {
            Operation: "ADD",
            Message: "SUCCESS",
            Item: requestBody
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error: ", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// GET
async function getUserPoints(userId, sponsorId)
{
    const params = {
        TableName: points_table,
        Key: {
            "UserID": userId,
            "SponsorID": sponsorId
        }
    };

    try {
        const data = await dynamodb.get(params).promise();
        if (!data.Item) { return buildResponse(404, "Not Found"); }    // validation that something is there
        return buildResponse(200, data.Item);    // Return the first item from the Items array
    }
    catch (error)
    {
        console.error("Error fetching User Point Balance:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// PATCH
async function updateUserPoints(user_points, requestBody) {
    const params = {
        TableName: points_table,
        Key: { 
            "UserID": user_points,
            "SponsorID": requestBody.SponsorID // Assuming this is provided in the request body
        },
        UpdateExpression: "set Balance = :balance",
        ExpressionAttributeValues: {
            ":balance": Number(requestBody.Balance)
        },
        ReturnValues: "UPDATED_NEW"
    };

    console.log("Update params:", JSON.stringify(params, null, 2)); // Debugging

    try {
        const data = await dynamodb.update(params).promise();
        const body = {
            Operation: "UPDATE",
            Message: "SUCCESS",
            UpdatedAttributes: data.Attributes
        };
        
        return buildResponse(200, body);
    } catch (error) {
        console.error("Error updating User Point Balance:", error);
        return buildResponse(500, "Internal Server Error", { errorDetails: error.message });
    }
}



// Utility function to build the HTTP response
function buildResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allows requests from any origin
      "Content-Type": "application/json",
      ...additionalHeaders // Merges any additional headers passed to the function
    },
    body: JSON.stringify(body)
  };
}
