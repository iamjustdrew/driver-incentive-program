'use client'

import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button'; // Import Button from MUI
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import Navigation from "../components/navbar";
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

const CompanyCards = () => {
  const [companies, setCompanies] = useState([]);

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

  return (
    <>
      <Navigation />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {companies.map((company, index) => (
          <Card key={index} sx={{ maxWidth: 275 }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {company.trim()}
              </Typography>
              {/* Wrap the Button with Next.js Link for navigation */}
              <Link href={`/driver-catalog?company=${encodeURIComponent(company.trim())}`} passHref>
                <Button 
                  variant="contained" 
                  style={{ marginTop: '10px' }}
                  component="div"
                >
                  Visit Driver Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default CompanyCards;