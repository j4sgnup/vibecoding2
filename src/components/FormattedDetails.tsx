
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface FormattedDetailsProps {
  details: Record<string, any> | null | undefined;
}

// Helper function to format keys into a more readable format
const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
};

const FormattedDetails: React.FC<FormattedDetailsProps> = ({ details }) => {
  if (!details) {
    return <Typography variant="body2" color="text.secondary">N/A</Typography>;
  }

  // Don't format the special 'simulation' detail, just show a chip
  if (details.simulation) {
    return <Chip label="Simulated Event" color="info" size="small" variant="outlined" />;
  }

  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {Object.entries(details).map(([key, value]) => (
        <Box component="li" key={key} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
          <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
            {formatKey(key)}:
          </Typography>
          <Typography variant="body2" component="span" color="text.secondary">
            {String(value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default FormattedDetails;
