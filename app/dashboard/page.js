'use client'

import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import Navigation from "../components/navbar";
import AdminComponent from "../components/dashboard/admin"
import SponsorComponent from "../components/dashboard/sponsor"
import DriverComponent from "../components/dashboard/driver"
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchUserAttributes } from 'aws-amplify/auth';

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


async function checkUserLoginStatus() {
  try {
    await getCurrentUser();
    return true; // User is logged in
  } catch (err) {
    return false; // User is not logged in
  }
}

export default function Dashboard() {

  const [loggedin, setLoggedin] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const updateLoginStatus = async () => {
      const isUserLoggedIn = await checkUserLoginStatus();
      setLoggedin(isUserLoggedIn);
      if (isUserLoggedIn) {
        const attributes = await fetchUserAttributes();
        setUserRole(attributes['custom:user_role'] || null);
      }
    };

    updateLoginStatus();
  }, []);

  function RoleSpecificComponent({ userRole }) {
    if (userRole === 'Admin') {
      return <AdminComponent />;
    } else if (userRole === 'Driver') {
      return <DriverComponent />;
    } else if (userRole === 'Sponsor') {
      return <SponsorComponent />;
    } else {
      return <Typography variant="body1" align="center">
      You do not have an associated role. Please contact an administrator.
    </Typography>;
    }
  }
  
  return (
    <>
      <Navigation></Navigation>
        <div>
        {loggedin ? '' : 'You are not logged in'}
      </div>
      <br></br>
      <RoleSpecificComponent userRole={userRole} />
    </>
  );
};