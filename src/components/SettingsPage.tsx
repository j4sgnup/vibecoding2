
import React, { useState, useEffect } from 'react';
import { Box, Typography, Switch, FormControlLabel, CircularProgress, Snackbar, Alert, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({ isAiEnabled: true, isTwilioEnabled: true });
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setFeedback({ open: true, message: 'Failed to load settings.', severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    const newSettings = { ...settings, [name]: checked };
    setSettings(newSettings);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setFeedback({ open: true, message: 'Settings updated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error during simulation:', error);
      const errorMessage = (error instanceof Error && error.message) ? error.message : 'An unknown error occurred';
      setFeedback({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setFeedback({ ...feedback, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Application Settings
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={settings.isAiEnabled} onChange={handleSettingChange} name="isAiEnabled" />}
            label="Enable AI Features"
          />
          <FormControlLabel
            control={<Switch checked={settings.isTwilioEnabled} onChange={handleSettingChange} name="isTwilioEnabled" />}
            label="Enable Twilio Notifications"
          />
          <Button 
            component={Link} 
            to="/settings/simulation" 
            variant="contained" 
            sx={{ 
              mt: 2, 
              color: 'white', // Ensure text is always white
              '&:hover': {
                color: 'white', // Ensure text is white on hover as well
              }
            }}
          >
            Go to Simulation Page
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

export default SettingsPage;
