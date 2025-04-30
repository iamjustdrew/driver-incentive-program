const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

const express = require('express');
const router = express.Router();

// dynamodb access
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodb_table = "team04-database";

// cognito access
const cognito = new AWS.CognitoIdentityServiceProvider();
const cognito_user_pool = 'us-east-1_QajwK3NHL';


// Initialize AWS (I emptied these fields because they should be kept private)
AWS.config.update({
  accessKeyId: "N/A",
  secretAccessKey: ""N/A",
  region: "us-east-1"
});

router.post('/verify', async (req, res) => {
  const { username, newEmail } = req.body;
  const params = {
    UserPoolId: 'us-east-1_QajwK3NHL',
    Username: username,
    UserAttributes: [
      {
        Name: 'email',
        Value: newEmail
      },
      {
        Name: 'email_verified',
        Value: 'true'
      }
    ]
  };

  try {
    await cognito.adminUpdateUserAttributes(params).promise();
    res.send({ message: 'Email updated and verified successfully' });
  } catch (error) {
    console.error('Failed to update user attributes:', error);
    res.status(500).send({ message: 'Failed to update email', error: error.message });
  }
});

module.exports = router;