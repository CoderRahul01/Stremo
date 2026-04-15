# Stremo: Professional Live Streaming Platform

Stremo is a high-performance, scalable live streaming application built with React, Vite, and Firebase, leveraging Google Cloud's robust infrastructure for real-time video delivery and management.

## 🚀 Features

- **Real-time Live Streaming**: Low-latency broadcasting using WebRTC and RTMP.
- **Screen Sharing**: Integrated screen capture for tutorials and presentations.
- **VOD (Video On Demand)**: Automatic archiving of live streams for later viewing.
- **Interactive Progress Bar**: Seek through VODs with chapter markers.
- **Playback Speed Control**: Adjust playback speed from 0.5x to 2x.
- **Real-time Stats**: Live viewer counts and like interactions via Socket.io.
- **Creator Profiles**: Manage broadcasts, followers, and bio.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js (Express), Socket.io (Real-time events).
- **Database & Auth**: Firebase Firestore, Firebase Authentication.
- **Infrastructure**: Google Cloud Platform (GCP).
- **Video Processing**: Google Cloud Transcoder API (Planned).
- **Delivery**: Google Cloud Media CDN (Planned).

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Firebase credentials.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Documentation

- [Tech Stack & Architecture](./TECH_STACK.md)
- [Product Roadmap](./ROADMAP.md)
- [Marketing & Growth Plan](./MARKETING.md)

## 🛡 Security

We follow industry standards for security. All sensitive API keys are managed via environment variables. Ensure you never commit your `.env` file to version control.

## 📄 License

MIT License. See `LICENSE` for details.
