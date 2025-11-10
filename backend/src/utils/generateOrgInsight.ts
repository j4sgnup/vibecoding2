import { faker } from "@faker-js/faker";
import { llm } from "./generateAIResponse"; // Import the shared LLM client
import { getFeatureSettings } from "../controllers/settingsController";

interface User {
  status: string;
  lastLoginAt: Date | string | null;
}

interface OrgInsightData {
  name: string;
  teamMembers: User[];
  intermediaries: User[];
  servicesEnrolled: string[];
  type: 'parent' | 'sister' | 'related';
  parentServicesEnrolled?: string[]; // New optional property
}

interface GeneratedInsights {
  aiInsight: string;
  otherInsights: string[];
}

/**
 * Analyzes high-level organization data to generate a concise insight.
 * @param orgData - The data for the organization.
 * @returns A single, AI-generated insight string.
 */
export async function generateOrgInsight(orgData: OrgInsightData): Promise<GeneratedInsights> {
  const { name, teamMembers, intermediaries, servicesEnrolled, type, parentServicesEnrolled } = orgData;
  const { isAiEnabled } = getFeatureSettings();
  const otherInsights: string[] = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let aiInsightResult: string;

  if (isAiEnabled) {
    // Construct prompt for AI
    let prompt = `Generate a concise, actionable insight for the organization "${name}" based on the following data:
`;
    prompt += `- Organization Type: ${type}
`;
    prompt += `- Services Enrolled: ${servicesEnrolled.length > 0 ? servicesEnrolled.join(', ') : 'None'}
`;

    const inactiveTeamMembers = teamMembers.filter(
      m => m.status === 'active' && m.lastLoginAt && new Date(m.lastLoginAt).getTime() < thirtyDaysAgo
    );
    if (teamMembers.length > 0) {
      prompt += `- Total Team Members: ${teamMembers.length}
`;
      if (inactiveTeamMembers.length > 0) {
        prompt += `- Inactive Team Members (last login over 30 days ago): ${inactiveTeamMembers.length}
`;
      }
    } else {
      prompt += `- No Team Members found.
`;
    }

    if (intermediaries.length > 0) {
      prompt += `- Intermediaries: ${intermediaries.length}
`;
    } else {
      prompt += `- No Intermediaries assigned.
`;
    }

    if ((type === 'sister' || type === 'related') && parentServicesEnrolled && parentServicesEnrolled.length > 0) {
      prompt += `- Parent Organization Services: ${parentServicesEnrolled.join(', ')}
`;
      const potentialSynergies = parentServicesEnrolled.filter(
        service => !servicesEnrolled.includes(service)
      );
      if (potentialSynergies.length > 0) {
        prompt += `- Services offered by parent organization that this organization is not currently using: ${potentialSynergies.join(', ')}
`;
      }
    }

    prompt += `
Focus on opportunities for growth, engagement, or improvement. Keep it to one sentence. Do not include any XML tags like <think> in your response.`;

    try {
      const response = await llm.invoke(prompt);
      // Clean the response to remove any XML-like thinking tags
      aiInsightResult = response.content.toString().replace(/<think>[\s\S]*?<\/think>/, '').trim();
    } catch (error) {
      console.error("Failed to generate AI response, falling back to default insight:", error);
      aiInsightResult = `Unable to generate AI insight for ${name} at this time.`;
    }
  } else {
    aiInsightResult = "AI processing is currently disabled by the administrator.";
  }

  // Other Insights Logic (can remain rule-based or be enhanced)
  const inactiveTeamMembers = teamMembers.filter(
    m => m.status === 'active' && m.lastLoginAt && new Date(m.lastLoginAt).getTime() < thirtyDaysAgo
  );
  if (inactiveTeamMembers.length > 0) {
    otherInsights.push(`This organization has ${inactiveTeamMembers.length} inactive users (last login over 30 days ago). Consider a re-engagement strategy.`);
  }

  const allPossibleServices = [
    'Cloud Storage', 'Data Analytics', 'Cybersecurity Suite', 'CRM Integration',
    'HR Management', 'Financial Reporting', 'Project Management', 'Customer Support Portal'
  ];
  const unenrolledServices = allPossibleServices.filter(service => !servicesEnrolled.includes(service));

  if (unenrolledServices.length > 0 && servicesEnrolled.length < allPossibleServices.length) {
    const suggestedService = faker.helpers.arrayElement(unenrolledServices);
    otherInsights.push(`Consider offering '${suggestedService}' to ${name} to expand their service portfolio.`);
  } else if (servicesEnrolled.length === 0) {
    otherInsights.push(`This organization has no services enrolled. A great opportunity for initial engagement.`);
  }

  // Dynamic Service Synergy Insight
  if ((type === 'sister' || type === 'related') && parentServicesEnrolled && parentServicesEnrolled.length > 0) {
    const potentialSynergies = parentServicesEnrolled.filter(
      service => !servicesEnrolled.includes(service)
    );
    if (potentialSynergies.length > 0) {
      const suggestedSynergy = faker.helpers.arrayElement(potentialSynergies);
      otherInsights.push(`Opportunity for service synergy: Parent organization uses '${suggestedSynergy}'. Consider introducing it to ${name}.`);
    }
  }

  return {
    aiInsight: aiInsightResult,
    otherInsights: otherInsights,
  };
}
