
import { GoogleGenAI } from "@google/genai";
import type { GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface JobSearchResult {
  summary: string;
  sources: GroundingChunk[];
  rawJobDescriptions: string;
}

export const analyzeResumeAndFindJobs = async (resumeText: string, onProgress: (message: string) => void): Promise<JobSearchResult> => {
  try {
    // Step 1: Use Gemini with Google Search to find job descriptions
    onProgress("Analyzing your resume and searching for relevant jobs...");
    const searchModel = "gemini-2.5-flash";
    const searchPrompt = `Based on the following resume, search the web for 3-5 highly relevant job postings for software engineering or related roles. For each job posting found, extract and return the job title, company name, and a detailed summary of the key responsibilities and qualifications. \n\n---RESUME---\n${resumeText}`;
    
    const searchResult = await ai.models.generateContent({
        model: searchModel,
        contents: searchPrompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    const jobDescriptions = searchResult.text;
    const sources = searchResult.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (!jobDescriptions || jobDescriptions.trim() === "") {
        throw new Error("The AI could not find any job descriptions based on the provided resume. This might be due to a very niche resume or a temporary issue with the search. Please try rephrasing your resume or try again later.");
    }

    // Step 2: Use Gemini Pro to summarize the job descriptions
    onProgress("Found jobs! Summarizing the key details for you...");
    const summaryModel = "gemini-2.5-pro";
    const summaryPrompt = `You are an expert career coach. Based on the user's resume and the following job descriptions, provide a concise summary. 
    
    Follow these instructions:
    1.  Create a main heading "Personalized Job Summary".
    2.  For each job, create a subheading like "Job Opportunity 1", "Job Opportunity 2", etc.
    3.  Under each job subheading, list the key responsibilities and required skills in bullet points.
    4.  After summarizing all jobs, create a final section with the heading "Overall Skill Alignment".
    5.  In this final section, provide a paragraph summarizing how the user's skills from their resume align with these roles and suggest 2-3 key areas they should emphasize in their applications.
    
    Format the entire output in clean Markdown.

    ---USER RESUME---
    ${resumeText}

    ---JOB DESCRIPTIONS---
    ${jobDescriptions}`;

    const summaryResult = await ai.models.generateContent({
        model: summaryModel,
        contents: summaryPrompt,
    });
    
    onProgress("Finalizing your personalized report...");
    const summary = summaryResult.text;

    return { summary, sources, rawJobDescriptions: jobDescriptions };
  } catch (error) {
    console.error("Error in Gemini service:", error);
    if (error instanceof Error) {
        return Promise.reject(new Error(`An error occurred while processing your request: ${error.message}`));
    }
    return Promise.reject(new Error("An unknown error occurred while processing your request."));
  }
};