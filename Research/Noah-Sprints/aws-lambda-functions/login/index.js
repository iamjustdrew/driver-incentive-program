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
const companies_path = "/login/companies";
const user_companies_path = "/login/companies/{id}";

// logging info
const logTableName = 'team04-logs';
const log_path = "/logs";

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
        case event.httpMethod === "POST" && event.resource === login_param_path:
                response = await addUserToCognito(JSON.parse(event.body));
                break;
    
     // event for /login/company
        case event.httpMethod === "GET" && event.resource === companies_path:
            response = await getCompanies();
            break;
        
     // event for /login/{id}/company
        case event.httpMethod === "GET" && event.resource === user_companies_path:
            response = await getUserCompanies(event.pathParameters.id);
            break;
            
            
            
     // Handle log entry creation
        case event.httpMethod === "POST" && event.resource === log_path:
            response =  await createLogEntry(JSON.parse(event.body));
            break;
            
     // Handle fetching all log entries
        case event.httpMethod === "GET" && event.resource === log_path:
            response =  await getAllLogs();
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
        Limit: 50 // Adjust based on how many users you want to fetch
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
                    Role: attributes['custom:user_role'],
                    Company: attributes['custom:company']
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
    try {
        // Delete the user from the Cognito user pool
        await cognito.adminDeleteUser({
            UserPoolId: cognito_user_pool,
            Username: login_id
        }).promise();

        // Scan DynamoDB for items with the matching UserID (login_id)
        const scanResponse = await dynamodb.scan({
            TableName: dynamodb_table,
            FilterExpression: 'UserID = :userId',
            ExpressionAttributeValues: {
                ':userId': login_id
            }
        }).promise();

        // Delete each item found by the scan
        for (const item of scanResponse.Items) {
            await dynamodb.delete({
                TableName: dynamodb_table,
                Key: {
                    'id': item.id
                }
            }).promise();
        }
        
        return buildResponse(200, { message: `User ${login_id} deleted successfully from Cognito and DynamoDB.` });
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

// POST
async function addUserToCognito(requestBody)
{
    const params =
    {
        UserPoolId: cognito_user_pool,
        Username: requestBody.username,
        UserAttributes: [
            {
                Name: 'email',
                Value: requestBody.email
            },
            {
                Name: 'name',
                Value: requestBody.name
            },
            {
                Name: 'custom:user_role',
                Value: requestBody.user_role
            },
            {
                Name: 'custom:company',
                Value: requestBody.company
            }
        ],
        TemporaryPassword: requestBody.temporaryPassword, // You can also generate a temporary password here
    };
    
    try
    {
        await cognito.adminCreateUser(params).promise();
        await addLoginInfo();   // adds changed user in dynamodb
        return buildResponse(200, { message: "User added successfully to Cognito." });
    }
    catch (error)
    {
        console.error("Error adding user to Cognito:", error);
        return buildResponse(500, { message: "Internal Server Error", details: error.message });
    }
}

// event for /login/company

// GET
async function getCompanies()
{
    const companiesSet = new Set();  // Set to hold unique company names

    try
    {
        let paginationToken = null;
        do
        {
            const listUsersParams =
            {
                UserPoolId: cognito_user_pool,
                PaginationToken: paginationToken
            };
            const listUsersResponse = await cognito.listUsers(listUsersParams).promise();
            paginationToken = listUsersResponse.PaginationToken;

         // Process each user
            listUsersResponse.Users.forEach(user =>
            {
                const companyAttribute = user.Attributes.find(attr => attr.Name === 'custom:company');
                if (companyAttribute && companyAttribute.Value)
                {
                    const companies = companyAttribute.Value.split(',');
                    companies.forEach(company => {
                        companiesSet.add(company.trim());  // Add each company to the Set, trimming whitespace
                    });
                }
            });
        } while (paginationToken);

     // Convert Set to Array
        const uniqueCompanies = Array.from(companiesSet);
        return buildResponse(200, { companies: uniqueCompanies });
    }
    catch (error)
    {
        console.error("Error fetching companies: ", error);
        return buildResponse(500, "Internal Server Error");
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




async function createLogEntry(data) {
    const logEntry = {
        TableName: logTableName,
        Item: {
            id: `log-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            loggedByUsername: data.loggedByUsername,
            loggedByRole: data.loggedByRole,
            loggedByCompany: data.loggedByCompany,
            subjectUsername: data.subjectUsername,
            subjectRole: data.subjectRole,
            subjectCompany: data.subjectCompany,
            value: data.value,
            total: data.total,
            subjectEmail: data.subjectEmail,
            eventType: data.eventType,
            message: data.message,
            ipAddress: data.ipAddress,
            
        }
    };

    try {
        await dynamodb.put(logEntry).promise();
        return buildResponse(200, 'Log entry created successfully');
    } catch (error) {
        console.error('Failed to create log entry:', error);
        return { statusCode: 500,             headers: { "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },body: JSON.stringify({ message: 'Failed to create log entry' }) };
    }
}

async function getAllLogs() {
    const params = {
        TableName: logTableName
    };

    try {
        const data = await dynamodb.scan(params).promise();
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            
            body: JSON.stringify(data.Items)
        };
    } catch (error) {
        console.error('Failed to retrieve logs:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to retrieve logs' }) };
    }
}