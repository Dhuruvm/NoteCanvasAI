## NoteGPT - AI Study Notes Generator

### Overview
NoteGPT is a full-stack web application that transforms text content and PDF documents into structured study notes using AI. It leverages Google's Gemini AI and a multi-model visual AI system to analyze and process content, generating organized notes with key concepts, summary points, and process flows. The project aims to provide an advanced, visually rich, and interactive learning tool.

### User Preferences
Preferred communication style: Simple, everyday language.

### System Architecture
NoteGPT employs a modern full-stack architecture with clear separation of concerns, prioritizing multi-model AI processing for superior visual output, real-time user feedback, comprehensive PDF generation with proper typography, and advanced visual elements including charts and infographics.

**UI/UX Decisions:**
- Modern animated landing page design with a pure black background, bold geometric fonts, and subtle animations.
- Black and grayish blue (#99AAB5) color scheme throughout the application.
- Implementation of glassmorphism effects, premium button animations, and logo glow effects.
- Responsive design for mobile devices, including collapsible navigation and optimized layouts.
- Dynamic loading pages with animated NoteGPT logo and progress indicators.
- User interface includes drag-and-drop file upload, real-time processing feedback, and a tabbed workspace.
- Integration of a "PROTOTYPE" tag and a "BETA" badge to indicate application status.
- Consistent use of bold typography text logos across all pages.

**Technical Implementations:**
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Radix UI/shadcn/ui for components, Tailwind CSS for styling, and Vite as the build tool.
- **Backend**: Node.js with Express.js, TypeScript, Drizzle ORM for database interaction, Multer for file uploads, and PDF-lib for PDF generation.
- **Core Features**:
    - Content Processing Pipeline: Handles text input and PDF uploads, with AI processing for structured note generation.
    - AI Integration: Uses Google Gemini AI (gemini-2.5-flash model) for content analysis with configurable processing settings (academic, bullet points, mind map, Q&A styles) and JSON-structured response parsing.
    - Advanced Chat with PDF System: Interactive AI conversations, intelligent question prediction, multi-difficulty learning paths, real-time quiz generation, and a gamified rewards system.
    - Note Management: Real-time processing status tracking, note storage, PDF export, and a template system.
    - File Processing: Supports PDF, TXT, MD files (10MB limit) with text extraction and generation capabilities.

**Feature Specifications:**
- Comprehensive visual AI generation with 6+ specialized AI models (Visual AI Generator, Layout Optimizer, Font AI, Color AI, Structure AI, Design AI) for creating charts, infographics, and optimizing PDF layouts.
- Real-time PDF preview with proper fonts and responsive design.
- Multi-model AI processing pipeline combining Google Gemini AI with Hugging Face models (Mixtral-8x7B-Instruct, BERT, LayoutLM) for enhanced content analysis, layout analysis, content enhancement, and design optimization.
- Advanced PDF generation interface with design style options (Academic, Modern, Minimal, Colorful) and color scheme selection.
- Implementation of full mobile responsiveness across all components.
- Enhanced dark mode support with proper color variables and contrast ratios.
- AI processing speed optimization through the use of the faster gemini-2.5-flash model, timeouts, and content length limits.

**System Design Choices:**
- **Database**: PostgreSQL with Drizzle ORM and Neon Database (serverless PostgreSQL) for robust data storage and scalability. Schema includes tables for notes, templates, chat sessions, chat messages, user progress, and predicted questions.
- **Data Flow**: Content input (text/file) leads to AI processing via Gemini AI, structured response parsing, storage in PostgreSQL, and retrieval for export (PDF generation).
- **Deployment Strategy**: Utilizes Vite for frontend build and esbuild for backend bundling. Designed for deployment on platforms like Render and Cloudflare Workers, with proper environment configurations for API keys and database connections.
- **Key Design Decisions**: Focus on a multi-model AI architecture for superior visual output, real-time user feedback, comprehensive PDF generation, PostgreSQL for scalability, React with TypeScript for frontend, and TanStack Query for state management.

### External Dependencies
**AI Services**:
- **Google Gemini AI**: Primary AI service (gemini-2.5-flash model).
- **Multi-Model Visual AI System**: Includes specialized AI models like Visual AI Generator, Layout Optimizer, Font AI, Color AI, Structure AI, and Design AI.
- **Hugging Face Models**: Mixtral-8x7B-Instruct, BERT variants, and LayoutLM.
- **API Keys**: GEMINI_API_KEY and HUGGINGFACE_API_KEY are configured.

**Database**:
- **PostgreSQL**: Used as the primary database.
- **Neon Database**: Serverless PostgreSQL hosting (for deployed environments).
- **ORM**: Drizzle ORM.

**File Processing**:
- **pdf-lib**: For PDF generation and text extraction.
- **Multer**: For handling file uploads.

**UI Libraries**:
- **Radix UI**: For accessible component primitives.
- **Tailwind CSS**: For utility-first styling.
- **Lucide Icons**: For consistent iconography.