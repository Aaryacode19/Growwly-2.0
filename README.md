# Growwly - Daily Progress Tracker

A modern, minimalist daily progress tracking application built with React, TypeScript, and Supabase.

## Features

- **Daily Progress Tracking**: Log your daily achievements with text, images, and links
- **Multiple Entries Per Day**: Add multiple progress entries for the same day
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Image Upload**: Upload and display images with your progress entries
- **Statistics Dashboard**: Track your progress with streak counters and activity stats
- **Community Features**: Share public posts, like and comment on others' progress
- **Real-time Chat**: Connect with fellow achievers in the community chat
- **AI Assistant**: Get personalized guidance from Growwly AI for goal setting and motivation
- **Pomodoro Timer**: Built-in focus timer with lofi music player
- **Achievement System**: Track custom achievements and certifications
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Secure Authentication**: Built-in user authentication with Supabase
- **Access Request System**: Controlled access with admin approval workflow

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **AI**: Groq API for AI assistant functionality
- **Music**: Custom music API for Pomodoro timer

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd growwly-daily-progress-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase credentials in the `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Start the development server:
```bash
npm run dev
```

## Deployment on Vercel

This project is optimized for deployment on Vercel:

1. **Connect Repository**: Connect your GitHub repository to Vercel
2. **Environment Variables**: Add your environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY` (optional, for email notifications)
   - `ADMIN_EMAIL` (optional, for access requests)
   - `GROQ_API_KEY` (optional, for AI assistant)

3. **Deploy**: Vercel will automatically deploy on push to main branch

### Build Configuration

The project includes optimized build settings:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

## Database Schema

The application uses the following main tables:

- `profiles`: User profile information
- `daily_progress`: Daily progress entries with visibility settings
- `community_interactions`: Likes and comments on public posts
- `chat_messages`: Real-time community chat messages
- `user_custom_achievements`: Custom user achievements and certifications
- `access_requests`: Access request management
- `user_blocks`: User blocking functionality

## Features Overview

### Progress Tracking
- Add daily progress entries with rich content
- Support for text, images, and external links
- Private and public visibility options
- Multiple entries per day allowed

### Community Features
- Public feed of community progress
- Like and comment on posts
- Real-time community chat
- User profiles with achievements

### AI Assistant (Growwly)
- Personalized goal setting guidance
- Progress analysis and insights
- Motivation and productivity tips
- Fallback responses when offline

### Pomodoro Timer
- 25-minute focus sessions
- Short (5min) and long (15min) breaks
- Built-in lofi music player
- Session tracking and statistics

### Achievement System
- Custom achievement creation
- Certificate tracking with verification links
- Skills and technology tagging
- Featured achievements on profiles

## Security Features

- Row Level Security (RLS) for all database tables
- User authentication with Supabase Auth
- Private post isolation per user account
- User blocking functionality
- Secure file uploads to Supabase Storage

## Performance Optimizations

- Code splitting with manual chunks
- Optimized bundle size
- Responsive images and lazy loading
- Efficient database queries with proper indexing
- Mobile-first responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Environment Variables

### Required
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional (for enhanced features)
- `RESEND_API_KEY`: For email notifications
- `ADMIN_EMAIL`: Admin email for access requests
- `GROQ_API_KEY`: For AI assistant functionality

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.