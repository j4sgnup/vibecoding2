import { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, CardHeader, List, ListItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights'; // Other insights icon
import { API_BASE } from '../utils/api';

interface OtherInsightsProps {
  orgId: string;
}

export default function OtherInsights({ orgId }: OtherInsightsProps) {
  const [otherInsights, setOtherInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId) {
      setLoading(true);
      setError(null);
      setOtherInsights([]);
      fetch(`${API_BASE}/api/orgs/${orgId}/insight`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch other insights');
          }
          return res.json();
        })
        .then((data) => {
          setOtherInsights(data.otherInsights || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Could not load other insights.');
          setLoading(false);
        });
    }
  }, [orgId]);

  return (
    <Card sx={{ mt: 3, boxShadow: 3 }}>
      <CardHeader
        title="Other Insights"
        titleTypographyProps={{ variant: 'h6', color: 'primary.main' }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InsightsIcon sx={{ mr: 1.5, color: 'secondary.main' }} />
          <Typography variant="subtitle1" component="div">
            Additional Insights
          </Typography>
        </Box>
        {loading && <CircularProgress size={24} sx={{ ml: 2 }}/>}
        {error && <Typography variant="body2" color="error" sx={{ ml: 2 }}>{error}</Typography>}
        {!loading && !error && otherInsights.length === 0 && (
          <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic', color: 'text.secondary' }}>
            No additional insights available.
          </Typography>
        )}
        <List dense>
          {otherInsights.map((text, index) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: 'auto', mr: 1}}>
                <Box sx={{ width: 6, height: 6, bgcolor: 'text.secondary', borderRadius: '50%' }} />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
