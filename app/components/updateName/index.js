'use client'

import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { updateUserAttribute } from 'aws-amplify/auth';

Amplify.configure({
    Auth: {
      Cognito: {
        //  Amazon Cognito User Pool ID
        userPoolId: 'us-east-1_QajwK3NHL',
        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolClientId: '5ubn7bfsmol0d6tsjh0rrcjd35',
        // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
        identityPoolId: 'us-east-1:95eb17cc-f22a-428e-ab53-f7d12b13a00c',
        // OPTIONAL - This is used when autoSignIn is enabled for Auth.signUp
        // 'code' is used for Auth.confirmSignUp, 'link' is used for email link verification
        signUpVerificationMethod: 'code', // 'code' | 'link'
        loginWith: {
          // OPTIONAL - Hosted UI configuration
          oauth: {
            domain: 'your_cognito_domain',
            scopes: [
              'email',
              'profile',
              'openid',
              'aws.cognito.signin.user.admin'
            ],
            redirectSignIn: ['/'],
            redirectSignOut: ['/'],
            responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
          }
        }
      }
    }
});

async function handleUpdateUserAttribute(attributeKey, value) {
try {
    const output = await updateUserAttribute({
    userAttribute: {
        attributeKey,
        value
    }
    });
} catch (error) {
    console.log(error);
}
}

function UpdateNameForm() {
    const [name, setName] = useState('');
  
    const handleSubmit = async (event) => {
      event.preventDefault(); // Prevent the default form submission behavior
      await handleUpdateUserAttribute('name', name);
      window.location.reload();
      // After calling the update function, you might want to clear the form or give feedback to the user
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nameInput">Name:</label>
          <input
            id="nameInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Update Name</button>
      </form>
    );
  }

export default UpdateNameForm;