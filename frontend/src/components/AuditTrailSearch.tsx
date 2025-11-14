import React, { useState } from 'react';
import { API_BASE } from '../utils/api';
import {
  Box,
  TextField,
  Button,
  Chip,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ClearIcon from '@mui/icons-material/Clear';
import AlertManager from './AlertManager';
import FormattedDetails from './FormattedDetails';

interface AuditLogEntry {
  _id: string;
  timestamp: string;
  actorName?: string;
  actionType: string;
  targetEntityName?: string;
  orgId: string;
  details?: Record<string, unknown>;
}

const tagMapping: Record<string, string> = {
  account_role_granted: 'Role Granted',
  service_enrolled: 'Service Enrolled',
  team_member_removed: 'Team Member Removed',
  user_invited: 'User Invited',
  role_modified: 'Role Modified',
  user_login: 'User Login',
};

const availableTags = Object.keys(tagMapping);

const AuditTrailSearch: React.FC = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AuditLogEntry[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiUsedLastSearch, setAiUsedLastSearch] = useState(false);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`${API_BASE}/api/audit/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: selectedTags,
          query: naturalLanguageQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.logs || []);
      setTotalResults(data.total || 0);
      setAiUsedLastSearch(data.aiUsed || false);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setSearchResults([]);
      setTotalResults(0);
      setAiUsedLastSearch(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setNaturalLanguageQuery('');
    setSearchResults([]);
    setTotalResults(0);
    setHasSearched(false);
    setAiUsedLastSearch(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audit Trail Search
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter by Action Type</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {availableTags.map((tag) => (
            <Chip
              key={tag}
              label={tagMapping[tag]} // Use the human-readable label
              onClick={() => handleTagClick(tag)}
              color={selectedTags.includes(tag) ? 'primary' : 'default'}
              variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Natural Language Query</Typography>
        <TextField
          fullWidth
          label="e.g., for John Doe, between March and May, role admin"
          variant="outlined"
          value={naturalLanguageQuery}
          onChange={(e) => setNaturalLanguageQuery(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={handleClearSearch}
                  edge="end"
                  style={{ visibility: naturalLanguageQuery ? 'visible' : 'hidden' }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Button variant="contained" onClick={handleSearch} disabled={isLoading} sx={{ mb: 4 }}>
        {isLoading ? 'Searching...' : 'Search Audit Logs'}
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Search Results
        </Typography>
        {aiUsedLastSearch && (
          <Tooltip title="This search was enhanced by AI">
            <AutoAwesomeIcon color="primary" />
          </Tooltip>
        )}
      </Box>

      {hasSearched && !isLoading && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {totalResults > 0 && `${totalResults} audit logs found.`} {searchResults.length > 0 && `(Displaying first ${searchResults.length})`}
        </Typography>
      )}

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : searchResults.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="audit log table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Alerts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((log) => (
                <TableRow
                  key={log._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.actorName || 'N/A'}</TableCell>
                  <TableCell>{tagMapping[log.actionType] || log.actionType}</TableCell>
                  <TableCell>{log.targetEntityName || 'N/A'}</TableCell>
                  <TableCell><FormattedDetails details={log.details} /></TableCell>
                  <TableCell>
                    <AlertManager organizationId={log.orgId} action={log.actionType} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : hasSearched && totalResults === 0 ? (
        <Typography>No audit logs found. Try a different search.</Typography>
      ) : null}
    </Box>
  );
};

export default AuditTrailSearch;
