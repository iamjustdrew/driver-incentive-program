import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, Checkbox, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';




const exportPDF = () => {
  const input = document.getElementById('users-table');
  const originalStyle = input.style.cssText;
  const originalParentStyle = input.parentElement.style.cssText;

  // Temporarily adjust styles to expand the table
  input.style.overflow = 'visible';
  input.style.maxHeight = 'none';
  input.parentElement.style.overflow = 'visible';

  html2canvas(input, {
    scale: 1,
    onclone: (document) => {
      const clonedTable = document.getElementById('users-table');
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

    const imgWidth = 297; // A4 landscape width in mm
    const pageHeight = 210; // A4 landscape height in mm
    let imgHeight = canvas.height * imgWidth / canvas.width; // Calculate the image height preserving the aspect ratio

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('download.pdf');

    // Reset styles
    input.style.cssText = originalStyle;
    input.parentElement.style.cssText = originalParentStyle;
  });
};


const UsersTable = ({ userData, selectedUsers, setSelectedUsers, handleSelectAllClick, handleCheckboxClick, setUserData  }) => {




  const handleBulkDelete = async () => {
    await Promise.all(selectedUsers.map(async (subId) => {
      const userToDelete = userData.find(user => user.Attributes.find(attr => attr.Name === "sub")?.Value === subId);
      const username = userToDelete ? userToDelete.Username : 'unknown'; // Fallback to 'unknown' if user not found
      try {
        const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/second-launch/login/${subId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Include other necessary headers, like Authorization
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to delete user ${username}`);
        }
        // Optionally, remove the user from userData and filteredData to update the UI
      } catch (error) {
        console.error('Error deleting user:', error);
        // Handle errors, such as by showing an error message
      }
    })).then(() => {
      console.log('All selected users have been deleted');
      // Update state to reflect the deletion in the UI
      setUserData(userData.filter(user => !selectedUsers.includes(user.Username)));
      setSelectedUsers([]);
    });
  };

  const updateUserRole = async (subId, updatedUserData) => {
    try {
      const response = await fetch(`https://43fezlacjh.execute-api.us-east-1.amazonaws.com/fifth-launch/login/${subId}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData)
      });
  
      console.log("changing driver with ID of,", subId, " into ", updatedUserData  );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        
      }
  
      const data = await response.json(); // Assuming the API responds with JSON
      console.log("User role updated:", data);
      // Handle successful response (e.g., updating local state or UI to reflect the change)
    } catch (error) {
      console.error("Failed to update user role:", error);
      // Handle errors, such as by displaying a message to the user
    }
  };




  return (
    <>
      <TableContainer id="users-table" component={Paper} style={{minWidth: 650, maxHeight: '800px', overflowY: 'auto'}}>
        <Table stickyHeader aria-label="scrollable table" >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < userData.length}
                  checked={userData.length > 0 && selectedUsers.length === userData.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>Username</TableCell>
              <TableCell align="right">Email</TableCell>
              <TableCell align="right">Role</TableCell>
              <TableCell align="right">Company</TableCell>
              <TableCell align="right">Status</TableCell>
              
            </TableRow>
          </TableHead>
          <TableBody>
            {userData.map((user) => {
              
              const handleRoleChange = async (event) => {
                const newRole = event.target.value;
                await updateUserRole(user.Username, {"custom:user_role": newRole });
                window.location.reload();
              };

              return (
                <TableRow key={user.Username} selected={selectedUsers.indexOf(user.Username) !== -1}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.indexOf(user.Username) !== -1}
                      onChange={(event) => handleCheckboxClick(event, user.Username)}
                    />
                  </TableCell>      
                  <TableCell>{user.Attributes.find(attr => attr.Name === "name")?.Value}</TableCell>
                  <TableCell align="right">{user.Attributes.find(attr => attr.Name === "email")?.Value}</TableCell>
                  <TableCell align="right">
                    <Select
                      value={user.Attributes.find(attr => attr.Name === "custom:user_role")?.Value || ''}
                      onChange={handleRoleChange}
                      size="small"
                      displayEmpty
                    >
                      <MenuItem value="Driver">Driver</MenuItem>
                      <MenuItem value="Sponsor">Sponsor</MenuItem>

                    </Select>
                  </TableCell>
                  <TableCell align="right">{user.Attributes.find(attr => attr.Name === "custom:company")?.Value}</TableCell>
                  <TableCell align="right">{user.UserStatus}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

      
      </TableContainer>
    
      <Button
      variant="contained"
      color="secondary"
      onClick={handleBulkDelete}
      disabled={selectedUsers.length === 0}
      >
      Delete Selected Users
      </Button>
      <Button onClick={exportPDF} color="primary" variant="contained">
          Export as PDF
      </Button>

    </>

  );
};


export default UsersTable;