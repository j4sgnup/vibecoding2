import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Organization } from './models/Organization';
import { User } from './models/User';
import dotenv from 'dotenv';
import { generateReminderMessage } from './utils/generateReminderMessage';
import { generateOrgInsight } from './utils/generateOrgInsight';

dotenv.config();

import path from 'path';
const app = express();
const port = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/acm-poc-01';
const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;

import auditRoutes from './routes/auditRoutes';
import alertRoutes from './routes/alertRoutes';
import simulationRoutes from './routes/simulationRoutes';
import settingsRoutes from './routes/settingsRoutes';

// Serve static files from the public directory (for frontend)
app.use(express.static(path.join(__dirname, '../../public')));

app.use(cors());
app.use(express.json());
app.use('/api/audit', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/simulate', simulationRoutes);
app.use('/api/settings', settingsRoutes);

// API-only backend - no UI routes needed

// MongoDB connection with better error handling
mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database name:', mongoose.connection.name);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('MONGO_URI (masked):', MONGO_URI.replace(/:[^:@]*@/, ':****@'));
});

// In-memory cache for AI insights
const insightCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

app.get('/api/orgs', async (req, res) => {
  try {
    console.log('Fetching organizations...');
    // Find all organizations that have at least one user in the users collection.
    const orgsWithUsers = await User.distinct('orgId');
    console.log('Found org IDs:', orgsWithUsers.length);
    const orgs = await Organization.find({ orgId: { $in: orgsWithUsers } });
    console.log('Found organizations:', orgs.length);
    res.json(orgs);
  } catch (error) {
    console.error('Error in /api/orgs:', error);
    res.status(500).json({ 
      message: 'Error fetching organizations', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New endpoint to fetch a single organization by orgId
app.get('/api/orgs/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;
    const org = await Organization.findOne({ orgId });
    if (org) {
      res.json(org);
    } else {
      res.status(404).json({ message: 'Organization not found' });
    }
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ message: 'Error fetching organization' });
  }
});

// New endpoint for flexible user search (POST for complex filters)
app.post('/api/users', async (req, res) => {
  try {
    const { status, role, orgId, name, email } = req.body;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }
    if (role) {
      filter.role = role;
    }
    if (orgId) {
      filter.orgId = orgId;
    }
    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    }
    if (email) {
      filter.email = { $regex: email, $options: 'i' }; // Case-insensitive search
    }

    const users = await User.find(filter);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/orgs/:orgId/users', async (req, res) => {
  try {
    const users = await User.find({ orgId: req.params.orgId });
    if (users) {
      res.json(users);
    } else {
      res.status(404).send('Org not found or has no users');
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Temporary route for testing insights
app.get('/api/orgs/:orgId/insight', async (req, res) => {
  try {
    const { orgId } = req.params;

    // Check cache first
    const cachedInsight = insightCache.get(orgId);
    if (cachedInsight && (Date.now() - cachedInsight.timestamp < CACHE_DURATION)) {
      console.log(`[Insight Cache] Returning cached insight for orgId: ${orgId}`);
      return res.json(cachedInsight.data);
    }

    console.log(`[Insight Cache] Generating new insight for orgId: ${orgId}`);
    const org = await Organization.findOne({ orgId: req.params.orgId })
      .populate('teamMembers')
      .populate('intermediaries');

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    let parentServicesEnrolled: string[] | undefined;
    if (org.type === 'sister' || org.type === 'related') {
      const parentOrg = await Organization.findOne({ orgId: org.parentOrgId });
      if (parentOrg) {
        parentServicesEnrolled = parentOrg.servicesEnrolled as string[];
      }
    }

    const insightData = {
      name: org.name as string,
      teamMembers: org.teamMembers.map((u: any) => ({ status: u.status, lastLoginAt: u.lastLoginAt })),
      intermediaries: org.intermediaries.map((u: any) => ({ status: u.status, lastLoginAt: u.lastLoginAt })),
      servicesEnrolled: org.servicesEnrolled as string[],
      type: org.type as 'parent' | 'sister' | 'related',
      parentServicesEnrolled: parentServicesEnrolled,
    };

    const insights = await generateOrgInsight(insightData);

    // Cache the new insight
    insightCache.set(orgId, { data: insights, timestamp: Date.now() });
    console.log(`[Insight Cache] Generated and cached new insight for orgId: ${orgId}`);
    console.log(`[Insight Content] AI Insight: ${insights.aiInsight}`);
    console.log(`[Insight Content] Other Insights: ${JSON.stringify(insights.otherInsights)}`);

    res.json(insights);
  } catch (error) {
    console.error('Error generating insight:', error);
    res.status(500).json({ message: 'Error generating insight' });
  }
});

app.get('/api/orgs/:orgId/structure', async (req, res) => {
  try {
    const { orgId } = req.params;

    const mainOrg = await Organization.findOne({ orgId: orgId })
      .populate('teamMembers')
      .populate('intermediaries');

    if (!mainOrg) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    let childrenOrgs: any[] = [];
    if (mainOrg.type === 'parent') {
      childrenOrgs = await Organization.find({ parentOrgId: orgId, type: { $in: ['sister', 'related'] } })
        .populate('teamMembers')
        .populate('intermediaries');
    }

    const responseStructure: any = {
      organization: {
        ...mainOrg.toObject(),
        children: childrenOrgs.map(child => child.toObject())
      }
    };

    res.json(responseStructure);

  } catch (error) {
    console.error('Error fetching organization structure:', error);
    res.status(500).json({ message: 'Error fetching organization structure' });
  }
});

app.get('/api/users/unopened-invites', async (req, res) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const unopenedInvites = await User.find({
      inviteOpenedAt: null,
      inviteSentAt: { $lt: threeDaysAgo },
      status: 'invited', // Only consider users with 'invited' status
    });
    res.json(unopenedInvites);
  } catch (error) {
    console.error('Error fetching unopened invites:', error);
    res.status(500).json({ message: 'Error fetching unopened invites' });
  }
});

app.post('/api/invites/reminders', async (req, res) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const invitesToRemind = await User.find({
      inviteOpenedAt: null,
      inviteSentAt: { $lt: threeDaysAgo },
      status: 'invited', // Only consider users with 'invited' status
    });

    for (const invite of invitesToRemind) {
      // Assuming invite.name and invite.orgName exist on the User model
      // You might need to adjust these field names based on your User schema
      const reminderMessage = await generateReminderMessage(invite.name, invite.name);
      console.log(`Generated reminder for ${invite.email}:\n${reminderMessage}`);
    }

    res.json(invitesToRemind);
  } catch (error) {
    console.error('Error fetching invites for reminders:', error);
    res.status(500).json({ message: 'Error fetching invites for reminders' });
  }
});

