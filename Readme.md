# CV Analyzer API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A robust, scalable API for analyzing CVs against job descriptions, providing qualitative assessments and quantitative fit percentages. Built with TypeScript, Express, and Forefront’s LLM, it integrates PDF parsing, LinkedIn job scraping, and a custom scoring algorithm to deliver actionable insights for recruiters and developers.

## Features

- **CV Parsing**: Extracts text from PDF resumes using `pdf-parse`.
- **Job Description Scraping**: Fetches job details from LinkedIn URLs with `axios` and `cheerio`.
- **LLM Analysis**: Generates qualitative assessments via Forefront’s Mistral-7B model.
- **Fit Percentage**: Calculates a numerical fit score based on skills, experience, and keywords.
- **Performance Optimized**: Includes text summarization, timeout retries, and efficient request handling.
- **Extensible**: Modular design with clear separation of concerns (controllers, services, middleware).

## Architecture

- **Entry Point**: `src/index.ts` - Initializes Express and loads environment variables.
- **Routing**: `src/routes/cvRoutes.ts` - Defines API endpoints.
- **Controllers**: `src/controllers/cvController.ts` - Handles request logic, fit percentage calculation, and response formatting.
- **Services**:
  - `src/services/pdfService.ts` - PDF text extraction.
  - `src/services/llmService.ts` - LLM integration with Forefront API.
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

3. **Set Up Environment Variables: Create a .env file in the root directory**:
```bash
   FORE_FRONT_API_KEY=your_forefront_api_key
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

- Timeout: Adjustable in llmService.ts (default: 30s) and cvController.ts (LinkedIn fetch: 10s).
- Fit Scoring: Weights in calculateFitPercentage (skills: 40%, experience: 30%, keywords: 30%).
- Skills List: Expandable in cvController.ts for custom skill matching.
- Default Job Description: Falls back to "Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS" if unspecified.

### Performance Considerations

- Text Summarization: Limits CV input to 1000 characters for faster LLM processing.
- Retry Logic: Handles Forefront API timeouts with 2 retries (1s delay).
- Local Scoring: Fit percentage computed locally to reduce LLM dependency.
- Optimized Payloads: Reduced max_tokens to 150 for quicker responses.

### Extensibility

- Custom Models: Swap "mistralai/Mistral-7B-v0.1" in llmService.ts with other Forefront models (e.g., "phi-2").
- Scoring Logic: Modify weights or add new metrics (e.g., certifications) in calculateFitPercentage.
- Caching: Add Redis or in-memory caching for repeated job descriptions.
- NLP: Integrate advanced NLP (e.g., spaCy) for better keyword extraction.

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