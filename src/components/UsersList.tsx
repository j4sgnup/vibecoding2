import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  orgId: string;
}

// interface OrganizationData {
//   _id: string;
//   orgId: string;
//   name: string;
//   parentOrgId?: string;
//   parentOrgName?: string;
// }

const statusMapping: Record<string, string> = {
  invited: 'Invited',
  in_progress: 'In Progress',
  awaiting_approval: 'Awaiting Approval',
  active: 'Active',
};

// Define colors for each status (still needed for the header Chip if it's used there, but not for table cell)
const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  invited: 'info',
  in_progress: 'warning',
  awaiting_approval: 'error',
  active: 'success',
};

const UsersList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [orgNameMap, setOrgNameMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [isDashboardFiltered, setIsDashboardFiltered] = useState(false);
  const [dashboardFilterInfo, setDashboardFilterInfo] = useState<{ status?: string; orgId?: string; orgName?: string; parentOrgName?: string }>({});

  const fetchOrganizationDetails = async (orgId: string) => {
    try {
      const response = await fetch(`/api/orgs/${orgId}`); // Use the new endpoint
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const org = await response.json();

      let parentOrgName: string | undefined;
      if (org.parentOrgId) {
        const parentResponse = await fetch(`/api/orgs/${org.parentOrgId}`);
        const parentData = await parentResponse.json();
        parentOrgName = parentData.name;
      }

      return {
        orgName: org.name,
        parentOrgName: parentOrgName,
      };
    } catch (error) {
      console.error('Error fetching organization details:', error);
      return { orgName: 'Unknown Organization', parentOrgName: undefined };
    }
  };

  const fetchUsers = useCallback(
    async (filters: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const requestBody: Record<string, string> = { ...filters };
      if (nameSearch) requestBody.name = nameSearch;
      if (emailSearch) requestBody.email = emailSearch;

      // If this is a local search (not from dashboard), always filter for active users.
      if (!isDashboardFiltered) {
        requestBody.status = 'active';
      }

      // Only fetch if there are actual filters or search terms
      if (Object.keys(requestBody).length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: User[] = await response.json();
      setUsers(data);

      // After fetching users, fetch the unique organization names
      if (data.length > 0) {
        const uniqueOrgIds = [...new Set(data.map(user => user.orgId))];
        const orgDetailsPromises = uniqueOrgIds.map(id => fetch(`/api/orgs/${id}`).then(res => res.json()));
        const orgDetails = await Promise.all(orgDetailsPromises);
        const newOrgNameMap = orgDetails.reduce((acc, org) => {
          acc[org.orgId] = org.name;
          return acc;
        }, {} as Record<string, string>);
        setOrgNameMap(newOrgNameMap);
      }

    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  },[nameSearch, emailSearch, isDashboardFiltered])

  useEffect(() => {
    const state = location.state as { fromDashboard?: boolean; status?: string; orgId?: string } | undefined;
    if (state?.fromDashboard) {
      setIsDashboardFiltered(true);
      setDashboardFilterInfo({ status: state.status, orgId: state.orgId });
      fetchUsers({ status: state.status || '', orgId: state.orgId || '' });

      if (state.orgId) {
        fetchOrganizationDetails(state.orgId).then(details => {
          setDashboardFilterInfo(prev => ({ ...prev, orgName: details.orgName, parentOrgName: details.parentOrgName }));
        });
      }
    } else {
      setIsDashboardFiltered(false);
      setDashboardFilterInfo({});
      setUsers([]); // Clear users if navigating directly without filters
    }
  }, [location.state, fetchUsers]);

  const handleLocalSearch = () => {
    fetchUsers();
  };

  // const handleClearFilters = () => {
  //   navigate('/users', { replace: true, state: {} }); // Clear state and navigate to clean URL
  //   setNameSearch('');
  //   setEmailSearch('');
  //   setIsDashboardFiltered(false);
  //   setDashboardFilterInfo({});
  //   setUsers([]); // Clear users immediately
  // };

  const handleBackToDashboard = () => {
    if (dashboardFilterInfo.orgId) {
      navigate(`/dashboard/${dashboardFilterInfo.orgId}`);
    } else {
      navigate('/'); // Fallback to main dashboard if no specific orgId
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Status Overview
      </Typography>

      {isDashboardFiltered ? (
        <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ mr: 1 }}>Filtered by:</Typography>
            
            {dashboardFilterInfo.status && (
              <Chip 
                label={`Status: ${statusMapping[dashboardFilterInfo.status] || dashboardFilterInfo.status}`}
                variant="outlined" 
                color={statusColors[dashboardFilterInfo.status] || 'default'}
              />
            )}

            <Divider orientation="vertical" flexItem />

            {dashboardFilterInfo.orgName && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1">Organization:</Typography>
                {dashboardFilterInfo.parentOrgName && (
                  <>
                    <Typography variant="body1" color="text.secondary">{dashboardFilterInfo.parentOrgName}</Typography>
                    <ChevronRightIcon fontSize="small" />
                  </>
                )}
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{dashboardFilterInfo.orgName}</Typography>
              </Box>
            )}
            
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleBackToDashboard} startIcon={<ArrowBackIcon />}>
                Back to Dashboard
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{xs: 12, sm: 5}}>
            <TextField
              fullWidth
              label="Search by Name"
              variant="outlined"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
          </Grid>
          <Grid size={{xs: 12, sm: 5}}>
            <TextField
              fullWidth
              label="Search by Email"
              variant="outlined"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
            />
          </Grid>
          <Grid size={{xs: 12, sm: 2}}>
            <Button fullWidth variant="contained" onClick={handleLocalSearch} disabled={isLoading} sx={{ height: '100%' }}>
              Search
            </Button>
          </Grid>
        </Grid>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Organization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{statusMapping[user.status] || user.status}</TableCell>
                  <TableCell>{orgNameMap[user.orgId] || user.orgId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No users found. {isDashboardFiltered ? '' : 'Enter a name or email to search.'}</Typography>
      )}
    </Box>
  );
};

export default UsersList;
