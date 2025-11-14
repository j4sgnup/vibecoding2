import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import OnboardingTracker from './OnboardingTracker';
import AiInsight from './AiInsight'; // Import the new AI Insight component
import OtherInsights from './OtherInsights'; // Import the new Other Insights component
import { List, ListItemButton, ListItemText, Typography, Paper, Collapse, IconButton, Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // Import the new icon
import { Link as RouterLink } from 'react-router-dom'; // Import Link from react-router-dom
import { API_BASE } from '../utils/api';

interface Org {
  _id: string;
  orgId: string;
  name: string;
  type: 'parent' | 'sister' | 'related';
  parentOrgId?: string;
}

interface ParentOrg extends Org {
  children: Org[];
}

export default function Dashboard() {
  const { orgId } = useParams<{ orgId?: string }>();
  const [orgs, setOrgs] = useState<ParentOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`${API_BASE}/api/orgs`)
      .then((res) => res.json())
      .then((data: Org[]) => {
        const parentOrgs = data.filter(org => org.type === 'parent');
        const childOrgs = data.filter(org => org.type !== 'parent');

        const structuredOrgs = parentOrgs.map(parent => ({
          ...parent,
          children: childOrgs.filter(child => child.parentOrgId === parent.orgId)
        }));

        setOrgs(structuredOrgs);

        if (orgId) {
          setSelectedOrgId(orgId);
        } else if (structuredOrgs.length > 0) {
          setSelectedOrgId(structuredOrgs[0].orgId);
        }
      });
  }, [orgId]);

  const handleToggleExpand = (orgId: string) => {
    const isCurrentlyExpanded = expanded[orgId];

    if (isCurrentlyExpanded) { // It's about to be collapsed
      const parentOrg = orgs.find(p => p.orgId === orgId);
      if (parentOrg) {
        const childIsSelected = parentOrg.children.some(c => c.orgId === selectedOrgId);
        if (childIsSelected) {
          setSelectedOrgId(parentOrg.orgId);
        }
      }
    }

    setExpanded(prev => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  const getBreadcrumbData = () => {
    if (!selectedOrgId) return [];

    const allOrgs: Org[] = orgs.flatMap(p => [p, ...p.children]);
    const selected = allOrgs.find(o => o.orgId === selectedOrgId);

    if (!selected) return [];

    if (selected.parentOrgId) {
      const parent = orgs.find(p => p.orgId === selected.parentOrgId);
      if (parent) {
        return [parent, selected];
      }
    }
    return [selected];
  };

  const breadcrumbData = getBreadcrumbData();

  return (
    <Grid container spacing={3} sx={{ height: '100%' }}>
      <Grid size={{ md: 4 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h6" gutterBottom>Organizations</Typography>
        <Paper sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <List component="nav">
            {orgs.map((parentOrg) => (
              <div key={parentOrg.orgId}>
                <ListItemButton onClick={() => setSelectedOrgId(parentOrg.orgId)} selected={selectedOrgId === parentOrg.orgId}>
                  <ListItemText primary={parentOrg.name} />
                  <IconButton onClick={(e) => { e.stopPropagation(); handleToggleExpand(parentOrg.orgId); }}>
                    <ExpandMoreIcon sx={{ transform: expanded[parentOrg.orgId] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </IconButton>
                  <IconButton
                    component={RouterLink} // Use RouterLink for navigation
                    to={`/organization-chart/${parentOrg.orgId}`}
                    onClick={(e) => e.stopPropagation()} // Prevent ListItemButton's onClick
                    aria-label="view organization chart"
                  >
                    <AccountTreeIcon />
                  </IconButton>
                </ListItemButton>
                <Collapse in={expanded[parentOrg.orgId]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {parentOrg.children.map((childOrg) => (
                      <ListItemButton key={childOrg.orgId} sx={{ pl: 4 }} onClick={() => setSelectedOrgId(childOrg.orgId)} selected={selectedOrgId === childOrg.orgId}>
                        <ListItemText primary={childOrg.name} secondary={childOrg.type.charAt(0).toUpperCase() + childOrg.type.slice(1)} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </div>
            ))}
          </List>
        </Paper>
      </Grid>

      <Grid size={{ md: 8 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {selectedOrgId && breadcrumbData.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {breadcrumbData.length === 2 && (
              <Typography variant="subtitle2" color="text.secondary">
                {breadcrumbData[0].name}
              </Typography>
            )}
            <Typography variant="h5" component="h1" color="primary.main">
              {breadcrumbData[breadcrumbData.length - 1].name}
            </Typography>
          </Box>
        )}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {selectedOrgId && (
            <>
              <AiInsight orgId={selectedOrgId} />
              <OnboardingTracker orgId={selectedOrgId} />
              <OtherInsights orgId={selectedOrgId} />
            </>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}
