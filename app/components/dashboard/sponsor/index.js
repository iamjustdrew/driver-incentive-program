'use client'

import React from 'react';
import { useEffect, useState } from 'react';
import {Card, CardContent, Typography, Grid, Container, Button } from '@mui/material';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

export default function SponsorComponent() {
  const sponsorOptions = ['Manage Drivers', 'Manage Catalog', 'Update Business'];
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

  const navigateToCatalog = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../sponsor-catalog';
  };

  const navigateToPointManagement = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../sponsor-point-management-dashboard';
  };

  const navigateToUserManagement = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../sponsor-user-manage';
  };


  const navigateToApplications = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../sponsor-applications';
  };

  const navigateToReports = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../sponsor-reports';
  };

  const viewCatalogAsDriver = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = `../../../driver-catalog?=${companies}`;
  };


  return (
    <Container>
        {/* Title */}
        <Typography variant="h4" component="h1" gutterBottom align="center">
        Welcome to your Sponsor Dashboard!
        </Typography>

        <Grid container spacing={2}>
        {sponsorOptions.map((option, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
                <CardContent>
                  <Typography variant="h6" component="h2">
                    {option}
                  </Typography>

                  {option === 'Manage Drivers' && (
                    <>
                      <Button onClick={navigateToApplications} variant="contained" style={{ marginTop: '10px' }}>
                      Manage Driver Applications
                      </Button>
                      <Button onClick={navigateToPointManagement} variant="contained" style={{ marginTop: '10px' }}>
                      Go To Point Management Dashboard
                      </Button>
                    </>
                  )}

                {option === 'Manage Drivers' && (
                    <Button onClick={navigateToReports} variant="contained" style={{ marginTop: '10px' }}>
                      Report Generation
                    </Button>
                  )}

                  {option === 'Update Business' && (
                    <Button onClick={navigateToUserManagement} variant="contained" style={{ marginTop: '10px' }}>
                      Manage Company Accounts
                    </Button>
                  )}

                  {option === 'Manage Catalog' && (
                    <>
                    <Button onClick={navigateToCatalog} variant="contained" style={{ marginTop: '10px' }}>
                      Go to Catalogs
                    </Button>
                    <Button onClick={viewCatalogAsDriver} variant="contained" style={{ marginTop: '10px' }}>
                      View your Catalog as a Driver
                    </Button>
                  </>
                  )}
                </CardContent>
            </Card>
            </Grid>
        ))}
        </Grid>
    </Container>
  );
}