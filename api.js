
import { GoogleGenAI } from "@google/genai";
import { API_KEY } from './config.js';

// Initialize the Google Gemini AI client
// This will fail if the API_KEY in config.js is not set.
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Converts a Blob object to a Base64 encoded string.
 * @param {Blob} blob The blob to convert.
 * @returns {Promise<string>} A promise that resolves with the base64 string.
 */
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

/**
 * Sends audio data to the Gemini API for transcription.
 * @param {Blob} audioBlob The audio data to transcribe.
 * @returns {Promise<string>} A promise that resolves with the transcription text.
 */
export async function transcribeAudio(audioBlob) {
    if (API_KEY === "YOUR_API_KEY_HERE") {
        console.error("API Key not set in config.js");
        return "Error: API Key is not configured. Please set it in config.js.";
    }
    const base64Audio = await blobToBase64(audioBlob);
    const audioPart = {
        inlineData: {
            mimeType: 'audio/webm',
            data: base64Audio,
        },
    };
    const textPart = { text: "Transcribe this meeting audio." };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
    });
    return response.text;
}

/**
 * Generates descriptive text for a series of screenshot steps using the Gemini API.
 * @param {Array<object>} capturedSteps Array of step objects, each with an imageData property.
 * @returns {Promise<Array<object>>} A promise that resolves with the steps array, now including descriptions.
 */
export async function generateGuideFromSteps(capturedSteps) {
    if (API_KEY === "YOUR_API_KEY_HERE") {
        console.error("API Key not set in config.js");
        return capturedSteps.map(step => ({ ...step, description: "Error: API Key is not configured." }));
    }

    const prompt = `Analyze this screenshot from a screen recording of a web application. Your task is to describe the single most important user action captured in the image. 
- Formulate the description as a clear, concise, imperative instruction. 
- For example: "Click on the 'File' menu in the top navigation bar." or "Enter your password into the 'Password' field."
- Be specific about the UI element (e.g., button, link, input field, dropdown) and its label.
- If no obvious action is taking place, describe the current view, for example: "View the 'Dashboard' page."`;

    const descriptionPromises = capturedSteps.map(step => {
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: step.imageData.split(',')[1] } };
        const textPart = { text: prompt };
        return ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        }).then(response => response.text)
        .catch(err => {
            console.error("Error generating step description:", err);
            return "Error describing this step.";
        });
    });

    const descriptions = await Promise.all(descriptionPromises);
    
    return capturedSteps.map((step, index) => ({
        ...step,
        description: descriptions[index] || "Could not generate description for this step.",
    }));
};
