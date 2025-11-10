
import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Button, FormControl, InputLabel, CircularProgress, Snackbar, Alert } from '@mui/material';

// Define the structure of an Organization
interface Organization {
  _id: string;
  orgId: string;
  name: string;
}

// Define the available actions for simulation
const availableActions = [
  { value: 'account_role_granted', label: 'Role Granted' },
  { value: 'service_enrolled', label: 'Service Enrolled' },
  { value: 'team_member_removed', label: 'Team Member Removed' },
  { value: 'user_invited', label: 'User Invited' },
  { value: 'role_modified', label: 'Role Modified' },
  { value: 'user_login', label: 'User Login' },
];

const SimulationPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch organizations when the component mounts
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await fetch('/api/orgs');
        const data = await response.json();
        setOrganizations(data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setFeedback({ open: true, message: 'Failed to load organizations.', severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  // Handle the simulation logic
  const handleSimulate = async () => {
    if (!selectedOrg || !selectedAction) {
      setFeedback({ open: true, message: 'Please select an organization and an action.', severity: 'error' });
      return;
    }
    setIsSimulating(true);
    try {
      const response = await fetch('/api/simulate/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          actionType: selectedAction,
          // You can add more details here if needed for the simulation
          actorName: 'Admin Simulator',
          targetEntityName: 'Simulated Target',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Simulation failed');
      }

      setFeedback({ open: true, message: result.message, severity: 'success' });

    } catch (error) {
      console.error('Error during simulation:', error);
      const errorMessage = (error instanceof Error && error.message) ? error.message : 'An unknown error occurred';
      setFeedback({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCloseSnackbar = () => {
    setFeedback({ ...feedback, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Event Simulation
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="org-select-label">Organization</InputLabel>
            <Select
              labelId="org-select-label"
              value={selectedOrg}
              label="Organization"
              onChange={(e) => setSelectedOrg(e.target.value)}
            >
              {organizations.map((org) => (
                <MenuItem key={org._id} value={org._id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="action-select-label">Action</InputLabel>
            <Select
              labelId="action-select-label"
              value={selectedAction}
              label="Action"
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              {availableActions.map((action) => (
                <MenuItem key={action.value} value={action.value}>
                  {action.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            onClick={handleSimulate} 
            disabled={isSimulating || !selectedOrg || !selectedAction}
            sx={{ mt: 2 }}
          >
            {isSimulating ? <CircularProgress size={24} /> : 'Run Simulation'}
          </Button>
        </Box>
      )}
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SimulationPage;
