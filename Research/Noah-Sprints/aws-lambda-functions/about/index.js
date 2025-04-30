const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

// dynamodb access
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodb_table = "team04-database";

// paths for about page
const about_path = "/about_page/project_info";
const about_id_path = "/about_page/project_info/{id}";

// paths for contact page
const contact_info_path = "/about_page/contact_info";
const contact_info_param_path = "/about_page/contact_info/{id}";

exports.handler = async function (event)
{
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;

    switch (true)
    {
     // event for /project_info
        case event.httpMethod === "POST" && event.resource === about_path:
            response = await addProjectInfo(JSON.parse(event.body));
            break;

     // events for /project_info/{id} 
        case event.httpMethod === "GET" && event.resource === about_id_path:
            response = await getProjectInfoParam(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === about_id_path:
            response = await updateProjectInfoParam(event.pathParameters.id, JSON.parse(event.body));
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

     // default event
        default:
            response = buildResponse(404, "Not Found");
    }

    return response;
};

// events for /project_info

// POST
async function addProjectInfo(requestBody)
{
 // check if id already exists
    const existing_project_info_id = await getProjectInfoParam(requestBody.id);
    if (existing_project_info_id.statusCode === 200) { return buildResponse(400, "ID Already in Use"); }

 // if id is unique
    const params = 
    {
        TableName: dynamodb_table,
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
        TableName: dynamodb_table,
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
async function updateProjectInfoParam(id, requestBody)
{
    const params =
    {
        TableName: dynamodb_table,
        Key: { "id": Number(id) },
        UpdateExpression: "set #sprintNumber = :sprint, #releaseDate = :date",
        ExpressionAttributeNames:   // needed for spaces
        {
            "#sprintNumber": "Sprint Number",
            "#releaseDate": "Release Date"
        },
        ExpressionAttributeValues:
        {
            ":sprint": requestBody["Sprint Number"],
            ":date": requestBody["Release Date"]
        },
        ReturnValues: "UPDATED_NEW"
    };

    //console.log("Update params:", JSON.stringify(params, null, 2)); // Debugging

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

// events for /contact_info

// GET
async function getContactInfo()
{
    const params = { TableName: dynamodb_table };

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
        TableName: dynamodb_table,
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
        TableName: dynamodb_table,
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
        TableName: dynamodb_table,
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
        TableName: dynamodb_table,
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