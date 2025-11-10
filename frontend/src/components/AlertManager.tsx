
import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, CircularProgress } from '@mui/material';

interface AlertManagerProps {
  organizationId: string;
  action: string;
}

const AlertManager: React.FC<AlertManagerProps> = ({ organizationId, action }) => {
  const [alertExists, setAlertExists] = useState<boolean | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAlertStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/alerts/check?organizationId=${organizationId}&action=${action}`);
        const data = await response.json();
        setAlertExists(data.exists);
        if (data.exists) {
          setPhoneNumber(data.alert.phoneNumber);
        }
      } catch (error) {
        console.error('Error checking alert status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAlertStatus();
  }, [organizationId, action]);

  const handleCreateAlert = async () => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, action, phoneNumber: `whatsapp:${phoneNumber}` }),
      });
      setAlertExists(true);
      setShowInput(false);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleRemoveAlert = async () => {
    try {
      await fetch(`/api/alerts/${organizationId}/${action}`, {
        method: 'DELETE',
      });
      setAlertExists(false);
      setPhoneNumber('');
    } catch (error) {
      console.error('Error removing alert:', error);
    }
  };

  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  if (alertExists) {
    return (
      <Box>
        <Button variant="contained" color="secondary" onClick={handleRemoveAlert}>
          Remove Alert
        </Button>
      </Box>
    );
  }

  if (showInput) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          label="WhatsApp Number"
          variant="outlined"
          size="small"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
        />
        <Button variant="contained" onClick={handleCreateAlert}>
          Confirm
        </Button>
      </Box>
    );
  }

  return (
    <Button variant="outlined" onClick={() => setShowInput(true)}>
      Create Alert
    </Button>
  );
};

export default AlertManager;
