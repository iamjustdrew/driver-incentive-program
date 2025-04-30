'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

function SpecificDataFetcher() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `https://43fezlacjh.execute-api.us-east-1.amazonaws.com/second-launch/about_page/contact_info`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response failure');
        }
        return response.json();
      })
      .then(data => setData(data))
      .catch(error => setError(error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Filter out the object containing the desired keys
  const info = data.contact_info.find(info => info["Team Number"] || info["Sprint Number"] || info["Release Date"]);

  return (
    <Grid container spacing={2}>
      {info && (
        <>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Team Number
                </Typography>
                <Typography variant="h5" component="h2">
                  {info["Team Number"]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sprint Number
                </Typography>
                <Typography variant="h5" component="h2">
                  {info["Sprint Number"]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Release Date
                </Typography>
                <Typography variant="h5" component="h2">
                  {info["Release Date"]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default SpecificDataFetcher;
