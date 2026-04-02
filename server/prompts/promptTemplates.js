// prompts/promptTemplates.js
const promptTemplates = {
  linkedin: `Generate a professional LinkedIn post about {topic}.
Target audience: {audience}.
Goal: {goal}.
Use a professional tone, include 2-3 key insights, and end with a call-to-action.

CRITICAL: Only use numbers provided in the section text and insights. 
Do not invent, estimate, or extrapolate any data points.`,

  twitter: `Create a tweet about {topic}.
Tone: {tone} (e.g., witty, informative, motivational).
Max 280 characters.
Include relevant hashtags from {keywords}.
Avoid making unsupported claims.

CRITICAL: Only use numbers provided in the section text and insights. 
Do not invent, estimate, or extrapolate any data points.`,

  instagram: `Write an Instagram caption for a post about {topic}.
Audience: {audience}
Style: {tone} (e.g., casual, inspiring, fun)
Include 3-5 hashtags from {keywords}
Suggest a short visual description to accompany the caption.

CRITICAL: Only use numbers provided in the section text and insights. 
Do not invent, estimate, or extrapolate any data points.`
};

module.exports = promptTemplates;