const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

// dynamodb access
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodb_table = "team04-database";

// cognito access
const cognito = new AWS.CognitoIdentityServiceProvider();
const cognito_user_pool = 'us-east-1_QajwK3NHL';

// paths for login information
const login_path = "/login";
const login_param_path = "/login/{id}";
const user_companies_path = "/login/companies/{id}";

exports.handler = async function (event)
{
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;

    switch (true)
    {
     // events for /login
        case event.httpMethod === "GET" && event.resource === login_path:
            response = await getLoginInfo();
            break;
        case event.httpMethod === "POST" && event.resource === login_path:
            response = await addLoginInfo(/*JSON.parse(event.body)*/);
            break;

     // events for /login/{id} 
        case event.httpMethod === "GET" && event.resource === login_param_path:
            response = await getLoginParam(event.pathParameters.id);
            break;
        case event.httpMethod === "DELETE" && event.resource === login_param_path:
            response = await deleteLoginParam(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === login_param_path:
            const requestBodyLogin = JSON.parse(event.body);
            response = await updateLoginParam(event.pathParameters.id, requestBodyLogin);
            break;
    
     // event for /login/{id}/company
        case event.httpMethod === "GET" && event.resource === user_companies_path:
            response = await getUserCompanies(event.pathParameters.id);
            break;

     // default event
        default:
            response = buildResponse(404, "Not Found");
    }

    return response;
};

// events for /login

// GET
async function getLoginInfo()
{
    const params =
    {
        UserPoolId: cognito_user_pool,
        Limit: 10 // Adjust based on how many users you want to fetch
    };

    try
    {
        const allLogins = await cognito.listUsers(params).promise();
        if (allLogins.length === 0) { return buildResponse(404, "No Login Information Found...Empty List"); }
        const body = { login: allLogins };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error('Error: ', error);
        return buildResponse(500, "Internal Server Error");
    }
}

// POST
async function addLoginInfo()
{
    let dynamo_table_id = 10;
    const cognito_params = { UserPoolId: cognito_user_pool };
    
    try
    {
        const users = await cognito.listUsers(cognito_params).promise();
        
        for (let user of users.Users)
        {
            const attributes = user.Attributes.reduce((acc, attr) => {
                acc[attr.Name] = attr.Value;
                return acc;
            }, {});

            let post_params = {
                TableName: dynamodb_table,
                Item: {
                    id: dynamo_table_id++,
                    UserID: user.Username,
                    Username: attributes['name'],
                    Email: attributes['email'], 
                    Phone: attributes['phone_number'],
                    Status: attributes['custom:status'], 
                    Role: attributes['custom:user_role']
                }
            };
            await dynamodb.put(post_params).promise();
        }
        
        const body =
        {
            Operation: "ADD",
            Message: "SUCCESS",
            Item: users
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error: ", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// events for /login/{id}

// GET
async function getLoginParam(login_id)
{
    const params =
    {
	    UserPoolId: cognito_user_pool,
	    Username: login_id
    };

    try
    {
	    const user = await cognito.adminGetUser(params).promise();
	    return buildResponse(200, user);
    }
    catch (error)
    {
	    console.error("Error: ", error);
	    if (error.code === 'UserNotFoundException') { return buildResponse(404, 'Login Information w/ ID Does Not Exist'); }
	    else { return buildResponse(500, "Internal Server Error"); }
    }
}

// DELETE
async function deleteLoginParam(login_id)
{
 // if id already exists
    const existing_login_id = await getLoginParam(login_id);
    if (existing_login_id !== 200) { return buildResponse(404, 'Login Information w/ ID Does Not Exist'); }

    const params =
    {
        TableName: dynamodb_table,
        Key: { "id": login_id },
    };

    try
    {
        dynamodb.delete(params).promise();
        console.log('Login Information Deleted Successfully');
    }
    catch (error)
    {
        console.error('Error Deleting Login Information', error);
        return buildResponse(500, 'Internal Server Error');
    }
}

// PATCH
async function updateLoginParam(login_id, request_body)
{
 // Preparing attributes for the update
    const attributes = Object.keys(request_body).map(attributeName => (
    {
        Name: attributeName,
        Value: request_body[attributeName]
    }));

    const params =
    {
        UserPoolId: cognito_user_pool,
        Username: login_id,
        UserAttributes: attributes
    };

    try
    {
        await cognito.adminUpdateUserAttributes(params).promise();  // changes information in cognito
        await addLoginInfo();   // adds changed user in dynamodb
        
        const body =
        {
            Operation: "UPDATE",
            Message: "SUCCESS",
            UpdatedAttributes: attributes
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error Updating Login Information:", error);
        return buildResponse(500, 'Internal Server Error');
    }
}

// event for /login/{id}/company

// GET
async function getUserCompanies(login_id)
{
    const params =
    {
	    UserPoolId: cognito_user_pool,
	    Username: login_id
    };

    try
    {
	    const user = await cognito.adminGetUser(params).promise();
	    const companiesAttribute = user.UserAttributes.find(attr => attr.Name === 'custom:company');

     // validates that the user is assigned to a company
        if (companiesAttribute) { return buildResponse(200, companiesAttribute); }
        else { return buildResponse(404, 'User not assigned to a company'); }
    }
    catch (error)
    {
	    console.error("Error: ", error);
	    if (error.code === 'UserNotFoundException') { return buildResponse(404, 'Login Information w/ ID Does Not Exist'); }
	    else { return buildResponse(500, "Internal Server Error"); }
    }
}

function buildResponse(statusCode, body)
{
  return {
    statusCode: statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}