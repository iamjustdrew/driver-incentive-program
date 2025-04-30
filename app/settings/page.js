'use client'



import * as React from 'react';
import { useState, useEffect } from 'react'; // Add this line
import { AppBar, Box, Toolbar, Typography, Container, Button, TextField, InputAdornment, IconButton, Avatar } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Navigation from "../components/navbar";
import { FormHelperText } from '@mui/material';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { updateUserAttribute } from 'aws-amplify/auth';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { updatePassword } from 'aws-amplify/auth';

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
  

export default function Settings() {
  const [userName, setName] = useState('');
  const [userPhone, setPhone] = useState('');
  const [userEmail, setEmail] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [userID, setUserID] = useState('');


  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility  

  const [currentPassword, setCurrentPassword] = useState(''); // For the user's current password
  const [newPassword, setNewPassword] = useState(''); // For the user's desired new password

  // not implemented
  const [userPicture, setPicture] = useState(null); 
  const [profilePicPreview, setProfilePicPreview] = useState(''); // stores the image preview 
  
  useEffect(() => {
    async function fetchAndSetUserInfo() {
      try {
        const userAttributes = await fetchUserAttributes();
        if (userAttributes && userAttributes.name) {
          setName(userAttributes.name);
        }
        if (userAttributes && userAttributes.email) {
          setEmail(userAttributes.email);
          
        }
        if (userAttributes && userAttributes.phone_number) {
          setPhone(userAttributes.phone_number);
        }
        if (userAttributes && userAttributes.picture) {
          setPicture(userAttributes.picture);
        }
        if (userAttributes && userAttributes.password) {
          setPassword(userAttributes.password);
        }
        setUserRole(userAttributes['custom:user_role'] || null);
        setUserID(userAttributes.sub);

      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    }

    fetchAndSetUserInfo();
  }, []); // Empty dependency array means this runs once on component mount



  const logChange = async ( { eventType, message }) => {

    console.log(eventType);
    console.log(message);
  
    try {
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            loggedByUsername: userID,
            loggedByRole: userRole,
            subjectUsername: userID,
            subjectRole: userRole,
            changer: userID,

            eventType: eventType,
            message: message,
            ipAddress: "192.168.1.1"
          }
        )
      });
      
      console.log(response);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to log account change: ${response.statusText}. Response Body: ${errorBody}`);
      }
      console.log("info logged successfully");
    } catch (error) {
      console.error("Error logging:", error);
    }
  };

  
  // needs backend implementation????????
  const handleProfilePicChange = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (file) {
        setPicture(file);
        setProfilePicPreview(URL.createObjectURL(file)); // Create a URL for the file
    }

    //await handleUpdateUserAttribute('picture', userPicture);
};
  // needs backendimplementation????????
  const handleProfilePicSubmit = async (event) => {
    event.preventDefault();
    await handleUpdateUserAttribute('picture', userPicture);
    window.location.reload();
    // Cognito/API call to update profile picture
  };

/////////////////


  const handleUserPhoneSubmit = async (event) => {
    event.preventDefault();
  
    // Adds country code if not present
    const completePhoneNumber = userPhone.startsWith('+') ? userPhone : `+1${userPhone}`;
  
    // Parses phone number and checks if valid
    const phoneNumber = parsePhoneNumberFromString(completePhoneNumber);
  
    if (!phoneNumber || !phoneNumber.isValid()) {
      console.error('Invalid phone number format.');
      return;
    }
  
    // Formats it into E.164 format without international formatting characters
    const formattedPhoneNumber = phoneNumber.format('E.164');
  
    try {
      await handleUpdateUserAttribute('phone_number', formattedPhoneNumber);
      logChange({
        eventType: "Phone Number Update",
        message: `Phone Number updated to ${userPhone}`
      });
      console.log('Phone number updated successfully.');
      window.location.reload();
    } catch (error) {
      console.error('Error updating phone number:', error);
    }
  };

  const handleUserNameSubmit = async (event) => {
    event.preventDefault(); 
    await handleUpdateUserAttribute('name', userName);
    logChange({
      eventType: "Username Update",
      message: `Username updated to ${userName}`
    });


    
    window.location.reload();
  };   


  const handleUserEmailSubmit = async (event) => {
    event.preventDefault();
    await handleUpdateUserAttribute('email', userEmail);
    logChange({
      eventType: "Email Update",
      message: `Email updated to ${userEmail}`
    });
  };


  const evaluatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length > 5) strength += 1;
    if (password.length > 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /////////////////

  const handleCurrentPasswordChange = (event) => {
    setCurrentPassword(event.target.value);
  };
    
    
  const handleNewPasswordChange = (event) => {
    const newPass = event.target.value;
    setNewPassword(newPass);
    // Evaluate the new password's strength
    const strength = evaluatePasswordStrength(newPass);
    setPasswordStrength(strength); // Update the state with the new password's strength
  };


  const handlePasswordSubmit = async (event) => {
    event.preventDefault();


    if (!currentPassword || !newPassword) {
      console.log('Current and new passwords are required');
      return;
    }

    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      console.log("currentp: ", currentPassword, "newP: ", newPassword);
      const result = await Auth.changePassword(currentUser, currentPassword, newPassword);
      console.log('Password changed successfully');
      logChange({
        eventType: "Password Update",
        message: `Password Updated`
      });
      // Reset state or notify user of success here
      setCurrentPassword('');
      setNewPassword('');
      setPasswordStrength(null);
      window.location.reload();
    } catch (error) {
      console.error('Error changing password:', error);
      // Handle errors (e.g., incorrect current password, too weak new password)
    }
  };




      return (
        <React.Fragment>
          <Authenticator>
          <Navigation></Navigation>
  
          <Container maxWidth="sm" sx={{ mt: 1, bgcolor: 'white', pt: 2, pb: 3, minHeight: '70vh' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2, color: 'black' }}>
              User Settings
            </Typography>
            <Box sx={{ mt: 1 }}>
  
              {/* Profile Picture Section */}
              {/*<Box component="form" noValidate onSubmit={handleProfilePicSubmit} sx={{ mt: 2, mb: 2 }}>
                  {profilePicPreview && (
                      <Avatar src={profilePicPreview} sx={{ width: 100, height: 100, mb: 2 }} />
                  )}
                  <Button variant="contained" component="label" fullWidth>
                    Upload Profile Picture
                    <input type="file" hidden accept="image/*" onChange={handleProfilePicChange} />
                  </Button>
                  <FormHelperText>Choose a profile picture to represent you.</FormHelperText>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                  >
                    Save Profile Picture
                  </Button>
              </Box>
                  */}

              {/* Username Section */}
              <Box component="form" noValidate onSubmit={handleUserNameSubmit}>
                <TextField margin="normal" required fullWidth id="userName" label="User Name" name="userName" autoComplete="=name" value={userName} onChange={(e) => setName(e.target.value)} />
                <FormHelperText>Your displayed username.</FormHelperText>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Save Username
                </Button>
              </Box>

              {/* Email Section */}
              <Box component="form" noValidate onSubmit={handleUserEmailSubmit}>
                <TextField margin="normal" required fullWidth id="userEmail" label="Email Address" name="userEmail" autoComplete="=email" value={userEmail} onChange={(e) => setEmail(e.target.value)} />
                <FormHelperText>Your primary email address for notifications and login.</FormHelperText>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Submit Email
                </Button>
              </Box>


              {/* Phone Number Section */}
              <Box component="form" noValidate onSubmit={handleUserPhoneSubmit}>
                <TextField margin="normal" required fullWidth id="userPhone" label="Phone Number" name="userPhone" autoComplete="=phone" value={userPhone} onChange={(e) => setPhone(e.target.value)} />
                <FormHelperText>Your primary phone number</FormHelperText>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Save Phone 
                </Button>
              </Box>


              {/* Password Section */}
              <Box component="form" noValidate onSubmit={handlePasswordSubmit} sx={{ mt: 3 }}>
                <TextField margin="normal" required fullWidth id="currentPassword" label="Current Password" name="currentPassword" type={showPassword ? 'text' : 'password'}
                autoComplete="=current-password" value={currentPassword} onChange={handleCurrentPasswordChange}
                InputProps={{
                  endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={togglePasswordVisibility}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }} />

                <FormHelperText>Verify your current password</FormHelperText>


                {/* New Password Section */}
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="newPassword"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={togglePasswordVisibility}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <FormHelperText>
                  Password Strength: <span style={{ color: 'blue' }}>
                  {passwordStrength === null ? '' : 
                  passwordStrength <= 2 ? 'Weak' : 
                  passwordStrength <= 4 ? 'Moderate' : 'Strong'}
                  </span>
                </FormHelperText>


                <FormHelperText>Ensure your new password is strong and secure. Your new password should:.
                
                <br />
                Contains at least 1 number
                <br />
                Contain at least 1 uppercase letter
                <br />
                Contain at least 1 lowercase letter
                <br />
                Contain at least 1 special character
                
                
                </FormHelperText>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Save Password
                </Button>




              </Box>
          
  
            </Box>
          </Container>
          </Authenticator>
        </React.Fragment>
      );
  }