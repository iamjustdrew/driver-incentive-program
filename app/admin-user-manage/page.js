'use client'

import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Button } from '@mui/material';
import Navigation from "../components/navbar";
import UsersTable from "../components/usersTable/admin";
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



export default function adminUserManage() {
    const [userData, setUserData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState(userData || []);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true); 
    

    const [newUser, setNewUser] = useState({
        username: '',
        name: '',
        email: '',
        company: '', 
        user_role: 'Driver', 
        temporaryPassword: 'Temppass1!' // Default password
      });

      const fetchUserData = async (currentPage) => {
        if (!hasMore) return; // Stop fetching if no more data

        setLoading(true);
        try {
            // Correct the template string syntax for dynamic currentPage in URL
            const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/second-launch/login?page=${currentPage}&limit=10`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            setUserData(prevUserData => {
                const allUsers = [...prevUserData, ...data.login.Users];
                const uniqueUsers = Array.from(new Map(allUsers.map(user => [user['Username'], user])).values()); 
                return uniqueUsers;
            });
            
            setHasMore(data.login.Users.length > 0); // Update based on the response
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchUserData(page);
    }, []); // The empty array ensures this effect runs only once on mount

    // Fetch data when page changes
    useEffect(() => {
        fetchUserData(page);
    }, [page]);


    
    useEffect(() => {
        setFilteredData(userData);
    }, [userData]);

    useEffect(() => {
        if (!searchQuery) {
        setFilteredData(userData);
        return;
        }

        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = userData.filter(user => 
        user.Attributes.some(attr => 
            attr.Value.toLowerCase().includes(lowercasedQuery)
        )
        );

        setFilteredData(filtered);
    }, [searchQuery, userData]);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelectedUsers = userData.map((user) => user.Attributes.find(attr => attr.Name === "sub").Value);
            setSelectedUsers(newSelectedUsers);
            return;
        }
        setSelectedUsers([]);
    };

    const handleCheckboxClick = (event, id) => {
        const selectedIndex = selectedUsers.indexOf(id);
        let newSelected = [];


        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedUsers, id);
        } else if (selectedIndex >= 0) {
            newSelected = selectedUsers.filter(selectedId => selectedId !== id);
        }

        setSelectedUsers(newSelected);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
      
        try {
          const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/second-launch/login/{id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Include other headers as needed, such as Authorization headers
            },
            body: JSON.stringify({
              username: newUser.username,
              name: newUser.name,
              email: newUser.email,
              company: newUser.company,
              user_role: newUser.user_role,
              temporaryPassword: newUser.temporaryPassword
            })
          });
      
          if (!response.ok) {
            const errorDetail = await response.text(); // Or response.json() if the server responds with JSON
            console.error('Server response:', errorDetail);
            throw new Error('Failed to create new user');
          }
      
          const data = await response.json();
          console.log("New user created:", data);
          window.location.reload();
          // Handle the successful response, e.g., showing a success message or updating the UI
        } catch (error) {
          console.error("Error creating new user:", error);
          // Handle errors, such as displaying an error message
        }
      };
      

    return (
    <>
        <Navigation></Navigation>
        <ThemeProvider theme={darkTheme}>
            <Container>
                <Typography variant="h3" gutterBottom align="center" sx={{ width: '100%', marginTop: 2, marginBottom: 2 }}>
                    User Management Dashboard
                </Typography>
                <TextField
                label="Search Users"
                variant="outlined"
                fullWidth
                margin="normal"
                onChange={(e) => setSearchQuery(e.target.value)}
                />
                <UsersTable 
                    userData={filteredData} 
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                    handleSelectAllClick={handleSelectAllClick}
                    handleCheckboxClick={handleCheckboxClick}
                    setUserData={setUserData}
                />
                
                <Typography variant="h3" gutterBottom align="center" sx={{ width: '100%', marginTop: 2, marginBottom: 2 }}>
                    Create a User
                </Typography>

                <Box component="form" onSubmit={handleCreateUser}>
                    <input
                    type="text"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Username"
                    />
                    <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Name"
                    />

                    {/* Add other fields as necessary */}
                    <button type="submit">Create User</button>
                </Box>
            </Container>
        </ThemeProvider>
    </>
    );

}