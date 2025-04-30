'use client'

import { Amplify } from 'aws-amplify';
import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Navigation from "../components/navbar";
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { getCurrentUser } from 'aws-amplify/auth';
import UpdateNameForm from '../components/updateName';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Card, CardContent, Typography, Grid } from '@mui/material';

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
          redirectSignIn: ['../page.js'],
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


// consider adding sponsor and address fields
export default function Profile() {
  const [user, setUser] = useState(null);
  const [loggedin, setLoggedin] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPicture, setUserPicture] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [userID, setUserID] = useState('');
  const [checked, setChecked] = useState(false); 

  useEffect(() => {
    const intervalId = setInterval(() => {
      getCurrentUser()
        .then(currentUser => {
          setUser(currentUser);
          clearInterval(intervalId); // Clear interval once user is found
        })
        .catch(() => {
          console.log('Checking user status...');
        });
    }, 1000); // check every 1000 milliseconds (1 second)

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    checkUserLoginStatus();
  }, []);

  async function checkUserLoginStatus() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('User is not logged in');
      setUser(null);
    }
  }

  useEffect(() => {
    if (user) {
      // Fetch user attributes when user is found
      fetchAndSetUserInfo();
      setChecked(true);
    }
  }, [user]);


    async function fetchAndSetUserInfo() {
      if (user) {
        try {
          const userAttributes = await fetchUserAttributes();
          if (userAttributes && userAttributes.name) {
            setUserName(userAttributes.name);
          }
          if (userAttributes && userAttributes.email) {
            setUserEmail(userAttributes.email);
          }
          if (userAttributes && userAttributes.phone_number) {
            setUserPhone(userAttributes.phone_number);
          }
          if (userAttributes && userAttributes.picture) {
            setUserPhone(userAttributes.picture);
          }
          if (userAttributes && userAttributes.company) {
            setUserCompany(userAttributes.company);
          }
          if (userAttributes && userAttributes.sub) {
            setUserID(userAttributes.sub);
          }
          setUserRole(userAttributes['custom:user_role'] || null);
          setUserCompany(userAttributes['custom:company'] || null);

        } catch (error) {
          console.error('Error fetching user attributes:', error);
        }
      }
    }



  function handleAuthStateChange(state, data) {
    if (state === 'signedIn') {
      // User successfully signed in
      logLoginAttempt(data.username, 'Success', 'User successfully signed in.');
    } else if (state === 'signIn_failure') {
      // User sign in failed
      logLoginAttempt(data.username, 'Failure', 'User sign in failed.');
    }
  }
  
  async function logLoginAttempt(username, result, message) {
    const logData = {
      eventType: 'Login Attempt',
      username: username,
      result: result,
      message: message,
      timestamp: new Date().toISOString(),
    };
    console.log("It works!!");
    // Call your logging API
    fetch('https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    })
    .then(response => console.log('Login event logged:', response))
    .catch(error => console.error('Error logging login event:', error));
  }
  

  return (
    
    <Authenticator onStateChange={handleAuthStateChange}>
      {({ signOut, user }) => (
        <main>
          
          <Navigation />


          <Container maxWidth="sm" sx={{ mt: 1, bgcolor: 'white', pt: 2, pb: 3, minHeight: '70vh' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2, color: 'black' }}>
            {userName}'s Profile
            </Typography>
            <Box sx={{ mt: 1, color: 'black' }}>
              <h2>User Details</h2>

              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h5">User Email</Typography>
                  <Typography>{userEmail}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h5">Phone Number</Typography>
                  <Typography>{userPhone}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h5">Company</Typography>
                  <Typography>{userCompany}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h5">User Role</Typography>
                  <Typography>{userRole}</Typography>
                </CardContent>
              </Card>
            </Box>
          </Container>

        </main>
      )}
    </Authenticator>
  );
}