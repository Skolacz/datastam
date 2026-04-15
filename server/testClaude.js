// testClaude.js
require('dotenv').config();
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');
const promptTemplates = require('./prompts/promptTemplates');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const postsToGenerate = [
  { topic: 'AI in Education', audience: 'educators and edtech professionals', tone: 'professional', goal: 'engage and educate', keywords: 'AI, EdTech, learning' },
  { topic: 'Remote Work Productivity', audience: 'remote workers and managers', tone: 'informative', goal: 'share productivity tips', keywords: 'remote work, productivity, tools' },
];

async function testClaude() {
  const allGeneratedPosts = {};

  for (const { topic, audience, tone, goal, keywords } of postsToGenerate) {
    // Store posts per topic
    allGeneratedPosts[topic] = {};

    for (const [platform, template] of Object.entries(promptTemplates)) {
      // Replace placeholders in the template with actual values
      const prompt = template
        .replace('{topic}', topic)
        .replace('{audience}', audience || '')
        .replace('{goal}', goal || '')
        .replace('{tone}', tone || '')
        .replace('{keywords}', keywords || '');

      try {
        // Call Claude model with the generated prompt
        const response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
        });

        // Extract the text content from the response
        const text = response.content?.find(block => block.type === 'text')?.text ?? 'No text returned';

        console.log(`=== ${platform.charAt(0).toUpperCase() + platform.slice(1)} Response ===\n`, text, '\n');

        // Save the text in the results object
        allGeneratedPosts[topic][platform] = text;

      } catch (err) {
        console.error(`Error generating ${platform} post for topic "${topic}":`, err);
        allGeneratedPosts[topic][platform] = null;
      }
    }
  }

  // Save all generated posts to a JSON file
  fs.writeFileSync('generatedPosts.json', JSON.stringify(allGeneratedPosts, null, 2));
  console.log('All posts saved to generatedPosts.json');
}

testClaude();