'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Grid, Container, Box, TextField, Button, CardActions, Checkbox } from '@mui/material';
import Navigation from "../components/navbar";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { getCurrentUser } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { Suspense } from 'react'

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

async function checkUserLoginStatus() {
  try {
    await getCurrentUser();
    return true; // User is logged in
  } catch (err) {
    return false; // User is not logged in
  }
}

const MovieCard = ({ artworkUrl100, trackName, artistName, trackPrice, onSelect, movieId }) => {
  return (
    <Card sx={{ maxWidth: 345, position: 'relative' }}>
      <CardMedia
        component="img"
        height="140"
        image={artworkUrl100}
        alt={trackName}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {trackName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {artistName}
        </Typography>
        <Typography variant="body1">
          Points: {trackPrice}
        </Typography>
      </CardContent>
      <CardActions sx={{ paddingBottom: '16px' }}>
        <Checkbox
        />
        <Button variant="contained" color="primary" onClick={() => onSelect(movieId)}>
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
};

const MovieList = (searchParams) => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const { searchParams: { company } } = searchParams;
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (userId) {  // Ensure userId is not empty
      fetchPoints();
    }
  }, [userId]);

  useEffect(() => {
    const verifyAndFetchData = async () => {
      try {
        const loggedIn = await checkUserLoginStatus();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          const userAttributes = await fetchUserAttributes();
          const userId = userAttributes.sub;
          setUserId(userId);

          await fetchData(); // Assumes this function doesn't depend on the completion of fetchUserAttributes
        }
      } catch (error) {
        console.error('Error during verification and data fetching:', error);
      } finally {
        setIsLoading(false); // Indicate loading is complete
      }
    };

    verifyAndFetchData();
  }, []);

  const fetchData = async () => {
    const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/catalog/${company}`);
    const data = await response.json();
    setMovies(data.items);
  };

  const fetchPoints = async () => {
    if (!userId) return;  // Additional guard to ensure userId is present
    try {
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/points/${userId}?sponsor=${company}`);
      const data = await response.json();
      setPoints(data.Balance);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const handleSelectMovie = (movieId) => {
    const selectedMovie = movies.find(movie => movie.id === movieId);
    if (selectedMovie && !cartItems.find(item => item.id === movieId)) {
      setCartItems(prevItems => [...prevItems, selectedMovie]);
    }
  };
  
  const isMovieSelected = (id) => {
    return selectedMovies.includes(id);
  };
  

  const totalPoints = cartItems.reduce((acc, item) => acc + Number(item.pointValue), 0);

  const handleBuyNow = async () => {
    if (totalPoints > points) {
      alert("Not enough points to complete the purchase.");
      return;
    }
  
    const newPoints = points - totalPoints;
  
    try {
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/points/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Balance: newPoints, SponsorID: company }),
      });
  
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to update points: ${response.status} ${errorBody}`);
      }
  
      setPoints(newPoints); // Update local state to reflect the new balance
      setCartItems([]); // Clear the cart after purchase
      alert("Purchase confirmed!");

      //

    } catch (error) {
      console.error('Error updating points:', error);
      alert(`Error completing purchase: ${error.message}`);
    }
  };  
  

  return (
    <>
      <Navigation />
      {isLoading ? (
        <Typography variant="h5" align="center" marginTop="20px">Loading...</Typography>
        ) : isLoggedIn ? (
        <Container sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontSize: '54px' }}>
            Catalog
          </Typography>
          <Card display="flex" sx={{ textAlign: 'center', mb: 4, fontSize: '54px' }}>
            <CardContent>
              <Suspense fallback={<Typography>Loading...</Typography>}>
                <Typography variant="body2" color="text.secondary" >
                  Catalog Sponsor: {company}
                </Typography>
              </Suspense>
              <Suspense fallback={<Typography>Loading...</Typography>}>
                <Typography variant="body1">
                  Balance: {points} points
                </Typography>
              </Suspense>
            </CardContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>Your Cart</Typography>
              {cartItems.length > 0 ? (
                <>
                  <Grid container spacing={2}>
                    {cartItems.map((item, index) => (
                      <Grid item key={index} xs={12} sm={6} md={4}>
                        <Typography>{item.productName} - {item.pointValue} Points</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="h6">Total Points: {totalPoints}</Typography>
                    <Button variant="contained" color="primary" onClick={handleBuyNow}>
                      Buy Now
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography>No items in cart.</Typography>
              )}
            </Box>
          </Card>
          <Box display="flex" justifyContent="center" alignItems="center" mb={4}>
          <TextField
            label="Search..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchData()}
            sx={{
              mr: 2,
              width: '60%',
              maxWidth: 500,
              '.MuiOutlinedInput-root': {
                color: 'blue', // Changes the text color
                '& fieldset': {
                  borderColor: 'blue', // Default border color
                },
                '&:hover fieldset': {
                  borderColor: 'lightblue', // Border color on hover
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'darkblue', // Border color when focused
                },
              },
              '.MuiInputLabel-root': { // Label color
                color: 'blue', 
              },
              '.MuiInputLabel-root.Mui-focused': { // Label color when focused
                color: 'darkblue',
              },
            }}
        />
          <Button variant="contained" onClick={fetchData} sx={{ height: '56px' }}>
            Search
          </Button>
        </Box>
        <Grid container spacing={2}>
          { movies.length > 0 ? (
            movies.map((movie, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <MovieCard
                  artworkUrl100={movie.artworkUrl}
                  trackName={movie.productName}
                  artistName={movie.artistName}
                  trackPrice={movie.pointValue}
                  movieId={movie.id}
                  onSelect={() => handleSelectMovie(movie.id)}
                />
              </Grid>
            ))
          ) : (
            <Typography variant="body1">No items found.</Typography>
          )
          }
        </Grid>
      </Container>
      ) : (
        // Optionally, render something specific for non-logged in users or redirect
        <Typography variant="h5" align="center" marginTop="20px">
          Please log in to view this page.
        </Typography>
      )
      }
    </>
  );
};

export default MovieList;
