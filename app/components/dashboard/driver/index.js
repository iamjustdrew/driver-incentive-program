import React from 'react';
import { Card, CardContent, Typography, Grid, Container, Button } from '@mui/material';

export default function DriverComponent() {
  const driverOptions = ['View Catalogs', 'View Sponsors', 'Update Profile'];

  const navigateToCatalog = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../driver-companies';
  };

  const navigateToCompany = () => {
    // Simple navigation method; consider using Next.js or React Router for SPAs
    window.location.href = '../../../driver-companies';
  };

  return (
    <Container>
      {/* Title */}
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Welcome to your Driver Dashboard!
      </Typography>

      <Grid container spacing={2}>
        {driverOptions.map((option, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {option}
                </Typography>
                {option === 'View Catalogs' && (
                  <Button onClick={navigateToCatalog} variant="contained" style={{ marginTop: '10px' }}>
                    Go to Catalogs
                  </Button>
                )}
                {option === 'View Sponsors' && (
                  <Button onClick={navigateToCompany} variant="contained" style={{ marginTop: '10px' }}>
                    Go to Sponsor List
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
