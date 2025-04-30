const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "team04-database";

const cognito = new AWS.CognitoIdentityServiceProvider();
const cognitoUserPool = 'us-east-1_QajwK3NHL';

// paths for project information
const project_info_path = "/about_page/project_info";
const project_info_param_path = "/about_page/project_info/{id}";

// paths for contact information
const contact_info_path = "/about_page/contact_info";
const contact_info_param_path = "/about_page/contact_info/{id}";

// paths for login information
const login_path = "/login";
const login_param_path = "/login/{id}";

// paths for catalog information
const catalog_path = "/catalog";
const catalog_param_path = "/catalog/{catalogId}";
const catalog_items_path = "/catalog/{catalogId}/items";

exports.handler = async function (event)
{
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;

    switch (true)
    {
     // events for /project_info
        case event.httpMethod === "GET" && event.resource === project_info_path:
            response = await getProjectInfo();
            break;
        case event.httpMethod === "POST" && event.resource === project_info_path:
            response = await addProjectInfo(JSON.parse(event.body));
            break;

     // events for /project_info/{id} 
        case event.httpMethod === "GET" && event.resource === project_info_param_path:
            response = await getProjectInfoParam(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === project_info_param_path:
            const requestBodyProject = JSON.parse(event.body);
            response = await updateProjectInfoParam(requestBodyProject.id, requestBodyProject.updateKey, requestBodyProject.updateValue);
            break;

     // events for /contact_info
        case event.httpMethod === "GET" && event.resource === contact_info_path:
            response = await getContactInfo();
            break;
        case event.httpMethod === "POST" && event.resource === contact_info_path:
            response = await addContactInfo(JSON.parse(event.body));
            break;

     // events for /contact_info/{id} 
        case event.httpMethod === "GET" && event.resource === contact_info_param_path:
            response = await getContactInfoParam(event.pathParameters.id);
            break;
        case event.httpMethod === "DELETE" && event.resource === contact_info_param_path:
            response = await deleteContactInfoParam(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === contact_info_param_path:
            const requestBodyContact = JSON.parse(event.body);
            response = await updateContactInfoParam(requestBodyContact.id, requestBodyContact.updateKey, requestBodyContact.updateValue);
            break;
            
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
    
     // events for /catalog
        case event.httpMethod === "GET" && event.resource === catalog_path:
            response = await getCatalogs();
            break;
        case event.httpMethod === "POST" && event.resource === catalog_path:
            response = await addCatalog(JSON.parse(event.body));
            break;
    
     // events for /catalog/catalogId
        case event.httpMethod === "GET" && event.resource === catalog_param_path:
            response = await getCatalogById(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === catalog_param_path:
            // or use "PATCH" if supporting partial updates
            response = await updateCatalogById(event.pathParameters.id, JSON.parse(event.body));
            break;
        case event.httpMethod === "DELETE" && event.resource === catalog_param_path:
            response = await deleteCatalogById(event.pathParameters.id);
            break;
    
     // events for /catalog/catalogId/items
        case event.httpMethod === "GET" && event.resource === catalog_items_path:
            response = await getCatalogItems();
            break;
        case event.httpMethod === "POST" && event.resource === catalog_items_path:
            response = await addCatalogItem(JSON.parse(event.body));
            break;
            
     // events /catalog/catalogId/items/{itemsid}

     // default event
        default:
            response = buildResponse(404, "Not Found");
    }

    return response;
};

// events for /project_info

// GET
async function getProjectInfo()
{
    const params = { TableName: dynamodbTableName };

    try
    {
        const allSprints = await scanDynamoRecords(params, []);
        const projectInfo = allSprints.filter(record => record.page_type === "/about_page/project_info");
        if (projectInfo.length === 0) { return buildResponse(404, "No Project Information Found...Empty List"); }
        const body = { project_info:projectInfo };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error('Error: ', error);
        return buildResponse(500, "Internal Server Error");
    }
}

// POST
async function addProjectInfo(requestBody)
{
 // check if id already exists
    const existing_project_info_id = await getProjectInfoParam(requestBody.id);
    if (existing_project_info_id.statusCode === 200) { return buildResponse(400, "ID Already in Use"); }

 // if id is unique
    const params = 
    {
        TableName: dynamodbTableName,
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

// events for /project_info/{id}

// GET
async function getProjectInfoParam(project_info_id)
{
    const params =
    {
        TableName: dynamodbTableName,
        Key: { "id": Number(project_info_id) },
    };

    try
    {
        const response = await dynamodb.get(params).promise();
        if (!response.Item) { return buildResponse(404, "Project Information w/ ID Does Not Exist"); }
        return buildResponse(200, response.Item);
    }
    catch (error)
    {
        console.error("Error: ", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// PATCH
async function updateProjectInfoParam(project_info_id, update_key, update_value)
{
    //project_info_id = 2;
 // if id already exists
    //const existing_project_info_id = await getProjectInfoParam(project_info_id);
    //if (existing_project_info_id.statusCode !== 200) { return buildResponse(404, 'Project Information w/ ID Does Not Exist'); }

    const params =
    {
        TableName: dynamodbTableName,
        Key: { "id": Number(project_info_id) },
        UpdateExpression: `set #updateKey = :value`,
        ExpressionAttributeNames: { "#updateKey": update_key },
        ExpressionAttributeValues: { ":value": update_value },
        ReturnValues: "UPDATED_NEW"
    };

    try
    {
        const response = await dynamodb.update(params).promise();
        const body =
        {
            Operation: "UPDATE",
            Message: "SUCCESS",
            UpdatedAttributes: response.Attributes
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error Updating Project Information:", error);
        return buildResponse(500, 'Internal Server Error');
    }
}

// events for /contact_info

// GET
async function getContactInfo()
{
    const params = { TableName: dynamodbTableName };

    try
    {
        const allContacts = await scanDynamoRecords(params, []);
        if (allContacts.length === 0) { return buildResponse(404, "No Contact Information Found...Empty List"); }
        const body = { contact_info: allContacts };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error('Error: ', error);
        return buildResponse(500, "Internal Server Error");
    }
}

// POST
async function addContactInfo(requestBody)
{
 // check if id already exists
    const existing_contact_info_id = await getContactInfoParam(requestBody.id);
    if (existing_contact_info_id.statusCode === 200) { return buildResponse(400, "ID Already in Use"); }

 // if id is unique
    const params = 
    {
        TableName: dynamodbTableName,
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

// events for /contact_info/{id}

// GET
async function getContactInfoParam(contact_info_id)
{
    const params =
    {
        TableName: dynamodbTableName,
        Key: { "id": contact_info_id },
    };

    try
    {
        const response = await dynamodb.get(params).promise();
        if (!response.Item) { return buildResponse(404, "Contact Information w/ ID Does Not Exist"); }
        return buildResponse(200, response.Item);
    }
    catch (error)
    {
        console.error("Error: ", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// DELETE
async function deleteContactInfoParam(contact_info_id)
{
 // if id already exists
    const existing_contact_info_id = await getContactInfoParam(contact_info_id);
    if (existing_contact_info_id !== 200) { return buildResponse(404, 'Contact Information w/ ID Does Not Exist'); }

    const params =
    {
        TableName: dynamodbTableName,
        Key: { "id": contact_info_id },
    };

    try
    {
        dynamodb.delete(params).promise();
        console.log('Contact Information Deleted Successfully');
    }
    catch (error)
    {
        console.error('Error Deleting Contact Information', error);
        return buildResponse(500, 'Internal Server Error');
    }
}

// PATCH
async function updateContactInfoParam(contact_info_id, update_key, update_value)
{
 // if id already exists
    const existing_contact_info_id = await getContactInfoParam(contact_info_id);
    if (existing_contact_info_id.statusCode !== 200) { return buildResponse(404, 'Contact Information w/ ID Does Not Exist'); }

    const params =
    {
        TableName: dynamodbTableName,
        Key: { "id": contact_info_id },
        UpdateExpression: `set ${update_key} = :value`,
        ExpressionAttributeValues: { ":value": update_value},
        ReturnValues: "UPDATED_NEW"
    };

    try
    {
        const response = await dynamodb.update(params).promise();
        const body =
        {
            Operation: "UPDATE",
            Message: "SUCCESS",
            UpdatedAttributes: response
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error Updating contact Information:", error);
        return buildResponse(500, 'Internal Server Error');
    }
}

// events for /login

// GET
async function getLoginInfo()
{
    const params =
    {
        UserPoolId: cognitoUserPool,
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
    const cognito_params = { UserPoolId: cognitoUserPool };
    
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
                TableName: dynamodbTableName,
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
	    UserPoolId: cognitoUserPool,
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
        TableName: dynamodbTableName,
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
        UserPoolId: cognitoUserPool,
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

// events for /catalog

// GET
async function getCatalogs() {
    const params = {
        TableName: "team-4-catalog",
    };

    try {
        const data = await dynamodb.scan(params).promise();
        return buildResponse(200, data.Items);
    } catch (error) {
        console.error("Error fetching catalogs:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// POST
async function addCatalog(catalogData) {
    const params = {
        TableName: "team-4-catalog",
        Item: catalogData // The data for the new catalog item
    };

    try {
        await dynamodb.put(params).promise();
        return buildResponse(200, { message: 'Catalog added successfully', catalogData });
    } catch (error) {
        console.error('Error adding catalog:', error);
        return buildResponse(500, { message: 'Error adding catalog' });
    }
}

// events for /catalog/{catalogId}

// GET
async function getCatalogById(catalogId) {
    const params = {
        TableName: "team-4-catalog",
        Key: {
            "id": catalogId
        }
    };

    try {
        const data = await dynamodb.get(params).promise();
        if (data.Item) {
            return buildResponse(200, data.Item);
        } else {
            return buildResponse(404, { message: 'Catalog not found' });
        }
    } catch (error) {
        console.error("Error getting catalog by ID:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// PATCH
async function updateCatalogById(catalogId, updateData) {
    const params = {
        TableName: "team-4-catalog",
        Key: {
            "id": catalogId
        },
        UpdateExpression: "set catalogName = :n, description = :d",
        ExpressionAttributeValues: {
            ":n": updateData.catalogName,
            ":d": updateData.description
        },
        ReturnValues: "UPDATED_NEW"
    };

    try {
        const data = await dynamodb.update(params).promise();
        return buildResponse(200, { message: "Catalog updated successfully", updatedAttributes: data.Attributes });
    } catch (error) {
        console.error("Error updating catalog:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// DELETE
async function deleteCatalogById(catalogId) {
    const params = {
        TableName: "team-4-catalog",
        Key: {
            "id": catalogId
        }
    };

    try {
        await dynamodb.delete(params).promise();
        return buildResponse(200, { message: "Catalog deleted successfully" });
    } catch (error) {
        console.error("Error deleting catalog:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// events for /catalog/items

// GET
async function getCatalogItems(catalogId) {
    const params = {
        TableName: "team-4-catalog",
        FilterExpression: "#catalogId = :catalogIdValue",
        ExpressionAttributeNames: {
            "#catalogId": "catalogId",
        },
        ExpressionAttributeValues: {
            ":catalogIdValue": catalogId,
        }
    };

    try {
        const data = await dynamodb.qu(params).promise();
        return buildResponse(200, data.Items);
    } catch (error) {
        console.error("Error fetching catalog items:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// POST
async function addItemToCatalog(item) {
  
  const params = {
    TableName: "team-4-catalog", 
    Item: {
      id: item.id, 
      catalogId: item.catalogId,
      productName: item.productName,
      type: item.type, // media format such as music, movie,podcast
      genre: item.genre,
      price: item.price, 
      pointValue: item.pointValue, 
      createdAt: Date.now(), // Stores the current timestamp
      productUrl: item.productUrl,
      artworkUrl: item.artworkUrl,
      description: item.description
    }
  };

  try {
    const data = await dynamodb.put(params).promise();
    console.log("Success - item added", data);
    return buildResponse(200, { message: "Item added to catalog successfully", item });
  } catch (err) {
    console.error("Error", err);
    return buildResponse(500, { message: "Failed to add item to catalog" });
  }
}

// Function to add an item to a specific catalog
async function addCatalogItem(item) {
    const params = {
        TableName: "team-4-catalog",
        Item: item
    };

    try {
        await dynamodb.put(params).promise();
        return buildResponse(200, { message: "Item added successfully", item });
    } catch (error) {
        console.error("Error adding item to catalog:", error);
        return buildResponse(500, "Internal Server Error");
    }
}
 
// utility functions 
async function scanDynamoRecords(scanParams, itemArray)
{
  try
  {
    const dynamoData = await dynamodb.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey)
    {
      scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  }
  catch (error)
  {
    console.error('Error: ', error);
    return buildResponse(500, "Internal Server Error");
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


/*
// mailjet api path
//const email_path = "/sendEmail";
// mailjet api keys (api key, secret)
//const mailjet = require('node-mailjet').connect('1569dd34f96f61fd95444dc9ce82e435', 'accdd7c6324feba3c128e48ffbdb8823');

// mailjet function
exports.handler = async (event) => {
    const request = JSON.parse(event.body);
    const emailData = {
        Messages: [{
            From: {
                Email: "your-email@example.com", // Sender's email address
                Name: "Your Name or Company" // sender name
            },
            To: [{
                Email: "gdipsupport@proton.me",
                Name: "Support Team"
            }],
            Subject: "Contact Form Submission",
            TextPart: `Message from: ${request.email}\n\n${request.message}`,
        }]
    };
    
    try {
        await mailjet.post("send", { 'version': 'v3.1' }).request(emailData);
        return { statusCode: 200, body: 'Email sent successfully' };
    } catch (error) {
        console.error("Error sending email:", error);
        return { statusCode: 500, body: 'Failed to send email' };
    }
};
*/