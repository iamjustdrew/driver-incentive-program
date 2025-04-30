'use client'

import React, { useEffect, useState } from 'react';
import { Input, Card, CardMedia, CardContent, Typography, Grid, Container, Box, TextField, Button, CardActions, Checkbox, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Navigation from "../components/navbar";
import { Snackbar, CircularProgress } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CreateIcon from '@mui/icons-material/Create';

// card for itunes retrieval
const ItemCard = ({ artworkUrl100, trackName, artistName, trackPrice, addToCatalog}) => {
    const priceInPoints = trackPrice * 1000; // converts to arbitrary point value
    return (
        <Card sx={{ maxWidth: 345, width: '100%', mb: 2, display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          sx={{ height: 140, objectFit: 'cover' }}
          image={artworkUrl100}
          alt={trackName}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h5" component="div">
            {trackName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {artistName}
          </Typography>
          <Typography variant="body1">
            Price: ${trackPrice.toFixed(2)} | Points: {priceInPoints}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', paddingBottom: '16px' }}>
          <Checkbox />
          <Button variant="contained" color="primary" onClick={addToCatalog}>
            Add to Catalog
          </Button>
        </CardActions>
      </Card>
    );
  };

const AdminCatalog = () => {
    const [catalogItems, setCatalogItems] = useState([]);
    const [catalogId, setCatalogId] = useState(''); 
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false); // Loading state
    const [openSnackbar, setOpenSnackbar] = useState(false); //for loading spinner
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [searchCatalogTerm, setSearchCatalogTerm] = useState('');
    const [companies, setCompanies] = useState([]);
    const [dropDownLoading, setDropDownLoading] = useState(false);
    const [error, setError] = useState('');
    const [pointRatio, setPointRatio] = useState(false);

    
    // Adjust fetchCatalog to use dynamic catalogId
    const fetchCatalog = async () => {
        if (!catalogId) return; // Guard clause if catalogId is not set
        try {
            setLoading(true);
            const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/catalog/${catalogId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch catalog');
            }
            const data = await response.json();
            console.log(data);
            setCatalogItems(data.items);
            console.log(data.items);
        } catch (error) {
            console.error('Fetch Catalog Error:', error);

            // Use dummy data if fetch fails
            setCatalogItems([
                
                {
                    id: 'dummy1', // unique ID
                    catalogId: 'Amazon', // unique identifier for each seperate catalog change this later
                    productName: "One-Winged Angel", 
                    artistName: "Nobuo Uematsu",
                    type: 'music', // media type (video, movie, music)
                    genre: "Video Game Soundtrack",
                    price: "1.29",
                    pointValue: 10000, //dummy default for point value
                    createdAt: Date.now().toString(),
                    productUrl: "https://example.com",
                    artworkUrl: "https://i1.sndcdn.com/artworks-000116813882-eqi5i3-t500x500.jpg",
                    description: "One-Winged Angel from Final Fantasy VII.",
                    isEditing: false 
                },
                {
                    id: 'dummy2',
                    catalogId: 'Target',
                    productName: "Thriller",
                    artistName: "Michael Jackson",
                    type: 'music',
                    genre: "Pop",
                    price: "1.29",
                    pointValue: 1600,
                    createdAt: Date.now().toString(),
                    productUrl: "https://example.com/thriller",
                    artworkUrl: "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
                    description: "Michael Jackson's iconic hit that transformed music videos and became the best-selling album of all time.",
                    isEditing: false 
                },
                {
                    id: 'dummy3', // unique ID
                    catalogId: 'Target', // unique identifier for each seperate catalog change this later
                    productName: "Cha-La Head-Cha-La", 
                    artistName: "Hironobu Kageyama",
                    type: 'music', // media type (video, movie, music)
                    genre: "Anime Soundtrack",
                    price: "9000.01",
                    pointValue: 9001, //dummy default for point value
                    createdAt: Date.now().toString(),
                    productUrl: "https://example.com",
                    artworkUrl: "https://upload.wikimedia.org/wikipedia/en/b/b8/CHA-LA_Vinyl.PNG",
                    description: "It is best known as the first opening theme song of the Dragon Ball Z anime television series.",
                    isEditing: false 
                },
                {
                    id: 'dummy4',
                    catalogId: 'Amazon',
                    productName: "Don't Stop Believin'",
                    artistName: "Journey",
                    type: 'music',
                    genre: "Rock",
                    price: "1.29",
                    pointValue: 1300,
                    createdAt: Date.now().toString(),
                    productUrl: "https://example.com/dont-stop-believin",
                    artworkUrl: "https://upload.wikimedia.org/wikipedia/en/6/66/Don%27t_Stop_Believin%27.jpg",
                    description: "A classic hit from Journey, energizing listeners with its iconic opening keyboard riff and unforgettable chorus.",
                    isEditing: false 
                  },
                  {
                    id: 'dummy5',
                    catalogId: '1',
                    productName: "Megalovania",
                    artistName: "Toby Fox",
                    type: 'music',
                    genre: "Video Game Soundtrack",
                    price: "0.99",
                    pointValue: 1000,
                    createdAt: Date.now().toString(),
                    productUrl: "https://example.com/megalovania",
                    artworkUrl: "https://i.ytimg.com/vi/c5daGZ96QGU/maxresdefault.jpg",
                    description: "The iconic track from Undertale that plays during the battle with Sans, known for its energetic beat and widespread popularity."
                  },

            ]);
        } finally {
            setLoading(false); // Optional: hide the loading indicator
        }
    };

    // Call fetchCatalog on component mount using useEffect.
    useEffect(() => {
        fetchCatalog();
    }, [catalogId]); // ensures thisruns only once on mount.
    
    useEffect(() => {
        fetchCompanies();
      }, []);

      useEffect(() => {
        // Define a function to fetch point conversion ratio
        const fetchPointConversionRatio = async () => {
            try {
                const response = await fetch(`pointRatioEndPointHere`);
                if (!response.ok) throw new Error('Failed to fetch point conversion ratio');
                const { pointRatio } = await response.json(); // Assuming the response contains a pointRatio field
                setPointRatio(pointRatio);
            } catch (error) {
                console.error('Error fetching point conversion ratio:', error);
                setPointRatio(100); // Reset to default or show error as needed
            }
        };
    
        if (catalogId) {
            fetchPointConversionRatio();
        }
    }, [catalogId]); // Run this when catalogId changes
    

    // Handler for when point conversion ratio input changes
    const handlePointRatioChange = async (event) => {
        const updatedPointRatio = event.target.value;
        setPointRatio(updatedPointRatio); // local state change

        try {
            const response = await fetch(`apiendpointhereshouldbeupdated/${catalogId}/updatePointRatio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pointRatio: updatedPointRatio }),
            });

            if (!response.ok) throw new Error('Failed to update point conversion ratio');
            
            console.log('Point conversion ratio updated successfully');
        } catch (error) {
            console.error('Error updating point conversion ratio:', error);
            // Handle error (e.g., show error message)
        }
    };


    
    const fetchCompanies = async () => {
        setDropDownLoading(true);
        try {

            const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login`);
            if (!response.ok) throw new Error('Failed to fetch companies Error 02');


            const data = await response.json();
            console.log("API Response:", data); // Debug log
            
            const usersArray = data.login?.Users ?? [];
            console.log("Users Array:", usersArray); // Debug log


            const allCompanies = usersArray.flatMap(user =>
                (user.Attributes || [])
                    .filter(attr => attr.Name === 'custom:company')
                    .flatMap(attr => attr.Value.split(',').map(company => company.trim())) 
            );
            console.log("All Companies:", allCompanies); // Debug log


            const uniqueCompanies = [...new Set(allCompanies)];
            console.log("Unique Companies:", uniqueCompanies); // Debug log
            setCompanies(uniqueCompanies);

        } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Failed to fetch companies');
        } finally {
        setDropDownLoading(false);
        }
    };

    if (dropDownLoading) return <CircularProgress />;
    if (error) return <p>{error}</p>;

    const removeFromCatalog = (itemId) => {
        setCatalogItems(currentItems => currentItems.filter(item => item.id !== itemId));
    };


    const toggleEdit = (itemId) => {
        setCatalogItems(currentItems => currentItems.map(item => {
            if (item.id === itemId) {
                return { ...item, isEditing: !item.isEditing };
            }
            return item;
        }));
    };

    const updateCatalogItem = (itemId, newDescription, newPointValue) => {
        setCatalogItems(currentItems => currentItems.map(item => {
            if (item.id === itemId) {
                return { ...item, description: newDescription, pointValue: newPointValue, isEditing: false };
            }
            return item;
        }));
        // Optionally, make an API call to update the item in the backend
    };

    // Filter catalog items based on the search term
    const filteredCatalogItems = catalogItems.filter((item) =>
    item.productName.toLowerCase().includes(searchCatalogTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchCatalogTerm.toLowerCase()) ||
    item.artistName.toLowerCase().includes(searchCatalogTerm.toLowerCase()) ||
    item.genre.toLowerCase().includes(searchCatalogTerm.toLowerCase())
    );


    
    const columnStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        width: { xs: '100%', md: '50%' }, // Full width on small screens, half width on medium screens and up
        mb: 4, // Margin bottom for spacing
      };

    const searchiTunes = async () => {
        try {
            setLoading(true); // Start loading
            console.log(`Searching iTunes for: ${searchTerm}`);
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&limit=10`);
            console.log("Response received", response);
            if (!response.ok) {
                throw new Error('Failed to fetch from iTunes API');
            }
            const data = await response.json();
            setSearchResults(data.results);
        } catch (error) {
            console.error('Search iTunes Error:', error);
            // Handle error state as needed
        } finally {
            setLoading(false); // End loading
        }
    };
    

    // Function to add an item to the DynamoDB catalog
    const addToCatalog = async (item) => {
        
        // Convert the iTunes item to your DynamoDB format
        const catalogItem = {
            id: item.trackId.toString(), // unique ID
            artistName: item.artistName,
            catalogId: {catalogId}, // unique identifier for each seperate catalog change this later
            productName: item.trackName, 
            type: item.kind, // media type (video, movie, music)
            genre: item.primaryGenreName,
            price: item.trackPrice.toString(),
            pointValue: (item.trackPrice).toString(), //dummy default for point value
            createdAt: Date.now().toString(),
            productUrl: item.trackViewUrl,
            artworkUrl: item.artworkUrl100,
            description: `By ${item.artistName}` 
        };
        
        // POST request to add the item to the catalog
        try {
            const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/catalog/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    
                },
                body: JSON.stringify(catalogItem),
            });

            if (!response.ok) {
                throw new Error('Failed to add item to catalog');
            }

            const responseData = await response.json();
            console.log('Item added to catalog successfully', responseData);
            setSnackbarMessage("Item added to catalog successfully");
            setOpenSnackbar(true); // Open the snackbar to show success message
        } catch (error) {
            console.error('Error adding item to catalog:', error);
            setSnackbarMessage("Error adding item to catalog");
            setOpenSnackbar(true); // Open the snackbar to show error message
        }
    };

    return (
        <>
            <Navigation />
            <Container>
                <Typography variant="h4" gutterBottom align="center" sx={{ width: '100%', marginTop: 2, marginBottom: 2 }}>
                    Manage Various Catalogs Here!
                </Typography>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={4}>

                    <Box sx={columnStyles}>

                        <Typography variant="h5" gutterBottom align="center">
                            Current Catalog
                        </Typography>

                        <InputLabel id="company-dropdown-label">Company</InputLabel>

                        <FormControl fullWidth>
                            <InputLabel id="company-dropdown-label">Company</InputLabel>
                            <Select
                                labelId="company-dropdown-label"
                                id="company-dropdown"
                                value={catalogId}
                                onChange={(e) => setCatalogId(e.target.value)}
                                displayEmpty // This ensures a placeholder is displayed
                                inputProps={{ 'aria-label': 'Without label' }}
                                
                                sx={{ bgcolor: 'white' }}
                            >

                                {companies.map((company, index) => (
                                <MenuItem key={index} value={company}>{company}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Point Conversion Ratio"
                            variant="outlined"
                            fullWidth
                            type="number"
                            value={pointRatio}
                            onChange={handlePointRatioChange}
                            sx={{ bgcolor: 'white' }}
                        >
                            
                        </TextField>

                        <TextField
                            label="Search Catalog"
                            variant="outlined"
                            value={searchCatalogTerm}
                            onChange={(e) => setSearchCatalogTerm(e.target.value)}
                            fullWidth
                            margin="normal"
                            sx={{ bgcolor: 'white' }}
                        />
                        {filteredCatalogItems.filter(item => item).map((item, index) => (
                            <Card key={item.id || `item-${index}`} sx={{ maxWidth: 345, width: '100%', mb: 2 }}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={item?.artworkUrl}
                                    alt={item?.productName}
                                />
                                <CardContent>
                                    <Typography variant="h6">{item?.productName}</Typography>
                                    <Typography variant="body2" color="text.secondary">Artist: {item?.artistName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Genre: {item?.genre}
                                    </Typography>
                                    {item.isEditing ? (
                                        <>
                                            <TextField
                                                label="Description"
                                                variant="outlined"
                                                defaultValue={item.description}
                                                onChange={(e) => setEditingDescription(e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Point Value"
                                                variant="outlined"
                                                type="number"
                                                defaultValue={item.pointValue}
                                                onChange={(e) => setEditingPointValue(e.target.value)}
                                                fullWidth
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body2">{item.description}</Typography>
                                            <Typography variant="body1">Points: {item.pointValue}</Typography>
                                        </>
                                    )}
                                    
                                </CardContent>
                                <CardActions>
                                    {item.isEditing ? (
                                        <Button onClick={() => updateCatalogItem(item.id, editingDescription, editingPointValue)}>Save</Button>
                                    ) : (
                                        <IconButton aria-label="edit" color="primary" onClick={() => toggleEdit(item.id)}>
                                            <EditIcon />
                                        </IconButton>
                                    )}
                                    <IconButton aria-label="delete" color= "secondary" onClick={() => removeFromCatalog(item.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        ))}

                    </Box>

                    <Box sx={columnStyles}>
                        <Typography variant="h5" gutterBottom align="center">
                            Add To Catalog
                        </Typography>

                        <TextField
                            label="Search iTunes"
                            variant="outlined"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ bgcolor: 'white',}}
                            fullWidth
                            margin="normal"
                        />
                        <Button onClick={searchiTunes} variant="contained" color="primary" sx={{ my: 'auto' }}>
                            Search
                        </Button>


                        {/* Display search results */}
                        
                        {searchResults.map((item, index) => (
                            <ItemCard
                                key={item.trackId || index}
                                artworkUrl100={item.artworkUrl100}
                                trackName={item.trackName}
                                artistName={item.artistName}
                                trackPrice={item.trackPrice || 0}
                                {...item}
                                addToCatalog={() => addToCatalog(item)}
                            />
                        ))}

                    </Box>
                </Box>
            </Container>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                message={snackbarMessage}
            />
        </>
    );
};

export default AdminCatalog;