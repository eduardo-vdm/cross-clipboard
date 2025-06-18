# Cross-Clipboard Client

The client application for the Cross-Clipboard project, allowing users to share clipboard items across devices using session codes. This project serves as both a practical tool and a technical showcase, demonstrating modern web development practices and learning experiences.

## 🎯 Overview

Cross-Clipboard is a web application that enables real-time clipboard sharing across devices using simple 6-digit session codes. Built with a focus on user experience and technical versatility, it demonstrates the practical application of modern web technologies while showcasing the developer's ability to work with different technology stacks.

## ✨ Features

- 🔄 Real-time text sharing between any device with clipboard support
- 📱 Anonymous session creation with automatic device naming and identification
- 🔗 Join existing sessions via 6-digit codes
- ⌨️ Comprehensive keyboard shortcut support with clipboard permission handling
- 📤 One-click sharing options (6-digit code, direct URL, QR code)
- ✏️ Advanced item management with edit functionality and conflict resolution
- 🗑️ Device-specific item management (remove my items, individual item deletion)
- 🧹 Complete data wipe capability with confirmation dialogs
- 🌙 Dark/light theme support with theme switching
- ♿ Accessibility features (ongoing enhancements)
- 🌍 Internationalization (English and Brazilian Portuguese) with language switcher
- 📱 Responsive design (390px minimum width)
- ⚡ Backend warm-up handling with online status indicators
- 📅 Items sorted by last modified timestamp for better organization

## 🛠️ Technology Stack

- **Core Framework**: React.js 18.x
- **Build Tool**: Vite 4.4.x
- **Styling**: TailwindCSS 3.x
- **UI Components**: HeadlessUI 2.x
- **Testing**: Vitest 3.x (recently migrated from Jest)
- **Language**: Vanilla JavaScript
- **Additional Libraries**: 
  - i18next for internationalization
  - React Hot Toast for notifications
  - Embla Carousel for UI components
  - React Hotkeys Hook for keyboard shortcuts
  - QR Code React for sharing functionality

## 🚀 Development

### Technical Decisions

This project deliberately uses different technology stacks for frontend and backend to reflect real-world scenarios where developers must adapt to varying code environments. The frontend uses Vanilla JavaScript while the backend uses TypeScript, creating an interesting development workflow that showcases technical adaptability.

### AI-Assisted Development

This project was developed with significant assistance from AI agents, providing a unique learning experience in:
- Guiding AI agents to achieve desired results
- Implementing best practices suggested by AI
- Learning from both successes and setbacks in AI collaboration
- Understanding the balance between AI assistance and human decision-making

### Development Environment

The project uses a containerized development environment with Docker, providing:
- Isolated development environments for frontend, backend, and MongoDB
- Consistent development experience across different machines
- Easy setup and teardown of development environments

### Key Challenges

1. **AI Agent Interaction**
   - Learning to effectively guide AI agents
   - Understanding AI limitations and capabilities
   - Developing strategies for successful AI collaboration

2. **React.js Modernization**
   - Adapting to modern React features (Context, Hooks)
   - Understanding and implementing current best practices
   - Evaluating and addressing common React critiques

### Environment Configuration

The application uses environment variables for configuration, managed through the `src/env.js` module.

#### Available Environment Variables

##### Custom Environment Variables
- `VITE_USE_MOCK_API`: Set to `true` to use mock API, `false` to use real API (default: `true`)
- `VITE_API_URL`: Base URL for the API when using the real API service (default: empty string)

##### Built-in Vite Environment Variables
- `import.meta.env.DEV`: Development mode flag
- `import.meta.env.PROD`: Production mode flag
- `import.meta.env.MODE`: Current mode

#### Setting Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the variables in `.env` as needed:
```
# To use mock API (default behavior)
VITE_USE_MOCK_API=true

# To use real API (use the actual api url if not using the default ones)
# VITE_USE_MOCK_API=false
# VITE_API_URL=http://localhost:3001
```

2. Restart the development server:
```bash
npm run dev
```

## 📦 Building

> **Note**: Deployment strategy is currently under evaluation. The following options are being considered:
> - AWS S3 for static file hosting
> - Vercel for automated deployment
> 
> This section will be updated once the deployment strategy is finalized.

### Building for Production

```bash
npm run build
```

## 🧪 Testing

> **Note**: Testing framework recently migrated from Jest to Vitest and needs updates. A complete test suite update is planned for the next development phase.

## 🌐 Browser Support

- Supports all modern browsers with graphical UI
- Requires local storage and clipboard permissions
- Known issues with clipboard permissions on some mobile browsers (improved but ongoing)

## ⚠️ Known Limitations

- Current polling mechanism for data synchronization
- Mobile browser clipboard permission handling (improved but ongoing)
- Limited session TTL
- No comprehensive user help/tour system
- Image copy/paste support removed for development speed (planned for future)

## 🔮 Future Plans

- Implement WebSocket-based real-time updates
- Image copy/paste functionality (re-implementation)
- Comprehensive user help/tour system
- Native mobile apps (Android/iOS) via Expo.js
- Optional user authentication for persistent libraries
- Enhanced accessibility features
- Additional language support

## 🤝 Contributing

This project is currently maintained as a portfolio piece and learning exercise. While not actively seeking contributions at this time, the project remains open to collaboration for interested developers. Please reach out if you'd like to contribute.
