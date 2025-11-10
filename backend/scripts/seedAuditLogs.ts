import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { AuditLog } from '../src/models/AuditLog';
import { User } from '../src/models/User';
import { Organization } from '../src/models/Organization';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/acm-poc-01';

const services = [
  'Accessible Tech for All', 'Basic Tech Access Program', 'Carbon-Neutral Transport Program',
  'Climate Awareness Apparel', 'Climate-Conscious Clothing Drive', 'Climate-Resilient Food Distribution',
  'Community Event Nutrition', 'Community Nutrition Outreach', 'Community Safety Equipment Drive',
  'Community Sanitation Initiative', 'Digital Inclusion for Minorities', 'Dignified Meals for All',
  'E-Waste Recycling Awareness', 'Eco-Friendly Awareness Merchandise', 'Eco-Friendly Computing Campaign',
  'Eco-Safe Gear Initiative', 'Eco-Smart Office Supplies', 'Energy-Efficient Workstation Rollout',
  'Equitable Workspace Comfort Program', 'Ethical Dairy Cooperative', 'Ethical Executive Nutrition',
  'Ethical Luxury Nutrition', 'Ethical Seafood Distribution', 'Ethical Workwear Initiative',
  'Farm-to-Table Community Meals', 'Green Building Retrofit Program', 'Green IT Deployment Program',
  'Green Mobility Network', 'Green Tech Certification Program', 'Healthy Workplace Initiative',
  'Hygiene Equity for All', 'Hygiene for Vulnerable Communities', 'Inclusive Meal Sharing Program',
  'Inclusive Workspace Design', 'Indigenous Footwear Empowerment', 'Local Organic Pizza Initiative',
  'Local Sustainable Farming Support', 'Low-Emission Fleet Transition', 'Nutrition Intelligence for All',
  'Open Data for Climate Action', 'Organic Food Access Program', 'Recyclable Office Design Program',
  'Recycled Tech Distribution', 'Refurbished Tech for Education', 'Rural Mobility Access Program',
  'Socially Responsible Catering', 'Sustainable Fleet Oversight', 'Sustainable Furniture Access',
  'Sustainable Gourmet Nutrition', 'Sustainable Office Essentials', 'Sustainable Tech Accessories',
  'Sustainable Uniforms for NGOs', 'Sustainable Workwear Distribution', 'Urban Organic Salad Outreach',
  'Worker Health & Nutrition Program', 'Worker Welfare Nutrition Program', 'Workplace Wellness Campaign',
  'Youth Nutrition Awareness', 'Zero-Waste Meal Program'
];

const ukCities = ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Bristol", "Edinburgh"];

interface OrgDocument extends mongoose.Document {
  name: string;
  orgId: string;
}

