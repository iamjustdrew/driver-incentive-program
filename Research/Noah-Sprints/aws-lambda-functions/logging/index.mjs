import AWS from 'aws-sdk/lib/aws.js';
AWS.config.update({ region: "us-east-1" });

const dynamodb = new AWS.DynamoDB.DocumentClient();
const logTableName = 'team04-logs';

export async function handler(event) {
    console.log("Received event:", JSON.stringify(event, null, 2));

    if (event.triggerSource === "PostAuthentication_Authentication") {
        console.log(`logLoginAttempt`);
        await logLoginAttempt({
            username: event.userName, // Ensure you are extracting username correctly based on your event structure
            eventType: event.triggerSource,
            message: "User logged in successfully",
            attributes: event.request.userAttributes // or adjust according to your event structure
        });
    }
    return event; // Return to continue with other triggers or Cognito process
}

async function logLoginAttempt({ username, eventType, message, attributes }) {
    const logEntry = {
        TableName: logTableName,
        Item: {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            eventType: eventType,
            username: username,
            message: message,
            attributes: JSON.stringify(attributes) // Storing all user attributes as a JSON string
        }
    };

    try {
        await dynamodb.put(logEntry).promise();
        console.log(`Logged ${eventType} for user ${username}`);
    } catch (error) {
        console.error(`Error logging event for user ${username}:`, error);
    }
};
