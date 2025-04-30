'use client'

import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, TextField, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button } from '@mui/material';
import Navigation from "../components/navbar";
import { Auth, Amplify } from 'aws-amplify';
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
  const [drivers, setDrivers] = useState([]); //
  const [points, setPoints] = useState(0);
  const [transactionType, setTransactionType] = useState('add'); // 'add' or 'subtract'
  const [reason, setReason] = useState('');
  const [globalPoints, setGlobalPoints] = useState('');
  const [globalReason, setGlobalReason] = useState('');
  const [selectedUserPoints, setSelectedUserPoints] = useState(0);
  const [userSponsors, setUserSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [userID, setUserID] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [pointPValue, setPointValue] = useState('');
  const [pointPBalance, setPointBalance] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        
        
        setUserID(userAttributes.sub);
        setUserRole(userAttributes['custom:user_role'] || null);
        //setUserCompany(userAttributes['custom:company'] || null);
        //setUserID(userId);
        //setUserRole(userRole);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchUserData();
  }, []);


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


  // Function to fetch drivers
  useEffect(() => {
    async function fetchDrivers() {
      try {
        const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/login`);
        const data = await response.json();
        setDrivers(data.login.Users);
      } catch (error) {
        console.error('Failed to fetch drivers:', error);
      }
    }

    fetchDrivers();
  }, []);

  const fetchUserPoints = async (userId, sponsor) => {
    try {
      const url = `https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/points/${userId}?sponsor=${sponsor}`;
      

      const response = await fetch(url);
      
        // Handling the response if the points are not found
        if (!response.ok) {
          if (response.status === 404) {  // Assuming 404 means no points data found
              console.log("No points found for this sponsor, setting to 0.");
              setSelectedUserPoints(0);
          } else {
              throw new Error('Failed to fetch points');
          }
      } else {
          const data = await response.json();
          setSelectedUserPoints(data.Balance || 0);  // Default to 0 if undefined
      }
  } catch (error) {
      console.error('Failed to fetch points:', error);
      setSelectedUserPoints(0); // Reset or handle error even if other errors occur
  }
  };
  

  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/login/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Assuming `data` is the user object directly if endpoint matches exactly what you need
      const sponsorAttr = data.UserAttributes.find(attr => attr.Name === "custom:company");
  
      // Check if sponsor attribute exists and has a value before splitting
      const sponsors = sponsorAttr && sponsorAttr.Value ? sponsorAttr.Value.split(',').map(s => s.trim()) : [];
      
      setUserSponsors(sponsors);
      setSelectedUserPoints(data.points);  // Assuming `points` are part of this API's response
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUserSponsors([]);
      setSelectedUserPoints(0);
    }
  };
  




  const handleGlobalPointsSubmission = async (event) => {
    event.preventDefault();
    const apiEndpoint = '/path-to-your-api-that-awards-points-globally';

    const payload = {
        points: Number(globalPoints),
        reason: globalReason,
    };

    try {
        // Here, call your API endpoint with the payload
        // This API should handle updating points for all drivers in your system
        // const response = await fetch(apiEndpoint, { method: 'POST', body: JSON.stringify(payload), ... });
        // Handle the response here...

        alert('Points successfully awarded to all drivers!');
        // Reset the form
        setGlobalPoints('');
        setGlobalReason('');
    } catch (error) {
        console.error('An error occurred while awarding points:', error);
        alert('Failed to award points.');
    }
};

const handleDriverChange = async (event) => {
  const userId = event.target.value;
  setDriverId(userId);
  await fetchUserInfo(userId);
};

const handleSponsorChange = async (event) => {
  const newSponsor = event.target.value;
  setSelectedSponsor(newSponsor);
  if (driverId && newSponsor) {
    console.log(`Fetching points for driver ID: ${driverId} with sponsor: ${newSponsor}`);
    await fetchUserPoints(driverId, newSponsor);
  }
};

const handlePointsSubmission = async (event) => {
  event.preventDefault();


  // Calculate the new balance based on the transaction type
// Parse points as integer to ensure it's not a string from input
const pointValue = parseInt(points, 10);
const newBalance = transactionType === 'add' 
                    ? selectedUserPoints + pointValue
                    : selectedUserPoints - pointValue;
  const apiEndpoint = `https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/points/${driverId}?sponsor=${selectedSponsor}`;



  // Prepare the payload
  const payload = {
    Balance: newBalance,
    SponsorID: String(selectedSponsor)
  };


  console.log(`driverID ${driverId}`);
  console.log(`sponsor ${selectedSponsor}`);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Failed to update points: ${response.statusText}`);

    // If the request is successful, you might want to update the state or alert the user
    const responseData = await response.json();

    console.log(responseData);

    setSelectedUserPoints(responseData.Balance); // or any other data returned by your API
    alert('Points successfully updated! New Balance: ', responseData.Balance );

    console.log(`logged by ${userID}`);

    // Log the point change
    logPointChange({
      value: pointValue,
      total: newBalance
    });


    
    console.log("newBalance: ", newBalance);

    window.location.reload();
  } catch (error) {
    console.error('An error occurred while updating points:', error);
    alert('Failed to update points. ' + error.message);
  }
};



const logPointChange = async ({ value, total }) => {
  const logEndpoint = "https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/logs";
  const eventType = transactionType === 'add' ? "Point Reward" : "Point Penalty";

  console.log("value: ", value.toString(), " total: ", total.toString());

  setPointBalance(total);
  setPointValue(value);

  console.log("pvalue: ", value.toString(), "ptotal: ", total.toString());

  try {
    const response = await fetch(logEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        {
          loggedByUsername: userID,
          loggedByRole: userRole,
          subjectUsername: driverId,
          subjectRole: "Driver",
          changer: userID,
          value: value.toString(),
          total: total.toString(),
          eventType: eventType,
          message: reason,
          ipAddress: "192.168.1.1"
        }

      )
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to log points change: ${response.statusText}. Response Body: ${errorBody}`);
    }
    console.log("Point change logged successfully");
  } catch (error) {
    console.error("Error logging point change:", error);
  }
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
                      <TextField
                        select
                        label="Driver ID"
                        value={driverId}
                        onChange={handleDriverChange}
                        required
                      >
                        {drivers.map((driver) => (
                          <MenuItem key={driver.Username} value={driver.Username}>
                            {driver.Attributes.find(attr => attr.Name === "name")?.Value || 'Unknown'} 
                          </MenuItem>
                        ))}
                      </TextField>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                      <TextField
                        select
                        label="Sponsor"
                        value={selectedSponsor}
                        onChange={handleSponsorChange}  // Updated to new handler
                        required
                      >
                        {userSponsors.length > 0 ? (
                          userSponsors.map((sponsor, index) => (
                            <MenuItem key={index} value={sponsor}>
                              {sponsor}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No Sponsors Available</MenuItem>
                        )}
                      </TextField>
                    </FormControl>



                    
                    <TextField
                        label="Points"
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        margin="normal"
                        required
                    />

                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Current Points: {selectedUserPoints}
                    </Typography>


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

                <Box component="form" onSubmit={handleGlobalPointsSubmission} sx={{ mt: 5 }}>
                    <Typography variant="h6" gutterBottom>
                        Award Points to All Drivers
                    </Typography>
                    <TextField
                        label="Points to Award"
                        type="number"
                        value={globalPoints}
                        onChange={(e) => setGlobalPoints(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Reason for Award"
                        value={globalReason}
                        onChange={(e) => setGlobalReason(e.target.value)}
                        margin="normal"
                        fullWidth
                        multiline
                        rows={2}
                        required
                    />
                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                        Award Points
                    </Button>
                </Box>
            </Container>
        </ThemeProvider>
    </>
  );
};