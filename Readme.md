# CV Analyzer API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A robust, scalable API for analyzing CVs against job descriptions, providing qualitative assessments and quantitative fit percentages. Built with TypeScript, Express, and Forefront’s LLM, it integrates PDF parsing, LinkedIn job scraping, and a custom scoring algorithm to deliver actionable insights for recruiters and developers.

## Features

- **CV Parsing**: Extracts text from PDF resumes using `pdf-parse`.
- **Job Description Scraping**: Fetches job details from LinkedIn URLs with `axios` and `cheerio`.
- **LLM Analysis**: Generates structured qualitative assessments and fit scores via Forefront’s Mistral-7B model with LangChain.
- **Performance Optimized**: Includes text sanitization, extended timeout retries, and efficient request handling.
- **Extensible**: Modular design with clear separation of concerns (controllers, services, middleware).

## Architecture

- **Entry Point**: `src/index.ts` - Initializes Express and loads environment variables.
- **Routing**: `src/routes/cvRoutes.ts` - Defines API endpoints.
- **Controllers**: `src/controllers/cvController.ts` - Handles request logic and response formatting.
- **Services**:
  - `src/services/pdfService.ts` - PDF text extraction.
  - `src/services/llmService.ts` - LangChain integration with Forefront API.
- **LLM**: `src/llms/forefrontLLM.ts` - Custom LangChain Runnable for Forefront LLM.
- **Middleware**: `src/middleware/uploadMiddleware.ts` - Manages file uploads with `multer`.
- **Build**: TypeScript compiled to `dist/` for production.

## Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Forefront API Key**: Obtain from [app.forefront.ai](https://app.forefront.ai/)
- **Environment**: `.env` file in the project root

## Installation

1. **Clone the Repository**:
```bash
   git clone https://github.com/louai-aloui/cv-analyzer-api.git
   cd cv-analyzer-api
```

2. **Install Dependencies**:
```bash
   npm install
```

3. **Set Up Environment Variables: Create a .env file from .env.example in the root directory**:
```bash
   FORE_FRONT_API_KEY=your_forefront_api_key
   FORE_FRONT_BASE_URL=https://api.forefront.ai/v1/chat/completions
   FORE_FRONT_MODEL=mistralai/Mistral-7B-v0.1
   PORT=3000
```

4. **Build the Project**:
```bash
   npm run build
```

5. **Run the Application**:
```bash
   npm run dev
```

## Usage

### Endpoint: `/api/upload-cv`

- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `cv` (file): PDF resume (required, field name: "cv").
  - `jobDescription` (string): Job description text (optional).
  - `linkedinJobUrl` (string): LinkedIn job URL (optional).
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "analysis": "Qualitative assessment of CV fit.",
      "fitPercentage": 85
    }

### Configuration

- Timeout: Configurable in forefrontLLM.ts (default: 60s, 3 retries with 2s delay).
- Default Job Description: Falls back to "Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS" if unspecified.
- LLM Model: Adjustable via FORE_FRONT_MODEL in .env (default: "mistralai/Mistral-7B-v0.1").
- Max Tokens: Set to 500 in forefrontLLM.ts for detailed responses; adjustable for performance.

### Performance Considerations

- Retry Logic: Handles Forefront API timeouts with 3 retries (2s delay each), up from 2 retries (1s delay).
- Timeout: Extended to 60s per request to accommodate larger CVs or slower API responses.
- Text Sanitization: Ensures clean input via sanitizeText in textSummerisation.ts.
- LLM-Driven Scoring: Fit percentage computed by the LLM, reducing local computation overhead.

### Extensibility

- Custom Models: Swap "mistralai/Mistral-7B-v0.1" in llmService.ts with other Forefront models (e.g., "phi-2").
- Prompt Tuning: Modify the prompt in llmService.ts for custom analysis formats or scoring logic.
- Caching: Add Redis or in-memory caching for repeated job descriptions in cvController.ts.
- Fallbacks: Extend cvController.ts with custom fallback logic for LLM failures.

### Developement

#### Scripts
- npm run build: Compile TypeScript to JavaScript (dist/).
- npm run dev: Run with nodemon for live reloading.
- npm start: Run the compiled app.
#### Dependencies
- express: Web framework.
- multer: File upload handling.
- axios: HTTP requests.
- cheerio: HTML parsing for LinkedIn scraping.
- pdf-parse: PDF text extraction.
- dotenv: Environment variable management.
- @langchain/core: LangChain integration for LLM processing.
#### Dev Dependencies
- typescript: Type safety and compilation.
- nodemon: Hot reloading for development.
- @types/*: Type definitions for Node.js packages.

### Contributing 

- Fork the repository.
- Create a feature branch (git checkout -b feature/xyz).
- Commit changes (git commit -m "Add XYZ feature").
- Push to the branch (git push origin feature/xyz).
- Open a pull request with detailed description and test cases.

### Licence

This project is licensed under the MIT License - see the  file for details.

### Contact

For questions or feedback, reach out to **louai.aloui@example.com** or open an issue on **GitHub**.