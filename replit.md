# NoteGPT - AI Study Notes Generator

## Overview

NoteGPT is a full-stack web application that transforms text content and PDF documents into structured study notes using AI. The application uses Google's Gemini AI to analyze and process content, generating organized notes with key concepts, summary points, and process flows.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 26, 2025)

✅ **Implemented Advanced "Chat with PDF" Feature**: 
- Added comprehensive AI-powered conversation system for interactive learning
- Integrated multi-model AI approach using Google Gemini 2.5-Flash for real-time responses
- Built intelligent question prediction system that generates 8-12 important questions from content
- Implemented advanced rewards and punishment system with points, levels, streaks, and badges
- Created gamified learning experience with difficulty adaptation (beginner/intermediate/advanced)
- Added quiz generation with multiple choice questions and immediate feedback
- Built real-time progress tracking with achievements and performance analytics
- Implemented web research capabilities and enhanced context understanding
- Added comprehensive user interface with chat history, progress sidebar, and quick actions

✅ **Successfully Updated Logo**: 
- Replaced old logo with new gradient brain design logo
- Updated logo styling to display properly without filters
- Logo now shows the AI-themed gradient brain design for better branding

## Previous Changes (July 25, 2025)

✅ **Enhanced Multi-Model AI Visual Generation System**:
- Added comprehensive visual AI generation with 6+ specialized AI models
- Implemented real-time PDF preview with proper fonts and responsive design
- Created advanced visual elements including pie charts, bar charts, flow diagrams, and infographics
- Built enhanced PDF designer with multi-model processing capabilities
- Added real-time visual preview component with live chart generation
- Integrated multiple AI services: Gemini 2.5-Flash, Visual AI Generator, Layout Optimizer, Font AI, Color AI, and Structure AI
- Implemented comprehensive PDF generation with proper typography and color schemes
- Added real-time preview functionality with font family selection and design customization

✅ **Successfully Completed Migration from Replit Agent to Standard Replit Environment**: 
- Migrated project from Replit Agent to standard Replit environment with enhanced security and compatibility
- Verified all packages and dependencies are properly installed and working
- Confirmed application runs cleanly without TypeScript or syntax errors
- Fixed logo duplication issue in header component using proper Vite asset handling
- Resolved all TypeScript compilation errors and LSP diagnostics
- Updated package security vulnerabilities and missing dependencies
- Fixed .entries() iterator issues for ES2015 compatibility
- Maintained full functionality of NoteGPT AI study notes generator during migration

## Previous Changes (July 24, 2025)

✅ **Successfully Completed Migration to Replit Environment**: 
- Completed full migration from Replit Agent with proper client/server separation
- Fixed all syntax errors and TypeScript diagnostics
- Ensured secure API key management for both GEMINI_API_KEY and HUGGINGFACE_API_KEY
- Maintained all existing functionality during migration

✅ **Replaced "Download PDF" with Advanced "Generate PDF" System**: 
- Completely replaced simple download functionality with sophisticated AI-enhanced PDF generation
- Integrated multiple Hugging Face models (Mixtral-8x7B-Instruct, BERT, LayoutLM) alongside Google Gemini
- Added advanced PDF generation service with layout analysis and content optimization
- Implemented design style options (Academic, Modern, Minimal, Colorful)
- Added color scheme selection (Blue, Green, Purple, Orange) and visual element customization

✅ **Enhanced Multi-Model AI Processing Pipeline**: 
- Combined Google Gemini AI with Hugging Face models for enhanced content analysis
- Added layout analysis, content enhancement, and design optimization capabilities
- Implemented multi-model processing options in the frontend interface
- Created robust error handling and fallback mechanisms for PDF generation

✅ **Advanced PDF Generation Interface**: 
- Added comprehensive PDF generation options with gradient-styled UI
- Implemented design style selection and color scheme customization
- Added visual elements toggle and enhanced layout options
- Created loading states and progress indicators for PDF generation
- Added Multi-Model AI badge for enhanced processing identification

✅ **Resolved PDF Generation Issues**: 
- Fixed PDF loading failures by implementing proper fallback mechanisms
- Added simplified structure generation for reliable PDF creation
- Ensured proper error handling and user feedback during PDF generation process

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
   - Google Gemini AI (gemini-2.5-flash model) for content analysis
   - Configurable processing settings (academic, bullet points, mind map, Q&A styles)
   - JSON-structured response parsing

3. **Advanced Chat with PDF System**
   - Interactive AI-powered conversations about document content
   - Intelligent question prediction and generation (8-12 important questions per document)
   - Multi-difficulty learning paths (beginner, intermediate, advanced)
   - Real-time quiz generation with multiple choice questions
   - Comprehensive rewards system with points, levels, streaks, and achievement badges
   - Adaptive difficulty based on user performance and learning progress
   - Web research integration for enhanced context and explanations
   - Gamified learning experience with penalties and encouragement messages

4. **Note Management**
   - Real-time processing status tracking
   - Note storage with metadata
   - PDF export functionality
   - Template system for note layouts
   - Chat session management and message history

5. **User Interface**
   - Drag-and-drop file upload
   - Real-time processing feedback
   - Tabbed workspace including Chat with PDF tab
   - Progress tracking sidebar with achievements
   - Responsive design with mobile support
   - Real-time chat interface with quiz integration

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
- **Multi-Model Visual AI System**: 6+ specialized AI models for comprehensive content processing
  - **Visual AI Generator**: Creates pie charts, bar charts, and flow diagrams from content
  - **Layout Optimizer**: AI-powered PDF layout design and structure optimization
  - **Font AI**: Intelligent typography selection and font optimization
  - **Color AI**: Smart color scheme generation and visual harmony
  - **Structure AI**: Content flow analysis and organization
  - **Design AI**: Comprehensive design system integration
- **Hugging Face Models**: Advanced AI services for enhanced processing
  - Mixtral-8x7B-Instruct: Content enhancement and structure optimization
  - BERT variants: Text analysis and semantic understanding
  - LayoutLM: Document layout analysis and visual structure recognition
- **API Keys Configured**: GEMINI_API_KEY and HUGGINGFACE_API_KEY environment variables (both available)

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

1. **Multi-Model AI Architecture**: 6+ specialized AI models for comprehensive visual generation and content processing
2. **Real-time Preview System**: Live PDF preview with proper fonts, colors, and responsive design
3. **Visual Generation Pipeline**: Automated creation of charts, infographics, and visual elements
4. **Database Choice**: PostgreSQL with Neon for scalability and JSON support for flexible note structures
5. **AI Provider**: Google Gemini + Multi-Model AI system for advanced content analysis and visual generation
6. **Frontend Framework**: React with TypeScript for type safety and component reusability
7. **State Management**: TanStack Query for efficient server state caching and synchronization
8. **File Processing**: In-memory processing with size limits for security and performance
9. **Session Management**: PostgreSQL-backed sessions for persistence and scalability

The architecture prioritizes multi-model AI processing for superior visual output, real-time user feedback, comprehensive PDF generation with proper typography, and advanced visual elements including charts and infographics. The system uses 6+ specialized AI models working in parallel for optimal content analysis, design optimization, and visual generation.