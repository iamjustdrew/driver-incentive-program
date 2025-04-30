const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

// dynamodb access
const dynamodb = new AWS.DynamoDB.DocumentClient();
const app_table = "team04-applications";

// cognito access
const cognito = new AWS.CognitoIdentityServiceProvider();
const cognito_user_pool = 'us-east-1_QajwK3NHL';

// paths for application information
const apps_path = "/applications";
const apps_id_path = "/applications/{id}";
const apps_for_sponsor = "/applications/sponsors";

exports.handler = async function (event)
{
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;
    
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PATCH,DELETE",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "CORS configuration successful" })
        };
    }

    switch (true)
    {
     // events for /applications
        case event.httpMethod === "POST" && event.resource === apps_path:
            response = await add_application(event.queryStringParameters.id, event.queryStringParameters.sponsor);
            break;
     
     // events for /applications/{id}
        case event.httpMethod === "GET" && event.resource === apps_id_path:
            response = await get_application(event.pathParameters.id, event.queryStringParameters.sponsor);
            break;
        case event.httpMethod === "PATCH" && event.resource === apps_id_path:
            response = await change_status(event.pathParameters.id, JSON.parse(event.body));
            break;
        case event.httpMethod === "DELETE" && event.resource === apps_id_path:
            response = await delete_app(event.pathParameters.id, event.queryStringParameters.sponsor);
            break;
            
     // event for /applications/sponsors
        case event.httpMethod === "GET" && event.resource === apps_for_sponsor:
            response = await getSponsorApps(event.queryStringParameters.id);
            break;
            
     // default event
        default:
            response = buildResponse(404, "Not Found");
    }

    return response;
};

// events for /applications

// POST
async function add_application(id, sponsor)
{
    try
    {
        // retrieve user
        const userDetails = await cognito.adminGetUser({
            UserPoolId: cognito_user_pool,
            Username: id
        }).promise();

        // Safely extract name and email from Cognito user details
        const name = userDetails.UserAttributes.find(attr => attr.Name === "name")?.Value || "Default Name";
        const email = userDetails.UserAttributes.find(attr => attr.Name === "email")?.Value || "default@example.com";

        const params =
        {
            TableName: app_table,
            Item: {
                user: id,
                sponsor: sponsor,
                name: name,
                email: email,
                status: "Pending" // set automatically, must be changed with PATCH
            }
        };
        await dynamodb.put(params).promise();

        const body =
        {
            Operation: "ADD",
            Message: "SUCCESS",
            Item: params.Item
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error: ", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// events for /applications/{id}

// GET
async function get_application(id, sponsor)
{
    const params =
    {
        TableName: app_table,
        Key:
        {
            "user": id,
            "sponsor": sponsor
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
async function change_status(id, requestBody)
{
    const params = 
    {
        TableName: app_table,
        Key: 
        { 
            user: id,
            sponsor: requestBody.sponsor
        },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: { "#status": "status" }, // Using an expression attribute name to avoid conflicts with reserved words
        ExpressionAttributeValues: { ":status": requestBody.status },
        ReturnValues: "UPDATED_NEW"
    };

    try
    {
        const updateResult = await dynamodb.update(params).promise();
        console.log("Update result:", JSON.stringify(updateResult, null, 2));
        return buildResponse(200, {
            Operation: "UPDATE",
            Message: "SUCCESS",
            UpdatedAttributes: updateResult.Attributes
        });
    }
    catch (error)
    {
        console.error("Error updating status:", error);
        return buildResponse(500, "Internal Server Error", { errorDetails: error.message });
    }
}

async function delete_app(id, sponsor)
{
    const params =
    {
        TableName: app_table,
        Key:
        {
            "user": id,
            "sponsor": sponsor
        },
    };

    try
    {
        await dynamodb.delete(params).promise();
        console.log('Application Deleted Successfully');
        return buildResponse(200, 'Application Deleted');
    }
    catch (error)
    {
        console.error('Error Deleting Application', error);
        return buildResponse(500, 'Internal Server Error');
    }
}

// event for /applications/sponsors

// GET
async function getSponsorApps(sponsor)
{
    const params =
    {
        TableName: app_table,
        FilterExpression: "sponsor = :sponsorValue",
        ExpressionAttributeValues: { ":sponsorValue": sponsor }
    };

    try
    {
        const data = await dynamodb.scan(params).promise();
        if (data.Items.length === 0) { return buildResponse(404, "No applications found for this sponsor."); }
        return buildResponse(200, { sponsor: sponsor, items: data.Items });
    }
    catch (error)
    {
        console.error("Error finding applications by sponsor:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",  // Allow all domains for CORS
      "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PATCH, DELETE",  // Specify allowed methods
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",  // Specify allowed headers
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}