export const seedAuditLogs = async () => {
  await AuditLog.deleteMany({});
  console.log('Cleared existing AuditLog entries.');

  const users = await User.find({});
  const orgs: OrgDocument[] = await Organization.find({});
  const orgMap = new Map(orgs.map(org => [org.orgId, org]));

  if (users.length < 10) {
    console.error('Not enough users in the database for seeding. Need at least 10.');
    return;
  }

  const auditLogs = [];

  // --- Personas ---
  const adminAlice = users[0];
  adminAlice.name = "Admin Alice";
  const securitySam = users[1];
  securitySam.name = "Security Sam";
  const onboardingOscar = users[2];
  onboardingOscar.name = "Onboarding Oscar";
  const johnDoe = users[3];
  johnDoe.name = "John Doe";
  const raymondHudson = users[4];
  raymondHudson.name = "Raymond Hudson";

  console.log('Seeding data for showcase queries...');

  // --- ROLE MODIFIED ---
  for (let i = 0; i < 30; i++) {
    const targetUser = faker.helpers.arrayElement(users.slice(5));
    const org = orgMap.get(targetUser.orgId);
    if (org) {
      auditLogs.push({
        timestamp: faker.date.between({ from: '2024-01-01T00:00:00.000Z', to: '2025-08-02T00:00:00.000Z' }),
        actorId: adminAlice._id, actorName: adminAlice.name, actorEmail: adminAlice.email,
        actionType: 'role_modified', targetEntityId: targetUser._id, targetEntityName: targetUser.name,
        status: 'success', location: faker.helpers.arrayElement(ukCities),
        details: { oldRole: 'Standard', newRole: 'Manager', approvedBy: adminAlice.name, organizationName: org.name, organizationId: org.orgId },
        orgId: org.orgId
      });
    }
  }

  // --- USER LOGIN ---
  for (let i = 0; i < 40; i++) {
      const org = orgMap.get(securitySam.orgId);
      const location = faker.helpers.arrayElement(ukCities);
      if(org) {
          auditLogs.push({
              timestamp: faker.date.between({ from: '2025-02-01T00:00:00.000Z', to: '2025-08-01T00:00:00.000Z' }),
              actorId: securitySam._id, actorName: securitySam.name, actorEmail: securitySam.email,
              actionType: 'user_login', status: 'success', location: location,
              details: { loginMethod: 'sso', organizationName: org.name, organizationId: org.orgId, location: location }, 
              orgId: org.orgId, ipAddress: '72.69.144.10'
          });
      }
  }
  const samsOrg = orgMap.get(securitySam.orgId);
  if(samsOrg) {
      const location = 'Mumbai, India';
      auditLogs.push({ // The anomalous login
          timestamp: new Date(), actorId: securitySam._id, actorName: securitySam.name, actorEmail: securitySam.email,
          actionType: 'user_login', status: 'failure', location: location,
          details: { loginMethod: 'password', reason: 'Invalid credentials', organizationName: samsOrg.name, organizationId: samsOrg.orgId, location: location }, 
          orgId: samsOrg.orgId, ipAddress: '103.27.20.1'
      });
  }

  // --- TEAM MEMBER REMOVED ---
  for (let i = 0; i < 20; i++) {
    const targetUser = users[i % 5 + 5];
    const org = orgMap.get(onboardingOscar.orgId);
    if (org) {
      auditLogs.push({
        timestamp: faker.date.between({ from: '2024-12-01T00:00:00.000Z', to: '2024-12-28T00:00:00.000Z' }),
        actorId: onboardingOscar._id, actorName: onboardingOscar.name, actorEmail: onboardingOscar.email,
        actionType: 'team_member_removed', targetEntityId: targetUser._id, targetEntityName: targetUser.name,
        status: 'success', location: faker.helpers.arrayElement(ukCities),
        details: { reason: 'Off-boarding', organizationName: org.name, organizationId: org.orgId },
        orgId: org.orgId
      });
    }
  }

  // --- SERVICE ENROLLED ---
  for (let i = 0; i < 50; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const randomOrg = faker.helpers.arrayElement(orgs);
      auditLogs.push({
          timestamp: faker.date.between({ from: '2023-01-01T00:00:00.000Z', to: '2025-08-02T00:00:00.000Z' }),
          actorId: randomUser._id, actorName: randomUser.name, actorEmail: randomUser.email,
          actionType: 'service_enrolled', targetEntityId: randomOrg.orgId, targetEntityName: randomOrg.name,
          status: 'success', location: faker.helpers.arrayElement(ukCities),
          details: { serviceName: faker.helpers.arrayElement(services), organizationName: randomOrg.name, organizationId: randomOrg.orgId },
          orgId: randomOrg.orgId
      });
  }

  // --- ACCOUNT ROLE GRANTED ---
  for (let i = 0; i < 20; i++) {
      const actor = faker.helpers.arrayElement(users);
      const target = faker.helpers.arrayElement(users);
      const org = orgMap.get(target.orgId);
      if (org && actor._id.toString() !== target._id.toString()) {
          auditLogs.push({
              timestamp: faker.date.recent({ days: 365 }),
              actorId: actor._id, actorName: actor.name, actorEmail: actor.email,
              actionType: 'account_role_granted', targetEntityId: target._id, targetEntityName: target.name,
              status: 'success', location: faker.helpers.arrayElement(ukCities),
              details: { roleGranted: "Admin", previousRole: "Standard", organizationName: org.name, organizationId: org.orgId },
              orgId: org.orgId
          });
      }
  }

  // --- USER INVITED ---
  for (let i = 0; i < 20; i++) {
      const actor = faker.helpers.arrayElement(users);
      const org = orgMap.get(actor.orgId);
      if (org) {
          auditLogs.push({
              timestamp: faker.date.recent({ days: 90 }),
              actorId: actor._id, actorName: actor.name, actorEmail: actor.email,
              actionType: 'user_invited', 
              targetEntityName: faker.person.fullName(),
              targetEntityId: faker.internet.email(),
              status: 'success', location: faker.helpers.arrayElement(ukCities),
              details: { invitedAsRole: "Standard", organizationName: org.name, organizationId: org.orgId },
              orgId: org.orgId
          });
      }
  }

  await AuditLog.insertMany(auditLogs);
  console.log(`Successfully seeded ${auditLogs.length} curated audit logs for the showcase.`);
};