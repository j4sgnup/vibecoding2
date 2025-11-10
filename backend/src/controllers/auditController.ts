import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { llm } from '../utils/generateAIResponse'; // Import the shared LLM client
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import crypto from 'crypto';
import { getFeatureSettings } from './settingsController';

// In-memory cache for search results
const searchCache = new Map<string, any>();

const auditLogSchemaDescription = `
// Top-level fields for every audit log event:
{{
  timestamp: Date, // The exact time of the event
  actorName: String, // The name of the user who performed the action
  actorEmail: String, // The email of the user who performed the action
  actionType: String, // The type of event that occurred
  targetEntityName: String, // The name of the entity (user, org, service) that was affected
  status: String, // "success" or "failure"
  location: String, // The geographic location of the actor
  details: Object // An object containing data specific to the actionType
}}

// Structure of the 'details' object based on actionType:
// if actionType is "role_modified": {{ "oldRole": String, "newRole": String, "approvedBy": String, "organizationName": String }}
// if actionType is "team_member_removed": {{ "reason": String }}
// if actionType is "service_enrolled": {{ "serviceName": String, "organizationName": String }}
// if actionType is "user_login": {{ "loginMethod": String, "reason": String // (only on failure) }}
`;

export const searchAuditLogs = async (req: Request, res: Response) => {
  try {
    const { tags, query: naturalLanguageQuery } = req.body;
    const { isAiEnabled } = getFeatureSettings();

    // Create a unique cache key for this specific search
    const cacheKey = crypto.createHash('md5').update(JSON.stringify({ tags, naturalLanguageQuery })).digest('hex');

    // Check if the result is already in the cache
    if (searchCache.has(cacheKey)) {
      console.log(`[Cache HIT] Serving from cache for key: ${cacheKey}`);
      return res.status(200).json(searchCache.get(cacheKey));
    }

    // If AI is required but disabled, and not in cache, return a specific message.
    if (naturalLanguageQuery && !isAiEnabled) {
      console.log('[AI Block] Search requires AI, but it is disabled.');
      return res.status(200).json({ 
        total: 0, 
        logs: [], 
        aiUsed: false, 
        message: "AI is disabled. Cannot perform natural language search."
      });
    }

    console.log(`[Cache MISS] Performing new search for key: ${cacheKey}`);

    const conditions: any[] = [];
    let aiUsed = false;

    // 1. Deterministically handle tags first.
    if (tags && tags.length > 0) {
      conditions.push({ actionType: { $in: tags } });
    }

    // 2. If there is a natural language query, call the AI to process it.
    if (naturalLanguageQuery && isAiEnabled) {
      aiUsed = true;
      try {
        const currentDate = new Date().toISOString();
        const prompt = new PromptTemplate({
          template: `You are an expert AI assistant that converts a natural language query into a MongoDB query filter. You are an expert AI assistant that converts a natural language query into a MongoDB query filter object.

          **Current Date:** {current_date}. Use this as a reference for any relative date queries (e.g., "yesterday", "last month").

          **User's Natural Language Query:**
          "{query}"

          **Your Task:**
          Create a single JSON filter object based on the user's query. Analyze the query for keywords, names, dates, and relationships and map them to the schema below.

          **Schema and Field Guide:**
          ${auditLogSchemaDescription}

          **Query Construction Rules:**
          1.  For date ranges, use "$gte" and "$lt".
          2.  If the query mentions a person (e.g., "John Doe", "Raymond Hudson"), search in BOTH the "actorName" and "targetEntityName" fields unless the query specifies their role (e.g., "actions by...", "...was removed").
          3.  If the user mentions an organization (e.g., "Trinity Environment Services"), search in the "details.organizationName" field.
          4.  If the user mentions a service, search in the "details.serviceName" field.
          5.  If the user mentions a failure or success, use the "status" field.
          6.  **Crucially, if the query mentions a user being 'removed' or 'deleted', you must map this to \`actionType: 'team_member_removed'\`**.
          7.  Return ONLY the raw JSON for the filter object. Do not include any extra text, explanations, or markdown.
          `,
          inputVariables: ["query", "current_date"],
        });

        const chain = prompt
          .pipe(llm)
          .pipe(new StringOutputParser())
          .pipe((input: string) => {
            const cleanedFromThink = input.replace(/<think>[\s\S]*?<\/think>/, '').trim();
            const cleanedFromIsoDate = cleanedFromThink.replace(/ISODate\((".*?")\)/g, '$1');
            return new JsonOutputParser().invoke(cleanedFromIsoDate);
          });

        const aiFilter = await chain.invoke({ 
          query: naturalLanguageQuery,
          current_date: currentDate
        });

        console.log('AI-Generated Filter Part:', JSON.stringify(aiFilter, null, 2));
        conditions.push(aiFilter);

      } catch (aiError) {
        console.error('Error calling AI for query generation:', aiError);
        res.status(500).json({ message: "AI query generation failed." });
        return;
      }
    } 

    // 3. Combine all conditions into the final query.
    let mongoQuery = {};
    if (conditions.length > 0) {
      mongoQuery = { $and: conditions };
    }

    console.log('Final Combined MongoDB Query:', JSON.stringify(mongoQuery, null, 2));

    const total = await AuditLog.countDocuments(mongoQuery);
    const auditLogs = await AuditLog.find(mongoQuery).sort({ timestamp: -1 }).limit(100);

    const result = { total, logs: auditLogs, aiUsed };

    // Store the result in the cache for next time
    searchCache.set(cacheKey, result);

    res.status(200).json(result);

  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
