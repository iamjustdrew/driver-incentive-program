'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Typography, Container, Box, Checkbox, TextField, Button, Table, InputLabel, FormControl, TableBody, MenuItem, TableCell, Select, TableContainer, TableHead, TableRow, Paper  } from '@mui/material';
import Navigation from "../components/navbar";
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Authenticator } from '@aws-amplify/ui-react';
import { DatePicker} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function App({ children }) {
    return <LocalizationProvider dateAdapter={AdapterDateFns}>{children}</LocalizationProvider>;
  }

const exportPDF = () => {
    const input = document.getElementById('log-table');
    const originalStyle = input.style.cssText;
    const originalParentStyle = input.parentElement.style.cssText;
  
    // Temporarily adjust styles to expand the table
    input.style.overflow = 'visible';
    input.style.maxHeight = 'none';
    input.parentElement.style.overflow = 'visible';
  
    html2canvas(input, {
      scale: 1,  // Adjust scale here, try reducing to 0.95 or increasing to fit your content
      onclone: (document) => {
        const clonedTable = document.getElementById('log-table');
        clonedTable.style.overflow = 'visible';
        clonedTable.style.maxHeight = 'none';
      },
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
  
      const imgWidth = 297;  // A4 landscape width in mm
      let imgHeight = canvas.height * imgWidth / canvas.width;  // Calculate the image height preserving the aspect ratio
  
      let heightLeft = imgHeight;
  
      // Adjust position to vertically center if needed
      let position = (210 - imgHeight) / 2;  // 210mm is the height of an A4 page in landscape
  
      pdf.addImage(imgData, 'PNG', 0, position > 0 ? position : 0, imgWidth, imgHeight);
  
      pdf.save('download.pdf');
  
      // Reset styles
      input.style.cssText = originalStyle;
      input.parentElement.style.cssText = originalParentStyle;
    });
  };

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




const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

async function checkUserLoginStatus() {
  try {
    await getCurrentUser();
    return true; // User is logged in
  } catch (err) {
    return false; // User is not logged in
  }
}



