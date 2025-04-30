'use client'

import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Navigation from "../components/navbar";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

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

const SponsorApplications = () => {
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [userInfo, setUserInfo] = useState(null);


  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        const userId = userAttributes.sub; // 'sub' attribute contains the Cognito ID

        const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login/companies/${userId}`);
        const data = await response.json();

        const companyValues = data.Name === "custom:company" ? data.Value.split(',') : [];
        setCompanies(companyValues);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      if (companies.length > 0) { // Ensure companies are loaded before fetching applications
        try {
          const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/applications/sponsors?id=${companies.join(',')}`);
          const data = await response.json();

          if (data.items) {
            setApplications(data.items);
          }
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      }
    };

    if (companies.length > 0) {
      fetchApplications();
    }
  }, [companies]); // Depend on companies state

  const handleDeny = async (userId, sponsor) => {
    try {
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/applications/${userId}?sponsor=${sponsor}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('HTTP status ${response.status}');
      }

      // Update the applications state to remove the denied application
      setApplications(applications.filter(app => app.user !== userId));
      alert("Application denied successfully");
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };
  
  const updateCompanyInfo = async (userId, newSponsor) => {
    try {
      // Fetch current user info
      const userInfoResponse = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login/${userId}`);
      if (!userInfoResponse.ok) {
        throw new Error(`HTTP error! Status: ${userInfoResponse.status}`);
      }
      const userInfo = await userInfoResponse.json();
  
      // Determine current company info
      const existingCompany = userInfo.UserAttributes.find(attr => attr.Name === "custom:company")?.Value;
  
      // Prepare the new company info
      let updatedCompany;
      if (existingCompany) {
        if (!existingCompany.split(',').includes(newSponsor)) {
          updatedCompany = `${existingCompany},${newSponsor}`; // Add new sponsor separated by a comma
        } else {
          updatedCompany = existingCompany; // No update needed, sponsor already included
        }
      } else {
        updatedCompany = newSponsor; // Set new sponsor if none exists
      }
  
      // Call the PATCH endpoint to update the user's company information
      const patchResponse = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "custom:company": updatedCompany
        })
      });
  
      if (!patchResponse.ok) {
        throw new Error(`HTTP error! Status: ${patchResponse.status}`);
      }
  
      console.log("Company info updated successfully!");
    } catch (error) {
      console.error("Error updating company info:", error);
    }
  };
  

  const handleApprove = async (userId, sponsor) => {
    try {
      await updateCompanyInfo(userId, sponsor);
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/applications/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "Approved",
          sponsor: sponsor
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
  
      const updatedApplications = applications.map(app => {
        if (app.user === userId) {
          return { ...app, status: "Approved" };  // Update status in the local state
        }
        return app;
      });
  
      setApplications(updatedApplications); // Update applications state
      alert("Application approved successfully");
    } catch (error) {
      console.error('Error updating application:', error);
      alert(`Failed to approve application: ${error.message}`);
    }
  };
  

  return (
    <>
      <Navigation />
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mt: 5 }}>
        Manage Your Company's Applications Below
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sponsor</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((row) => (
              <TableRow key={row.user}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="right">{row.email}</TableCell>
                <TableCell align="right">{row.sponsor}</TableCell>
                <TableCell align="right">{row.status}</TableCell>
                <TableCell align="right">
                  {row.status !== "Approved" && (
                    <>
                      <Button color="primary" onClick={() => handleApprove(row.user, row.sponsor)}>Approve</Button>
                      <Button color="secondary" onClick={() => handleDeny(row.user, row.sponsor)}>Deny</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>            
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default SponsorApplications;