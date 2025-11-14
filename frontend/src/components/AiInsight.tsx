import { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress, Card, CardContent, CardHeader } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // AI icon
import { API_BASE } from '../utils/api';

interface AiInsightProps {
  orgId: string;
}

export default function AiInsight({ orgId }: AiInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) {
      setLoading(true);
      setError(null);
      setInsight(null);
      fetch(`${API_BASE}/api/orgs/${orgId}/insight`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch insights');
          }
          return res.json();
        })
        .then((data) => {
          setInsight(data.aiInsight);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Could not load insight.');
          setLoading(false);
        });
    }
  }, [orgId]);

  return (
    <Card sx={{ mt: 3, boxShadow: 3, backgroundColor: '#eef4ff', borderLeft: '4px solid #4a90e2' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoAwesomeIcon sx={{ mr: 1.5, color: '#4a90e2' }} />
            <Typography variant="h6" component="div" sx={{ color: '#1a237e' }}>
              AI-Generated Summary
            </Typography>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        {loading && <CircularProgress size={24} sx={{ ml: 2 }}/>}
        {error && <Typography variant="body2" color="error" sx={{ ml: 2 }}>{error}</Typography>}
        {insight && <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: '#3a506b' }}>{insight}</Typography>}
      </CardContent>
    </Card>
  );
}
