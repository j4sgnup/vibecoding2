
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

import { Organization } from '../src/models/Organization';
import { User } from '../src/models/User';
import { ServiceAccessLog } from '../src/models/ServiceAccessLog';

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

export const seedDatabase = async () => {
  // Clear existing data
  console.log('Clearing existing data...');
  await Organization.deleteMany({});
  await User.deleteMany({});
  await ServiceAccessLog.deleteMany({});
  console.log('Existing data cleared.');

  // --- Generate Parent Organizations ---
  const parentOrgs = [];
  for (let i = 0; i < 5; i++) {
    const parentOrg = new Organization({
      orgId: faker.string.uuid(),
      name: faker.company.name(),
      type: 'parent',
      contactDetails: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      servicesEnrolled: faker.helpers.arrayElements(services, { min: 2, max: 4 }),
    });
    parentOrgs.push(parentOrg);
  }
  await Organization.insertMany(parentOrgs);
  console.log(`Generated ${parentOrgs.length} parent organizations.`);

  // --- Generate Sister and Related Organizations ---
  const allOrgs = [...parentOrgs];
  for (const parentOrg of parentOrgs) {
    const numSisterOrgs = faker.number.int({ min: 3, max: 5 });
    for (let i = 0; i < numSisterOrgs; i++) {
      const sisterOrg = new Organization({
        orgId: faker.string.uuid(),
        name: faker.company.name(),
        type: 'sister',
        parentOrgId: parentOrg.orgId,
        contactDetails: {
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
        },
        servicesEnrolled: faker.helpers.arrayElements(services, { min: 1, max: 3 }),
      });
      allOrgs.push(sisterOrg);
    }

    const relatedOrg = new Organization({
      orgId: faker.string.uuid(),
      name: faker.company.name(),
      type: 'related',
      parentOrgId: parentOrg.orgId,
      contactDetails: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
      },
      servicesEnrolled: [], // For Insight 3
    });
    allOrgs.push(relatedOrg);
  }

  await Organization.insertMany(allOrgs.slice(parentOrgs.length));
  console.log(`Generated ${allOrgs.length - parentOrgs.length} sister and related organizations.`);

  // --- Generate Users, Roles, and Service Access Logs ---
  const users = [];
  const serviceAccessLogs = [];
  const roles = ['admin', 'standard', 'intermediary', 'assistant accountant', 'manager'];

  for (const org of allOrgs) {
    const teamMemberCount = faker.number.int({ min: 5, max: 10 });
    const intermediaryCount = faker.number.int({ min: 2, max: 5 });

    // For Insight 1 & 2
    if (faker.datatype.boolean(0.2)) { // 20% chance of no team members
      org.teamMembers = [] as any;
      org.intermediaries = [] as any;
      await org.save();
      continue;
    }

    for (let i = 0; i < teamMemberCount; i++) {
      const status = faker.helpers.arrayElement(['invited', 'in_progress', 'awaiting_approval', 'active']);
      const user = new User({
        userId: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        orgId: org.orgId,
        status: status,
        role: faker.helpers.arrayElement(roles.filter(r => r !== 'intermediary')),
        lastLoginAt: status === 'active' ? faker.date.recent({ days: 20 }) : null, // Changed to 20 days
      });
      users.push(user);
      org.teamMembers.push(user._id);
    }

    for (let i = 0; i < intermediaryCount; i++) {
      const status = faker.helpers.arrayElement(['invited', 'in_progress', 'awaiting_approval', 'active']);
      const user = new User({
        userId: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        orgId: org.orgId,
        status: status,
        role: 'intermediary',
        lastLoginAt: status === 'active' ? faker.date.recent({ days: 20 }) : null, // Changed to 20 days
      });
      users.push(user);
      org.intermediaries.push(user._id);
    }

    await org.save();
  }

  await User.insertMany(users);
  console.log(`Generated ${users.length} users.`);

  // --- Generate Service Access Logs ---
  for (const user of users) {
    if (user.status === 'active' && faker.datatype.boolean(0.8)) { // 80% of fully onboarded users have service access logs
      const org = allOrgs.find(o => o.orgId === user.orgId);
      if (org && org.servicesEnrolled.length > 0) {
        const serviceToLog = faker.helpers.arrayElement(org.servicesEnrolled);
        const serviceAccessLog = new ServiceAccessLog({
          userId: user._id,
          serviceId: serviceToLog,
          lastAccessedAt: faker.date.recent({ days: 180 }),
        });
        serviceAccessLogs.push(serviceAccessLog);
      }
    }

    // For Insight 5
    if (user.lastLoginAt === null) {
      // This user has a role but hasn't logged in.
      // The data is already structured to represent this.
    }
  }

  await ServiceAccessLog.insertMany(serviceAccessLogs);
  console.log(`Generated ${serviceAccessLogs.length} service access logs.`);

  console.log('Database seeding complete!');
};
