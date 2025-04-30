import React from 'react';
import { Card, CardContent, Typography, Grid, Container, Button } from '@mui/material';

export default function AdminComponent() {
  const adminOptions = ['Manage Users', 'Administrative Abilities', 'Reports'];

  const navigateToCatalog = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../admin-catalog';
  };

  const navigateToReports = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../admin-reports';
  };

  const navigateToPointManagement = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../admin-point-management-dashboard';
  };

  const navigateToUserManagement = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../admin-user-manage';
  };

  return (
    <Container>
        {/* Title */}
        <Typography variant="h4" component="h1" gutterBottom align="center">
        Welcome to your Admin Dashboard!
        </Typography>

        <Grid container spacing={2}>
        {adminOptions.map((option, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
                <CardContent>
                <Typography variant="h6" component="h2">
                    {option}
                </Typography>
                {option === 'Manage Users' && (
                    <Button onClick={navigateToPointManagement} variant="contained" style={{ marginTop: '10px' }}>
                      Go To Point Management Dashboard
                    </Button>
                  )}

                {option === 'Administrative Abilities' && (
                    <Button onClick={navigateToCatalog} variant="contained" style={{ marginTop: '10px' }}>
                      View Various Sponsor Catalogs
                    </Button>
                  )}

                {option === 'Reports' && (
                    <Button onClick={navigateToReports} variant="contained" style={{ marginTop: '10px' }}>
                      Report Generation
                    </Button>
                  )}

                {option === 'Manage Users' && (
                    <Button onClick={navigateToUserManagement} variant="contained" style={{ marginTop: '10px' }}>
                      Userbase Management
                    </Button>
                  )}
                </CardContent>
            </Card>
            </Grid>
        ))}
        </Grid>
    </Container>
  );
}