import React from 'react';
import { Container, Grid, Typography, Paper, Box } from '@mui/material';
import Navbar from './components/navbar';

export default function HeroWithDescription() {
  return (
    <>
        <Navbar></Navbar>
        <Box
        sx={{
            height: '80vh',
            background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/static/images/team04-home-hero.webp') center center`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            }}
        >
        <Typography sx={{textShadow: '2px 4px 3px rgba(0,0,0,0.5)'}} variant="h1">Start earning rewards today</Typography>
      </Box>
      <Container>
        <Grid container spacing={4} sx={{ pt: 8, pb: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h2" gutterBottom>The Driver Incentive Program</Typography>
            <Typography paragraph>
              The Driver Incentive Program not only rewards truck drivers for their commitment to safe driving practices but also offers sponsors a unique platform to promote their products and services. For drivers, it translates into tangible rewards and recognition for their professionalism and dedication to safety. For sponsors, it provides an opportunity to contribute to road safety while gaining visibility and engagement within the trucking community. This symbiotic relationship fosters a culture of safety and mutual benefit, enhancing the overall driving environment.
            </Typography>
            <Typography paragraph>
              A win-win for both drivers and sponsors, this program elevates road safety standards while promoting product visibility and community engagement.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3}>
              <Box
                component="img"
                sx={{
                  width: '100%', // Use 100% width for responsiveness
                  height: 'auto', // Maintain aspect ratio
                  borderRadius: '10px'
                }}
                src="/static/images/catalog-on-iphone.webp"
                alt="Preview of Catalog on an iPhone"
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
