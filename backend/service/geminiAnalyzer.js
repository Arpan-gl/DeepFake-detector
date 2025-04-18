import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyC9HiiKleUtD2IhWUAmixl1FNRFsc_aWr8");

export async function analyzeWithGemini(title, content, source, analysisResultsByGroq, EmotionResponse = {}) {
  const prompt = `
    ${Object.keys(EmotionResponse).length === 0 ? "Analyze this news article for potential misinformation or fake news:" : "Analyze this image for potential misinformation or fake:"}

   📰 Article Details:
    Title: ${title}
    Source: ${source}
    Content: ${content}

    🦙 Context from LLaMA Analysis: 
    LLaMA has previously analyzed this article and shared the following findings: { "credibilityScore": ${analysisResultsByGroq.credibilityScore}, 
    "misleadingElements": ${JSON.stringify(analysisResultsByGroq.misleadingElements)}, 
    "verificationSteps": ${JSON.stringify(analysisResultsByGroq.verificationSteps)}, 
    "overallAssessment": "${analysisResultsByGroq.overallAssessment}" }

    ${Object.keys(EmotionResponse).length === 0 ? "" : `
    🤖 Hugging Face Model Response:
    Confidence: ${EmotionResponse.confidence*100}
    Prediction: ${EmotionResponse.prediction}
    Status: ${EmotionResponse.status}
    `}

    Please use this context to:
    1. Confirm or challenge LLaMA’s analysis.
    2. Add any additional insights or corrections.
    3. Provide a deeper second-layer assessment, using your own reasoning.
    4. Suggest improvements or highlight overlooked issues.
    ${Object.keys(EmotionResponse).length === 0 ? "5. Take LLaMA result as 25% and Gemini result as 75%." : "5. Take LLaMA result as 10%, Hugging Face model response as 30%, and Gemini result as 60%."}

    Evaluate based on:
    1. Credibility of source
    2. Presence of clickbait elements
    3. Emotional language
    4. Factual inconsistencies
    5. Balance of perspectives
    6. Citation of sources
    7. Expert opinions
    8. Recent publication
    
    Provide:
    - A credibility score from 0-100
    - Identification of potentially misleading statements
    - Recommended verification steps
    - An overall assessment
    
    Format response as JSON with these fields:
    {
      "credibilityScore": number,
      "misleadingElements": [string],
      "verificationSteps": [string],
      "overallAssessment": string
    }
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }

    throw new Error("Failed to parse JSON response");
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    return {
      credibilityScore: 50,
      misleadingElements: ["Error in analysis"],
      verificationSteps: ["Try again later"],
      overallAssessment: "Analysis failed due to technical error"
    };
  }
};