export default function adminReports() {
    const [userData, setUserData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [filteredData, setFilteredData] = useState(userData || []);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [logData, setLogData] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true); 
    const [error, setError] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedSubjectUsername, setSelectedSubjectUsername] = useState('');
    const [userCompany, setUserCompany] = useState('');
    const [userCompanyMap, setUserCompanyMap] = useState({});

    const fetchUserData = async (currentPage) => {
        if (!hasMore) return; // Stop fetching if no more data

        setLoading(true);
        try {
            // Correct the template string syntax for dynamic currentPage in URL
            const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login?page=${currentPage}&limit=10`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            setUserData(prevUserData => {
                const allUsers = [...prevUserData, ...data.login.Users];
                const uniqueUsers = Array.from(new Map(allUsers.map(user => [user['Username'], user])).values()); 
                return uniqueUsers;
            });
            
            setHasMore(data.login.Users.length > 0); // Update based on the response
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setLoading(false);
        }
    };

    const fetchLogData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/6thStageLogging/logs`);
            if (!response.ok) {
                throw new Error('Network response was not ok for fetching logs');
            }
            const data = await response.json();
            setLogData(data); // Assuming the API returns an object with a 'logs' array
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch log data:', error);
            setError('Failed to load log data.'); // Display error message to users
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
    async function fetchCurrentUserCompany() {
        try {
            
            const userAttributes = await fetchUserAttributes();

            setUserCompany(userAttributes['custom:company'] || null);
            console.log("usercompany is ", userCompany);
    
          } catch (error) {
            console.error('Error fetching user attributes:', error);
          }  
    }

    fetchCurrentUserCompany();
}, []);

    // Initial fetch
    useEffect(() => {
        fetchUserData(page);
    }, []); // The empty array ensures this effect runs only once on mount

    // Fetch data when page changes
    useEffect(() => {
        fetchUserData(page);
    }, [page]);
    
    // Fetch log data on component mount
    useEffect(() => {
        fetchLogData();
    }, []);

    useEffect(() => {
        setFilteredData(userData);
    }, [userData]);

    useEffect(() => {
        // This will re-compute filteredLogData whenever selectedSubjectUsername changes.
        // No changes needed here if you're using useMemo as shown above.
    }, [selectedSubjectUsername]);

    
    useEffect(() => {
        const filterData = () => {
          let filtered = userData;
      
          if (selectedUser) {
            filtered = userData.filter(user => user.Username === selectedUser);
          } else if (roleFilter) {
            filtered = userData.filter(user =>
              user.Attributes.some(attr =>
                attr.Name === "custom:user_role" && attr.Value === roleFilter
              )
            );
          }
      
          setFilteredData(filtered);
        };
      
        filterData();
      }, [selectedUser, roleFilter, userData]);
      
    const visibleUsers = roleFilter
    ? userData.filter(user =>
        user.Attributes.some(attr =>
            attr.Name === "custom:user_role" && attr.Value === roleFilter
        ))
    : userData;  

    const exportCSV = () => {
        // Define CSV column headers
        const headers = ["Date", "Time", "Subject Username", "Subject Role", "Logged by Username", "Logger Role", "Event Type", "Message/Reason", "IP Address"];
        // Create CSV content
        const csvContent = [
            headers.join(","), // Header row first
            ...filteredLogData.map(log => [
                log.date,
                new Date(log.timestamp).toLocaleTimeString(),
                usernameToNameMap[log.subjectUsername] || log.subjectUsername,
                log.subjectRole,
                usernameToNameMap[log.loggedByUsername] || log.loggedByUsername,
                log.loggedByRole,
                log.eventType,
                log.message,
                log.ipAddress
            ].join(","))
        ].join("\n");
    
        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
    
        // Create a link and trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'log_data.csv'); // Set the file name
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    }
    

    const usernameToNameMap = useMemo(() => {
        const map = {};
        userData.forEach(user => {
            map[user.Username] = user.Attributes.find(attr => attr.Name === "name")?.Value || 'Unknown';
        });
        return map;
    }, [userData]);

    const filteredLogData = useMemo(() => {
        return logData.filter(log => {
            const logDate = new Date(log.date); // Assuming date is in a parseable format
            const start = startDate ? new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0)) : new Date(-8640000000000000);
            const end = endDate ? new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)) : new Date(8640000000000000);
    
            // Check if the log's date is within the selected range
            const isDateValid = logDate >= start && logDate <= end;
            if (!isDateValid) return false;
    
        // Check for selected subject username filter
        const isUsernameMatch = !selectedSubjectUsername || log.subjectUsername === selectedSubjectUsername;



            // Adjust filtering for "Point Changes"
            if (eventTypeFilter === "Point Changes") {
                return isUsernameMatch && (log.eventType === "Point Transaction" || log.eventType === "Point Reward" || log.eventType === "Point Penalty");
            }
    
            // Continue with regular filtering if another filter is selected
            return isUsernameMatch && (eventTypeFilter ? log.eventType === eventTypeFilter : true);
        });
    }, [logData, startDate, endDate, eventTypeFilter, selectedSubjectUsername]);
    
    
    useEffect(() => {
        // Building a map of usernames to their company
        const companyMap = userData.reduce((acc, user) => {
            const companyAttr = user.Attributes.find(attr => attr.Name === "custom:company");
            if (companyAttr) {
                acc[user.Username] = companyAttr.Value;
            }
            return acc;
        }, {});

        setUserCompanyMap(companyMap);
    }, [userData]);
    
    useEffect(() => {
        const filterLogsByCompany = () => {
            const filteredLogs = logData.filter(log => {
                const logUserCompany = userCompanyMap[log.subjectUsername];
                return logUserCompany && logUserCompany === userCompany;
            });
            setFilteredData(filteredLogs);
        };

        if (userCompany && Object.keys(userCompanyMap).length > 0) {
            filterLogsByCompany();
        }
    }, [userCompany, userCompanyMap, logData]);

    return (
    <>
        <Navigation></Navigation>
        <ThemeProvider theme={darkTheme}>
            <Container>
                <Typography variant="h3" gutterBottom align="center">
                    Sponsor User Audit Log
                </Typography>
                {loading && <Typography>Loading data...</Typography>}
                {error && <Typography color="error">{error}</Typography>}

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        textField={(params) => <TextField {...params} />}
                    />
                    <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={setEndDate}
                        textField={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>

                <Select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    displayEmpty
                    fullWidth
                    inputProps={{ 'aria-label': 'Without label' }}
                >
                    <MenuItem value="Point Changes">All Point Changes</MenuItem>
                    <MenuItem value="Point Transaction">Point Transaction</MenuItem>
                    <MenuItem value="Point Reward">Point Reward</MenuItem>
                    <MenuItem value="Point Penalty">Point Penalty</MenuItem>
                </Select>
                
                <FormControl fullWidth>
                    <InputLabel id="subject-username-select-label">Subject Username</InputLabel>
                    <Select
                        labelId="subject-username-select-label"
                        value={selectedSubjectUsername}
                        onChange={(e) => setSelectedSubjectUsername(e.target.value)}
                        displayEmpty
                    >
                        <MenuItem value="">
                        </MenuItem>
                        {userData.map((user) => (
                            <MenuItem key={user.Username} value={user.Username}>
                                {user.Attributes.find(attr => attr.Name === "name")?.Value || 'Unknown'} 
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>


                <TableContainer id="log-table" component={Paper} style={{ minWidth: 650, maxHeight: '800px', overflowY: 'auto' }}>
                    <Table stickyHeader aria-label="scrollable table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Time</TableCell>
                                <TableCell>Subject Username</TableCell>
                                <TableCell>Subject Role</TableCell>
                                <TableCell>Logged by Username</TableCell>
                                <TableCell>Logger Role</TableCell>
                                <TableCell>Event Type</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Balance</TableCell>
                                <TableCell>Message/Reason</TableCell>
                                <TableCell>IP Address</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredLogData.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.date}</TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                                    <TableCell>{usernameToNameMap[log.subjectUsername] || log.subjectUsername}</TableCell>
                                    <TableCell>{log.subjectRole}</TableCell>
                                    <TableCell>{usernameToNameMap[log.loggedByUsername] || log.loggedByUsername}</TableCell>
                                    <TableCell>{log.loggedByRole}</TableCell>
                                    <TableCell>{log.eventType}</TableCell>
                                    <TableCell>{log.value}</TableCell>
                                    <TableCell>{log.total}</TableCell>
                                    <TableCell>{log.message}</TableCell>
                                    <TableCell>{log.ipAddress}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Button onClick={exportPDF} color="primary" variant="contained">
                    Export as PDF
                </Button>
                <Button onClick={exportCSV} color="secondary" variant="contained">
                    Export as CSV
                </Button>

            </Container>
        </ThemeProvider>

    </>
    );

}