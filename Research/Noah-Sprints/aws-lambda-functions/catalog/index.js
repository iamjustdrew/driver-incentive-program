const AWS = require("aws-sdk");
const https = require("https");
AWS.config.update({ region: "us-east-1" });

// dynamodb access
const dynamodb = new AWS.DynamoDB.DocumentClient();
const catalog_table = "team-4-catalog";

// paths for catalog information
const catalog_path = "/catalog";
const catalog_id_path = "/catalog/{id}";
const catalog_items_path = "/catalog/items";
const catalog_items_id_path = "/catalog/items/{id}";

exports.handler = async function (event)
{
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;

    switch (true)
    {
       // events for /catalog
        case event.httpMethod === "GET" && event.resource === catalog_path:
            response = await getCatalogs();
            break;
            
       // events for /catalog/{id}
        case event.httpMethod === "GET" && event.resource === catalog_id_path:
            response = await getCatalogById(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === catalog_id_path:
            response = await updateCatalogById(event.pathParameters.id, JSON.parse(event.body));
            break;
    
     // events for /catalog/items
        case event.httpMethod === "GET" && event.resource === catalog_items_path:
            response = await getCatalogItems();
            break;
        case event.httpMethod === "POST" && event.resource === catalog_items_path:
            //const search = await itunes_search(event.queryStringParameters.term, 1);
            response = await addCatalogItem(JSON.parse(event.body)/*, search*/);
            break;
            
     // events /catalog/items/{id}
        case event.httpMethod === "GET" && event.resource === catalog_items_id_path:
            response = await getItemById(event.pathParameters.id);
            break;
        case event.httpMethod === "PATCH" && event.resource === catalog_items_id_path:
            response = await updateItemById(event.pathParameters.id, JSON.parse(event.body));
            break;
        case event.httpMethod === "DELETE" && event.resource === catalog_items_id_path:
            response = await deleteItem(event.pathParameters.id);
            break;

     // default event
        default:
            response = buildResponse(404, "Not Found");
    }

    return response;
};

// events for /catalog

// GET
async function getCatalogs()
{
    const params = { TableName: catalog_table, };
    
    try
    {
        const data = await dynamodb.scan(params).promise();
        return buildResponse(200, sort_catalogs(data.Items));
    }
    catch (error)
    {
        console.error("Error fetching catalogs:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// events for /catalog/{id}

// GET
async function getCatalogById(catalogId)
{
    const params =
    {
        TableName: catalog_table,
        FilterExpression: "catalog_id = :catalogId",
        ExpressionAttributeValues: { ":catalogId": catalogId }
    };

    try
    {
        const data = await dynamodb.scan(params).promise();
        return buildResponse(200, { catalog_id: catalogId, items: data.Items });
    }
    catch (error)
    {
        console.error("Error updating catalog:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// PATCH
async function updateCatalogById(catalogId, updateData) {
    const params = {
        TableName: catalog_table,
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

// events for /catalog/items 

// GET
async function getCatalogItems(catalogId)
{
    const params = { TableName: catalog_table, };

    try
    {
        const data = await dynamodb.scan(params).promise();
        return buildResponse(200, data.Items);
    }
    catch (error)
    {
        console.error("Error fetching catalogs:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// POST
async function addCatalogItem(requestBody/*, search*/)
{
    /*if (!search.results || search.results.length === 0)
        { throw new Error("No results from iTunes Search"); }
    
    const iTunesItem = search.results[0];*/
    
    const add_date =
    {/*
        catalog_id: requestBody.catalog_id,
        itemId: requestBody.item_id,
        type: requestBody.type,
        point_ratio: requestBody.point_ratio,
        productName: iTunesItem.trackName,
        artistName: iTunesItem.artistName,
        genre: iTunesItem.primaryGenreName, // Dynamically assigned based on iTunesItem data
        price: iTunesItem.trackPrice ? iTunesItem.trackPrice.toString() : "N/A", // Handling cases where price might be missing
        productUrl: iTunesItem.trackViewUrl,
        artworkUrl: iTunesItem.artworkUrl100,
        description: `iTunes description: ${iTunesItem.longDescription || iTunesItem.description || 'No description available'}.`,
        isEditing: requestBody.isEditing,*/...requestBody,
        dateCreated: new Date().toISOString(),
    };
    
    const params = 
    {
        TableName: catalog_table,
        Item: add_date // The data for the new catalog item
    };
    
    try
    {
        await dynamodb.put(params).promise();
        const body =
        {
            Operation: "ADD",
            Message: "SUCCESS",
            Item: add_date
        };
        return buildResponse(200, body);
    }
    catch (error)
    {
        console.error("Error: ", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// events for /catalog/items/{id}

// GET
async function getItemById(item)
{
    const decodedItem = decodeURIComponent(item);

    const params =
    {
        TableName: catalog_table,
        FilterExpression: "productName = :item",
        ExpressionAttributeValues: { ":item": decodedItem }
    };

    try
    {
        const data = await dynamodb.scan(params).promise();
        return buildResponse(200, { productName: decodedItem, items: data.Items });
    }
    catch (error)
    {
        console.error("Error finding item:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// DELETE
async function deleteItem(item)
{
    const params =
    {
        TableName: catalog_table,
        Key: { "itemId": Number(item) }
    };

    try
    {
        await dynamodb.delete(params).promise();
        return buildResponse(200, { message: "Item deleted successfully" });
    }
    catch (error)
    {
        console.error("Error deleting item:", error);
        return buildResponse(500, "Internal Server Error");
    }
}

// PATCH
async function updateItemById(productId, updateData)
{
    // Assuming 'productId' is how you identify the item to be updated.
    let updateExpression = 'set';
    let ExpressionAttributeNames = {};
    let ExpressionAttributeValues = {};

    // Dynamically build the update expression based on provided attributes
    Object.keys(updateData).forEach((key, index) => {
        updateExpression += ` #${key} = :${key}`;
        if (index < Object.keys(updateData).length - 1) {
            updateExpression += ',';
        }
        ExpressionAttributeNames[`#${key}`] = key;
        ExpressionAttributeValues[`:${key}`] = updateData[key];
    });

    const params = {
        TableName: catalog_table,
        Key: {
            "itemId": productId // Assuming your table uses 'id' as the primary key
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: ExpressionAttributeNames,
        ExpressionAttributeValues: ExpressionAttributeValues,
        ReturnValues: "ALL_NEW" // Return all attributes of the item after the update
    };

    try {
        const result = await dynamodb.update(params).promise();
        return buildResponse(200, { message: "Item updated successfully", updatedAttributes: result.Attributes });
    } catch (error) {
        console.error("Error updating item:", error);
        return buildResponse(500, "Internal Server Error");
    }
}
 
// utility functions 
function sort_catalogs(items)
{
    return items.reduce((acc, item) =>
    {
        if (!acc[item.catalog_id]) { acc[item.catalog_id] = []; }
        acc[item.catalog_id].push(item);
        return acc;
    }, {});
}

async function itunes_search(term, limit)
{
    return new Promise((resolve, reject) =>
    {
        const query = encodeURIComponent(term);
        const url = `https://itunes.apple.com/search?term=${query}&limit=${limit}&media=music`;

        https.get(url, (res) =>
        {
            let data = '';

            res.on('data', (chunk) => { data += chunk; });

            res.on('end', () => { resolve(JSON.parse(data)); });
        }).on('error', (err) => { reject("Error: " + err.message); });
    });
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