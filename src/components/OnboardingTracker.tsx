import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Card, CardHeader, CardContent, Typography, Grid } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface User {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'standard' | 'intermediary';
  status: 'invited' | 'in_progress' | 'awaiting_approval' | 'active';
  registrationProgress: number;
  invitedBy: string;
  inviteSentAt: Date | null;
  inviteOpenedAt: Date | null;
  inviteRedeemedAt: Date | null;
  registrationStartedAt: Date | null;
  registrationCompletedAt: Date | null;
}

interface OnboardingTrackerProps {
  orgId: string;
}

export default function OnboardingTracker({ orgId }: OnboardingTrackerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    if (orgId) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      fetch(`${apiBaseUrl}/api/orgs/${orgId}/users`)
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch(console.error);
    }
  }, [orgId]);

  const categorizedUsers = React.useMemo(() => {
    return users.reduce((acc, user) => {
      (acc[user.status] = acc[user.status] || []).push(user);
      return acc;
    }, {} as Record<User['status'], User[]>);
  }, [users]);

  const statusData = [
    { label: 'Invited', status: 'invited', count: (categorizedUsers.invited || []).length, icon: <PersonAddIcon sx={{ color: '#f5a623' }} /> },
    { label: 'In Progress', status: 'in_progress', count: (categorizedUsers.in_progress || []).length, icon: <HourglassEmptyIcon sx={{ color: '#4a90e2' }} /> },
    { label: 'Awaiting Approval', status: 'awaiting_approval', count: (categorizedUsers.awaiting_approval || []).length, icon: <HowToRegIcon sx={{ color: '#bd10e0' }} /> },
    { label: 'Active', status: 'active', count: (categorizedUsers.active || []).length, icon: <CheckCircleOutlineIcon sx={{ color: '#7ed321' }} /> },
  ];

  const handleStatClick = (status: string) => {
    if (status !== 'active') { // Only navigate for non-active statuses
      navigate('/users', { state: { fromDashboard: true, status, orgId } });
    }
  };

  return (
    <Card sx={{ mt: 3, boxShadow: 3 }}>
      <CardHeader
        title="Onboarding Status"
        titleTypographyProps={{ variant: 'h6', color: 'primary.main' }}
      />
      <CardContent>
        <Grid container spacing={2} justifyContent="space-around" alignItems="center">
          {statusData.map((statusItem) => (
            <Grid size={{xs: 6, sm: 3}} key={statusItem.label} 
              sx={{
                textAlign: 'center',
                cursor: statusItem.status !== 'active' ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: statusItem.status !== 'active' ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                },
              }}
              onClick={() => handleStatClick(statusItem.status)}
            >
              <Box sx={{ mb: 1 }}>{statusItem.icon}</Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                {statusItem.count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statusItem.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