app.get('/api/test-ai', async (req, res) => {
  try {
    const { llm } = require('./utils/generateAIResponse');
    const testResponse = await llm.invoke("Say hello in one sentence.");
    console.log('AI Test Response:', testResponse);
    res.json({ 
      success: true, 
      response: testResponse.content.toString(),
      message: "AI is working correctly"
    });
  } catch (error: unknown) {
    console.error('AI Test Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "AI test failed"
    });
  }
});

// Test the exact prompt that's failing in generateOrgInsight
app.get('/api/test-org-prompt', async (req, res) => {
  try {
    const { llm } = require('./utils/generateAIResponse');
    const testPrompt = `Generate a concise, actionable insight for the organization "Test Company" based on the following data:
- Organization Type: parent
- Services Enrolled: Cloud Storage, Data Analytics
- Total Team Members: 5
- Inactive Team Members (last login over 30 days ago): 2
- No Intermediaries assigned.

Focus on opportunities for growth, engagement, or improvement. Keep it to one sentence. Do not include any XML tags like <think> in your response.`;
    
    console.log('Testing org insight prompt...');
    const response = await llm.invoke(testPrompt);
    console.log('Org Test Response:', response);
    res.json({ 
      success: true, 
      response: response.content.toString(),
      prompt: testPrompt,
      message: "Organization insight test successful"
    });
  } catch (error: unknown) {
    console.error('Org Test Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Organization insight test failed"
    });
  }
});

// Test endpoint for OpenAI
app.get('/api/test-openai', async (req, res) => {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Say hello in one sentence." }],
      model: "gpt-3.5-turbo",
      max_tokens: 50,
    });
    
    res.json({ 
      success: true, 
      response: completion.choices[0].message.content,
      message: "OpenAI test successful",
      model: "gpt-3.5-turbo"
    });
  } catch (error: unknown) {
    console.error('OpenAI Test Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "OpenAI test failed"
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Changes for vercel deployment
// if (process.env.NODE_ENV !== 'production') {
//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// export default app;
