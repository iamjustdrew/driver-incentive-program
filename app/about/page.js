import * as React from 'react';
import { Typography, Container } from '@mui/material';
import Navigation from "../components/navbar";
import SpecificDataFetcher from "../components/about"

export default function About() {
  return (
    <React.Fragment>
      <Navigation />
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Driver Incentive Program
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          The Driver Incentive Program not only rewards truck drivers for their commitment to safe driving practices but also offers sponsors 
          a unique platform to promote their products and services. For drivers, it translates into tangible rewards and recognition for their professionalism 
          and dedication to safety. For sponsors, it provides an opportunity to contribute to road safety while gaining visibility and engagement within the trucking community. 
          This symbiotic relationship fosters a culture of safety and mutual benefit, enhancing the overall driving environment.
        </Typography>

        <SpecificDataFetcher />
      </Container>
    </React.Fragment>
  );
}