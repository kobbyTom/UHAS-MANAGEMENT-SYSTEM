const { GoogleGenAI } = require('@google/genai');

const generateLesson = async (req, res) => {
  try {
    const { subject, topic } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ success: false, message: 'Subject and topic are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return a beautifully formatted mock response for demonstration purposes
      const mockResponse = `## Lesson Plan: ${topic}
### Subject: ${subject}

### 1. Core Competencies
* **Critical Thinking and Problem Solving:** Students will analyze and solve real-world problems related to ${topic}.
* **Communication and Collaboration:** Students will discuss concepts in small groups.
* **Digital Literacy:** Students will use digital tools to research aspects of ${topic}.

### 2. Learning Objectives
By the end of the lesson, the student will be able to:
1. Define the key concepts of ${topic}.
2. Apply the principles of ${topic} to solve at least 3 standard problems.
3. Explain the relevance of ${topic} in everyday life.

### 3. Reference Materials
* GES Standard Curriculum for ${subject}
* Class Textbook (Pages 45 - 52)
* Educational charts and digital projector

### 4. Teaching/Learning Activities

#### Introductory Phase (10 mins)
* **Recap:** Briefly review the previous lesson.
* **Brainstorming:** Ask students what they already know about ${topic}.
* **Hook:** Show a short 2-minute video or physical demonstration related to ${topic} to spark interest.

#### Development Phase (30 mins)
* **Activity 1 (Teacher-Led):** Explain the core concepts of ${topic} using the whiteboard. Break down complex definitions into simple terms.
* **Activity 2 (Group Work):** Divide students into groups of 4. Give them a practical problem related to ${topic} to solve collaboratively.
* **Activity 3 (Presentation):** Have one representative from each group present their findings to the class.

#### Plenary/Closure (10 mins)
* **Summary:** Highlight the main points covered during the lesson.
* **Q&A:** Open the floor for any lingering questions.

### 5. Assessment
* **Formative:** Observe group discussions and presentations.
* **Summative:** Assign a 5-question worksheet on ${topic} to be completed individually before the end of class.

---
> *Note: This is a system-generated demonstration lesson plan because the Gemini API Key has not been configured in the server's \`.env\` file. Add your \`GEMINI_API_KEY\` to enable real AI generation!*`;

      return res.json({ success: true, data: mockResponse });
    }

    // Initialize inside the handler to prevent crashing the server on startup if the key is missing
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are an expert curriculum developer for the Ghana Education Service (GES).
Create a comprehensive lesson plan for the subject '${subject}' on the specific topic '${topic}'.
The lesson plan MUST follow the official GES format and include the following sections exactly:
1. Core Competencies
2. Learning Objectives
3. Reference Materials
4. Teaching/Learning Activities (Introductory phase, Development phase, Plenary/Closure)
5. Assessment

Format your response purely in Markdown, using clean headers (##), bold text, and bullet points. Do not use generic pleasantries, just return the lesson plan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      data: response.text
    });

  } catch (error) {
    console.error('Error generating lesson:', error);
    res.status(500).json({ success: false, message: 'Failed to generate lesson plan. ' + error.message });
  }
};

module.exports = {
  generateLesson
};
