'use client'

import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button, InputLabel, Select, MenuItem } from '@mui/material';
import Navigation from "../components/navbar";
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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


const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

async function checkUserLoginStatus() {
  try {
    await getCurrentUser();
    return true; // User is logged in
  } catch (err) {
    return false; // User is not logged in
  }
}

export default function pointDashboard() {

  const [loggedin, setLoggedin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [driverId, setDriverId] = useState('');
  const [points, setPoints] = useState(0);
  const [transactionType, setTransactionType] = useState('add'); // 'add' or 'subtract'
  const [reason, setReason] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [pointValue, setPointValue] = useState('');
  const [frequency, setFrequency] = useState('');
  const [company, setCompany] = useState('');
  const [drivers, setCoDrivers] = useState([]);


  useEffect(() => {
    const updateLoginStatus = async () => {
      const isUserLoggedIn = await checkUserLoginStatus();
      setLoggedin(isUserLoggedIn);
      if (isUserLoggedIn) {
        const attributes = await fetchUserAttributes();
        setUserRole(attributes['custom:user_role'] || null);
        setCompany(attributes['custom:company']);

          // Ensure `setDrivers` is called with the right company
        if (attributes['custom:company']) {
          setDrivers(attributes['custom:company']); // Pass company to `setDrivers`
        }
      }
    };

    updateLoginStatus();
  }, []);

  async function setDrivers(company) {
    const response = await fetch('https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login');
    const data = await response.json();
    const users = data.login.Users;

    const drivers = users.filter(user => {
        const userRole = user.Attributes.find(attr => attr.Name === "custom:user_role")?.Value === "Driver";
        const userCompany = user.Attributes.find(attr => attr.Name === "custom:company")?.Value.includes(company);

        return userRole && userCompany;
    });

    setCoDrivers(drivers);
  }

  const handlePointsSubmission = async (event) => {
    event.preventDefault();  // Prevent default form submission behavior
    try {
        // Fetch current points balance
        const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/points/${driverId}?sponsor=${company}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        let currentPoints = data.Balance;

        // Adjust points based on the form input
        const pointAdjustment = parseInt(points);
        if (transactionType === 'add') {
            currentPoints += pointAdjustment;
        } else if (transactionType === 'subtract') {
            currentPoints -= pointAdjustment;
        }

        // Update state with the new points value
        setPoints(currentPoints);

        // Prepare the body for the PATCH request
        const patchBody = {
            Balance: currentPoints,
            SponsorID: company
        };

        // Send the PATCH request to update the balance
        const patchResponse = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/points/${driverId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchBody)
        });

        if (!patchResponse.ok) {
            throw new Error(`HTTP error! status: ${patchResponse.status}`);
        }

        // Optionally, handle the response from the PATCH request
        const updatedData = await patchResponse.json();
        console.log("Updated points data:", updatedData);
        alert(`Points successfully updated! New current point value: ${currentPoints}`);
    } catch (error) {
        console.error("Error updating points: ", error);
        alert('Failed to update points due to an error.');
    }
};
  
  const handleEventSubmit = (event) => {
    const apiEndpoint = "make-new-api-endpoint";
    event.preventDefault();
    

    // call API to create the new rule here, will just output this to console in meantime
    console.log({ ruleName, pointValue, frequency });

  };

  return (
    <>
        <Navigation></Navigation>
        <ThemeProvider theme={darkTheme}>
            <Container>
                <Typography variant="h3" gutterBottom align="center" sx={{ width: '100%', marginTop: 2, marginBottom: 2 }}>
                    Point Management Dashboard
                </Typography>

                <Box component="form" onSubmit={handlePointsSubmission} >
                    <Typography variant="h6" gutterBottom>
                        Adjust Points for a Driver
                    </Typography>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="driver-select-label">Driver Email</InputLabel>
                      <Select
                        labelId="driver-select-label"
                        id="driverId-select"
                        value={driverId}
                        label="Driver"
                        onChange={(e) => setDriverId(e.target.value)}
                      >
                        {drivers.map((driver, index) => (
                          <MenuItem key={index} value={driver.Username}>
                            {driver.Attributes.find(attr => attr.Name === "email")?.Value || "Unnamed"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                        label="Points"
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        margin="normal"
                        required
                    />

                    <FormControl component="fieldset" margin="normal" sx={{ width: '100%', marginTop: 2, marginBottom: 2 }}>
                        <FormLabel component="legend">Transaction Type</FormLabel>
                        <RadioGroup
                        row
                        aria-label="transaction-type"
                        name="transactionType"
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                        >
                        <FormControlLabel value="add" control={<Radio />} label="Add" />
                        <FormControlLabel value="subtract" control={<Radio />} label="Subtract" />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                    label="Reason for Adjustment"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    margin="normal"
                    fullWidth
                    multiline
                    rows={4}
                    required
                    InputLabelProps={{
                        style: { color: 'white' },
                    }}
                    InputProps={{
                        style: { color: 'white' },
                    }}
                    sx={{ input: { color: 'white' }, '& .MuiInputLabel-root': { color: 'white' }, '& .MuiOutlinedInput-root': { color: 'white', borderColor: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                    />
                    <Button type="submit" variant="contained" color="primary">
                        Submit
                    </Button>
                </Box>
                
                <Typography variant="h5" gutterBottom align="center" sx={{ width: '100%', marginTop: 2, marginBottom: 2, mt: 10}}>
                    Reward Points Regularly. Create an event below
                </Typography>

                <Box component="form" onSubmit={handleEventSubmit} sx={{ mb: 5 }}>
                    <TextField
                        label="Rule Name"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Point Value"
                        type="number"
                        value={pointValue}
                        onChange={(e) => setPointValue(e.target.value)}
                        fullWidth
                        required
                    />
                    <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                        value={frequency}
                        label="Frequency"
                        onChange={(e) => setFrequency(e.target.value)}
                        required
                        >
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        {/* Add more options as needed */}
                        </Select>
                    </FormControl>
                    <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                        Create Rule
                    </Button>
                </Box>
            </Container>
        </ThemeProvider>
    </>
  );
};