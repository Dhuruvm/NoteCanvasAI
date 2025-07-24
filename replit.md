# NoteGPT - AI Study Notes Generator

## Overview

NoteGPT is a full-stack web application that transforms text content and PDF documents into structured study notes using AI. The application uses Google's Gemini AI to analyze and process content, generating organized notes with key concepts, summary points, and process flows.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 24, 2025)

✅ **Successfully Migrated from Replit Agent to Replit Environment**: 
- Completed full migration with proper client/server separation
- Fixed all syntax errors and TypeScript diagnostics
- Ensured secure API key management and authentication
- Maintained all existing functionality during migration

✅ **Enhanced Multi-Model AI PDF Generation**: 
- Integrated multiple Hugging Face models (Mixtral-8x7B-Instruct, BERT, LayoutLM) alongside Google Gemini
- Added advanced PDF generation service with layout analysis and content optimization
- Replaced simple "Download PDF" with sophisticated "Generate PDF" interface
- Implemented design style options (Academic, Modern, Minimal, Colorful)
- Added color scheme selection and visual element customization

✅ **Advanced AI Processing Pipeline**: 
- Combined Google Gemini AI with Hugging Face models for enhanced content analysis
- Added layout analysis, content enhancement, and design optimization
- Implemented multi-model processing options in the frontend
- Created robust error handling and fallback mechanisms

✅ **Enhanced User Interface**: 
- Added comprehensive PDF generation options with real-time previews
- Implemented design style selection and color scheme customization
- Added visual elements toggle and enhanced layout options
- Created gradient-styled UI elements with loading states

## Previous Changes (July 23, 2025)

✅ **Fixed Critical PDF Processing Error**: Resolved the PDF text extraction failure that was causing 500 errors on file uploads. Added proper error handling and validation for empty PDF content.

✅ **Implemented Full Mobile Responsiveness**: 
- Redesigned header navigation with collapsible mode toggles for mobile screens
- Added responsive breakpoints (xs: 475px) to Tailwind configuration
- Optimized card layouts, spacing, and typography for mobile devices
- Made tabs scrollable horizontally on small screens
- Implemented responsive button layouts and sizing

✅ **Enhanced Dark Mode Support**: Added comprehensive dark mode styling throughout all components including proper color variables and contrast ratios.

✅ **AI Processing Speed Optimization**: 
- Switched from gemini-2.5-pro to faster gemini-2.5-flash model
- Added 30-second timeout to prevent hanging during AI processing
- Implemented content length limits (3000 chars) for faster processing
- Added fallback error handling with user-friendly messages
- Created robust background processing with proper status tracking

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Processing**: Multer for file uploads, PDF-lib for PDF generation
- **Session Management**: Express sessions with PostgreSQL storage

## Key Components

### Core Features
1. **Content Processing Pipeline**
   - Text input via textarea
   - PDF upload and text extraction
   - AI processing with customizable settings (summary style, detail level, examples)
   - Structured note generation

2. **AI Integration**
   - Google Gemini AI (gemini-2.5-pro model) for content analysis
   - Configurable processing settings (academic, bullet points, mind map, Q&A styles)
   - JSON-structured response parsing

3. **Note Management**
   - Real-time processing status tracking
   - Note storage with metadata
   - PDF export functionality
   - Template system for note layouts

4. **User Interface**
   - Drag-and-drop file upload
   - Real-time processing feedback
   - Tabbed workspace for notes and templates
   - Responsive design with mobile support

### Database Schema
- **Notes Table**: Stores original content, processed results, and metadata
- **Templates Table**: Predefined and custom note layouts
- **Session Storage**: PostgreSQL-backed session management

### File Processing
- **Supported Formats**: PDF, TXT, MD files (10MB limit)
- **PDF Processing**: Text extraction and generation capabilities
- **Upload Validation**: File type and size restrictions

## Data Flow

1. **Content Input**
   - User inputs text or uploads file
   - File validation and text extraction (for PDFs)
   - Content preprocessing

2. **AI Processing**
   - Content sent to Gemini AI with processing settings
   - Structured response parsing
   - Note creation with processing status

3. **Storage and Retrieval**
   - Processed notes stored in PostgreSQL
   - Real-time status updates via polling
   - Template-based formatting

4. **Export and Sharing**
   - PDF generation from processed notes
   - Download functionality
   - Template customization

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary AI service for content analysis and note generation (gemini-2.5-flash model)
- **Hugging Face Models**: Secondary AI services for enhanced PDF generation and layout analysis
  - Mixtral-8x7B-Instruct: Content enhancement and structure optimization
  - BERT variants: Text analysis and semantic understanding
  - LayoutLM: Document layout analysis and visual structure recognition
- **API Keys Required**: GEMINI_API_KEY and HUGGINGFACE_API_KEY environment variables

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: DATABASE_URL environment variable required
- **ORM**: Drizzle with migrations support

### File Processing
- **PDF Processing**: pdf-lib for generation, text extraction utilities
- **File Upload**: Multer middleware for multipart form handling

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Consistent iconography

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Drizzle migrations with push command

### Production Build
- **Frontend**: Vite build to dist/public
- **Backend**: esbuild bundling to dist/index.js
- **Static Assets**: Served from built frontend

### Environment Configuration
- **Node Environment**: NODE_ENV for development/production modes
- **Database**: Drizzle configuration with PostgreSQL dialect
- **AI Service**: Google Gemini API key configuration

### Key Design Decisions

1. **Database Choice**: PostgreSQL with Neon for scalability and JSON support for flexible note structures
2. **AI Provider**: Google Gemini for advanced content analysis and structured output capabilities
3. **Frontend Framework**: React with TypeScript for type safety and component reusability
4. **State Management**: TanStack Query for efficient server state caching and synchronization
5. **File Processing**: In-memory processing with size limits for security and performance
6. **Session Management**: PostgreSQL-backed sessions for persistence and scalability

The architecture prioritizes developer experience with TypeScript throughout, efficient data fetching patterns, and a clean separation between client and server concerns while maintaining real-time user feedback during AI processing operations.