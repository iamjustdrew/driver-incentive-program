'use client'

import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Link from 'next/link'
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import Navigation from "../components/navbar";
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_QajwK3NHL',
      userPoolClientId: '5ubn7bfsmol0d6tsjh0rrcjd35',
      identityPoolId: 'us-east-1:95eb17cc-f22a-428e-ab53-f7d12b13a00c',
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: 'your_cognito_domain',
          scopes: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
          redirectSignIn: ['/'],
          redirectSignOut: ['/'],
          responseType: 'code'
        }
      }
    }
  }
});

async function checkUserLoginStatus() {
  try {
    await getCurrentUser();
    setIsLoggedIn(true);
  } catch (err) {
    setIsLoggedIn(false);
  }
}

const Apply = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [userID, setUserID] = useState('');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: ''
  });

  useEffect(() => {
    async function fetchAndSetUserInfo() {
      try {
        const userAttributes = await fetchUserAttributes();
        if (userAttributes && userAttributes.sub) {
          setUserID(userAttributes.sub);
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    }
    fetchAndSetUserInfo();
    checkUserLoginStatus();
    fetchCompanies();
  }, []);

  async function checkUserLoginStatus() {
    try {
      await getCurrentUser();
      setIsLoggedIn(true);
    } catch (err) {
      setIsLoggedIn(false);
    }
  }

  async function fetchCompanies() {
    const response = await fetch('https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login/companies');
    const data = await response.json();
    setCompanies(data.companies);
  }

  const handleChange = (event) => {
    setFormState({
      ...formState,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const apiUrl = `https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/applications?id=${userID}&sponsor=${formState.company}`;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      });
      const responseData = await response.json();
      alert('Application submitted successfully!');
      console.log(responseData);
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application.');
    }
  };

  return (
    <>
      <Navigation />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        {!isLoggedIn ? (
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Please create an account or log in to get started!
              </Typography>
              <Button variant="contained" color="primary">
                <Link href="/profile" style={{ textDecoration: 'none', color: 'white' }}>
                  Login/Create Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Apply to a sponsor today
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Company</InputLabel>
                  <Select
                    name="company"
                    value={formState.company}
                    onChange={handleChange}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default Apply;
