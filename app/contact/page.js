import * as React from 'react';
import { AppBar, Box, Toolbar, IconButton, Typography, Menu, MenuIcon, Container, Avatar, Button, Tooltip, MenuItem, AdbIcon, TextField, Link} from '@mui/material';
import Navigation from "../components/navbar";

export default function Contact() {
  //const [message, setMessage] = useState('');


  // form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = {
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value,
    };

    try {
      //endpoint for sendEmail
        const response = await fetch('https://43fezlacjh.execute-api.us-east-1.amazonaws.com/second-launch/sendEmail', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            console.log('Email sent successfully');
            // Handle success response
        } else {
            console.error('Failed to send email');
            // Handle error response
        }
    } catch (error) {
        console.error('Error:', error);
        // Handle error here
    }
};

  
  return (
    <React.Fragment>
      <Navigation />
      <Container sx={{ marginTop: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Contact The Good Driver Incentive Program
        </Typography>
        <Box>
          For Customer Support,
          <br></br>
          please email us at  
          <Link href="mailto:gdipsupport@proton.me?subject=Support Request&body=Please provide details of your issue here." className="support-email"> gdipsupport@proton.me </Link>
          <br></br>
          Call us at <Link href="tel:123-456-7890"> 123-456-7890 </Link>
        </Box>
      
      </Container>

      <Container>
        <br></br>
        Or fill out the form below
        <br></br>
        <Box component="form" noValidate sx={{ mt: 1}} >
          
          <TextField required id="contact-email" label="Email Address" type="email" autoComplete="email" placeholder="Enter your email here..." margin="normal" 
          sx={{ mt: 1, border: '1px solid white', borderRadius: '4px', backgroundColor: 'black' }}   
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: 'white' }} }/>

          <TextField required fullWidth id="contact-message" multiline label="Your Message" rows={4} placeholder="Please enter your message here..." margin="normal" 
          sx={{ mt: 1, border: '1px solid white', borderRadius: '4px', padding: '16px', backgroundColor: 'black' }}   
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { color: 'white' }}}/>

          <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }} >
            Send Message
          </Button>
        </Box>
      </Container>

    </React.Fragment>
  );
};

