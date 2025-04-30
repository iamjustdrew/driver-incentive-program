'use client'

import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import Link from 'next/link';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { getCurrentUser } from 'aws-amplify/auth';
import { signOut } from 'aws-amplify/auth';


const pages = ['Contact','About', 'Apply'];
const settings = ['Profile', 'Settings', 'Dashboard'];


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

export default function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const [loggedin, setLoggedin] = useState(false);

  useEffect(() => {
    const updateLoginStatus = async () => {
      const isUserLoggedIn = await checkUserLoginStatus();
      setLoggedin(isUserLoggedIn);
    };

    updateLoginStatus();
  }, []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setLoggedin(false);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };


  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          
          <Link href="/" passHref>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              Driver Incentive Program
            </Typography>
          </Link>


          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Link key={page} href={`/${page.toLowerCase()}`} passHref>
                <Button
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {page}
                </Button>
              </Link>
            ))}
          </Box>
          
          {loggedin ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Profile Picture" src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Link href={`/${setting.toLowerCase()}`} passHref>
                      <Typography textAlign="center" sx={{ textDecoration: 'none', color: 'inherit' }}>
                        {setting}
                      </Typography>
                    </Link>
                  </MenuItem>
                ))}
                <MenuItem onClick={handleLogout}>
                  <Link href={`/`} passHref>
                    <Typography textAlign="center">Logout</Typography>
                  </Link>
                </MenuItem>
              </Menu>
            </Box>
            ) : (
            <Box sx={{ flexGrow: 0 }}>
              <Link href="/profile" passHref>
                <MenuItem>
                  <Typography textAlign="center">Login</Typography>
                </MenuItem>
              </Link>
            </Box>
          )}

        </Toolbar>
      </Container>
    </AppBar>
  );
}