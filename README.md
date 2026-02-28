# Clarion – AI Research Pilot

Clarion is an AI-powered research workspace designed to help students and innovators discover, organize, draft, and collaborate on research papers efficiently. It streamlines the complete research workflow from idea discovery to final paper drafting using AI assistance and structured tools.

The application supports both dark and light themes for a flexible user experience.


## Features


### Discover Papers

The Discover Papers feature allows users to search for research papers by entering a topic of interest. Relevant papers are fetched using the ArXiv API, enabling users to review abstracts and details before saving them to their workspace. This helps users quickly explore any research domain.


### Workspace

Workspace acts as a personalized research hub where users can access all their saved research papers. Users can filter papers based on domain, upload PDFs from their local system, and manage research materials efficiently. It also integrates the AI Assistant for real-time research support.


### AI Research Assistant

The AI Research Assistant is built using LLaMA models and the Groq API. It answers research-related questions, explains methodologies, and suggests improvements or ideas to accelerate the research process.


### My Library

My Library allows users to organize and manage research papers in a structured manner. Users can edit paper details, add notes, mark favorites, and view impact factors. It also enables comparison of two research papers using AI for deeper analytical insights.


### Paper Drafting

The Paper Drafting feature enables users to generate research papers by providing a topic and additional input. Papers can be generated in standard formats such as IEEE, Springer, APA, ACM, and Elsevier. Users can refine contributions, compare drafts with existing research papers using ArXiv, and further edit them in the DocSpace Editor.


### DocSpace Editor

DocSpace is an integrated document editor similar to Google Docs. It allows users to edit, structure, and format research documents freely after AI-generated drafting.


### Research Guide

Research Guide helps beginners approach research systematically. It provides suggested domains, research papers, problem statements, methodology guidance, experiment ideas, gap analysis, and a final evaluation score. This structured flow prepares users before drafting a research paper.


### Contributions

The Contributions feature supports collaborative research. In "My Contributions," owners can create issues with specific questions for contributors. Contributors answer these questions, and if selected, they can work on solutions. Owners can review, rate, and maintain a contributor list within the platform.


## Tech Stack

Frontend:
- React.js
- Vite
- Tailwind CSS

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose

AI and APIs:
- ArXiv API
- Groq API
- LLaMA Models
- Gemini API

Authentication:
- JWT-based authentication


## Installation and Setup


### 1. Clone the Repository
```bash
git clone https://github.com/Neshmitha/Clarion-AI-Research-Pilot.git
cd Clarion-AI-Research-Pilot
```


### 2. Configure Environment Variables

Create a .env file inside the server folder and add the following:
```bash
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
LLAMA_CLOUD_API_KEY=your_llama_key
LLAMA_DEPLOYMENT_URL=your_llama_url
```

Ensure all environment variables are properly configured before running the application.


### 3. Run Backend
```bash
cd server
npm install
node index.js
```


### 4. Run Frontend
```bash
cd client
npm install
npm run dev
```


## Why Clarion

Research can be overwhelming without structure and guidance. Clarion simplifies the entire research lifecycle by combining paper discovery, AI assistance, drafting tools, and collaboration features into one intelligent system.

## Project Impact

Clarion reduces research complexity by integrating AI-driven discovery, guided research planning, drafting tools, and structured collaboration. It empowers students and innovators to move from idea to research paper efficiently.

## Conclusion

Clarion is built to simplify and structure the research journey for students, innovators, and collaborative teams. By integrating paper discovery, AI-powered assistance, guided research planning, drafting tools, and contribution systems into one unified platform, it reduces the complexity of academic research workflows.

The platform empowers users to move from idea exploration to structured research output with clarity and confidence.

> Clarion is designed to convert confusion into clarity.

