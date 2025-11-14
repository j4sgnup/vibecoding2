import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tree, TreeNode } from 'react-organizational-chart';
import { API_BASE } from '../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

interface Organization {
  _id: string;
  orgId: string;
  name: string;
  type: 'parent' | 'sister' | 'related';
  teamMembers: User[];
  intermediaries: User[];
  children?: Organization[];
  servicesEnrolled: string[];
}

const OrganizationChartPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [organizationData, setOrganizationData] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgStructure = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/orgs/${orgId}/structure`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setOrganizationData(data.organization);
      } catch (e:unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (orgId) {
      fetchOrgStructure();
    }
  }, [orgId]);

  if (loading) {
    return <div>Loading organization chart...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!organizationData) {
    return <div>No organization data found.</div>;
  }

  const renderOrgNode = (org: Organization) => (
    <TreeNode label={
      <div style={{ padding: '10px', border: '1px solid black', borderRadius: '5px', background: org.type === 'parent' ? '#e0f7fa' : org.type === 'sister' ? '#fff3e0' : '#f3e5f5' }}>
        <strong>{org.name}</strong> ({org.type})
        <br />
        Teammm Members: {org.teamMembers.length}
        <br />
        Iiintermediaries: {org.intermediaries.length}
      </div>
    }>
      {org.children && org.children.map(child => renderOrgNode(child))}
    </TreeNode>
  );

  const handleBackClick = () => {
    navigate(`/dashboard/${orgId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      <div style={{ flex: 3, padding: '20px', marginRight: '40px' }}>
        <button onClick={handleBackClick} style={{ marginBottom: '20px', padding: '10px 20px', fontSize: '16px' }}>
          Backkk to Dashboard
        </button>
        <h1>Organization Chartttt</h1>
        <Tree label={
          <div style={{ padding: '10px', border: '1px solid black', borderRadius: '5px', background: organizationData.type === 'parent' ? '#e0f7fa' : organizationData.type === 'sister' ? '#fff3e0' : '#f3e5f5' }}>
            <strong>{organizationData.name}</strong> ({organizationData.type})
            <br />
            Teammm Members: {organizationData.teamMembers.length}
            <br />
            Iiiintermediaries: {organizationData.intermediaries.length}
          </div>
        }>
          {organizationData.children && organizationData.children.map(child => renderOrgNode(child))}
        </Tree>
      </div>
      <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '30px', minWidth: '250px' }}>
        <h2>Enrolled Services</h2>
        {organizationData.servicesEnrolled && organizationData.servicesEnrolled.length > 0 ? (
          <ul>
            {organizationData.servicesEnrolled.map((service, idx) => (
              <li key={idx}>{service}</li>
            ))}
          </ul>
        ) : (
          <p>No services enrolled.</p>
        )}
      </div>
    </div>
  );
};

export default OrganizationChartPage;
