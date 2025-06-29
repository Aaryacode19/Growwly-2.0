import { Heart, Linkedin, Github, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-black dark:border-white mt-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Made with love */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart 
              size={16} 
              className="text-red-500 animate-pulse fill-current" 
            />
            <span>by</span>
            <span className="font-semibold text-black dark:text-white">Aarya</span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://www.linkedin.com/in/aarya-trifale/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
              title="Connect on LinkedIn"
            >
              <Linkedin 
                size={18} 
                className="group-hover:scale-110 transition-transform" 
              />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
            
            <a
              href="https://github.com/Aaryacode19"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
              title="View on GitHub"
            >
              <Github 
                size={18} 
                className="group-hover:scale-110 transition-transform" 
              />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            
            <a
              href="mailto:aarya.skills@gmail.com"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
              title="Send Email"
            >
              <Mail 
                size={18} 
                className="group-hover:scale-110 transition-transform" 
              />
              <span className="text-sm font-medium">Email</span>
            </a>
          </div>
          
          {/* Copyright */}
          <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
            <p>© {new Date().getFullYear()} Growwly • Built for tracking daily achievements</p>
          </div>
        </div>
      </div>
    </footer>
  )
}