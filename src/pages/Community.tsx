import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Database } from '../lib/database.types'
import { Layout } from '../components/Layout'
import { LoadingScreen } from '../components/LoadingScreen'
import { CommunityProgressCard } from '../components/CommunityProgressCard'
import { ProgressCard } from '../components/ProgressCard'
import { CommunityChat } from '../components/CommunityChat'
import { Users, TrendingUp, Calendar, Plus, BarChart3, Eye, EyeOff, Filter, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

type ProgressEntry = Database['public']['Tables']['daily_progress']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface CommunityProgress extends ProgressEntry {
  profiles: Profile
}

export function Community() {
  const { user } = useAuth()
  const [publicProgress, setPublicProgress] = useState<CommunityProgress[]>([])
  const [userProgress, setUserProgress] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'community' | 'personal' | 'chat'>('community')
  const [personalFilter, setPersonalFilter] = useState<'all' | 'private' | 'public'>('all')
  const [error, setError] = useState('')
  const [tabTransitioning, setTabTransitioning] = useState(false)
  const [stats, setStats] = useState({
    // Community stats
    totalPublicEntries: 0,
    activeUsers: 0,
    todayEntries: 0,
    // Personal stats
    totalEntries: 0,
    privateEntries: 0,
    publicEntries: 0,
    uniqueDays: 0,
    currentStreak: 0,
  })

  useEffect(() => {
    if (user) {
      fetchCommunityProgress()
      fetchUserProgress()
      fetchStats()
    }
  }, [user, personalFilter])

  const fetchCommunityProgress = async () => {
    try {
      setError('')
      console.log('Fetching community progress...')
      
      const { data, error } = await supabase
        .from('daily_progress')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url,
            created_at
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Community progress data:', data)
      setPublicProgress(data as CommunityProgress[] || [])
    } catch (error: any) {
      console.error('Error fetching community progress:', error)
      setError(`Failed to load community feed: ${error.message}`)
      setPublicProgress([])
    }
  }

  const fetchUserProgress = async () => {
    try {
      let query = supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user?.id)

      // Apply filter
      if (personalFilter !== 'all') {
        query = query.eq('visibility', personalFilter)
      }

      const { data, error } = await query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setUserProgress(data || [])
    } catch (error) {
      console.error('Error fetching user progress:', error)
      setUserProgress([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Community stats
      const { count: totalCount } = await supabase
        .from('daily_progress')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public')

      const { data: uniqueUsers } = await supabase
        .from('daily_progress')
        .select('user_id')
        .eq('visibility', 'public')

      const activeUsers = new Set(uniqueUsers?.map(u => u.user_id) || []).size

      const today = new Date().toISOString().split('T')[0]
      const { count: todayCount } = await supabase
        .from('daily_progress')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('date', today)

      // Personal stats
      const { data: allUserData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user?.id)

      if (allUserData) {
        const uniqueDates = new Set(allUserData.map(p => p.date))
        const privateCount = allUserData.filter(p => p.visibility === 'private').length
        const publicCount = allUserData.filter(p => p.visibility === 'public').length
        
        setStats({
          totalPublicEntries: totalCount || 0,
          activeUsers,
          todayEntries: todayCount || 0,
          totalEntries: allUserData.length,
          privateEntries: privateCount,
          publicEntries: publicCount,
          uniqueDays: uniqueDates.size,
          currentStreak: calculateStreak(Array.from(uniqueDates).sort().reverse()),
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const calculateStreak = (sortedDates: string[]): number => {
    if (sortedDates.length === 0) return 0
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = new Date(today)
    
    for (const dateStr of sortedDates) {
      const progressDate = currentDate.toISOString().split('T')[0]
      
      if (dateStr === progressDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  const handleDeleteProgress = (deletedId: string) => {
    setUserProgress(prev => prev.filter(p => p.id !== deletedId))
    fetchStats() // Refresh stats
  }

  const groupProgressByDate = (progressEntries: ProgressEntry[]) => {
    const grouped: { [key: string]: ProgressEntry[] } = {}
    
    progressEntries.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })
    
    return grouped
  }

  // Enhanced tab switching with animation
  const handleTabSwitch = (newTab: 'community' | 'personal' | 'chat') => {
    if (newTab === activeTab) return
    
    setTabTransitioning(true)
    
    // Fade out current content
    setTimeout(() => {
      setActiveTab(newTab)
      // Fade in new content
      setTimeout(() => {
        setTabTransitioning(false)
      }, 150)
    }, 150)
  }

  if (loading) {
    return <LoadingScreen onLoadingComplete={() => {}} />
  }

  return (
    <Layout>
      {/* Mobile Tab Navigation - Fixed Width Grid with Enhanced Animations */}
      <div className="lg:hidden mb-6">
        <div className="grid grid-cols-3 gap-2 w-full">
          <button
            onClick={() => handleTabSwitch('community')}
            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border transition-all duration-500 text-center transform hover:scale-105 ${
              activeTab === 'community'
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-105 animate-pulse'
                : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-md'
            }`}
          >
            <Users size={16} className={`flex-shrink-0 transition-transform duration-300 ${
              activeTab === 'community' ? 'animate-bounce' : ''
            }`} />
            <span className="text-xs font-medium leading-tight">Community</span>
          </button>
          
          <button
            onClick={() => handleTabSwitch('personal')}
            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border transition-all duration-500 text-center transform hover:scale-105 ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105 animate-pulse'
                : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-md'
            }`}
          >
            <BarChart3 size={16} className={`flex-shrink-0 transition-transform duration-300 ${
              activeTab === 'personal' ? 'animate-bounce' : ''
            }`} />
            <span className="text-xs font-medium leading-tight">Progress</span>
          </button>
          
          <button
            onClick={() => handleTabSwitch('chat')}
            className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border transition-all duration-500 text-center transform hover:scale-105 ${
              activeTab === 'chat'
                ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105 animate-pulse'
                : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-md'
            }`}
          >
            <MessageCircle size={16} className={`flex-shrink-0 transition-transform duration-300 ${
              activeTab === 'chat' ? 'animate-bounce' : ''
            }`} />
            <span className="text-xs font-medium leading-tight">Chat</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block lg:w-80 space-y-6">
          {/* Personal Stats Card */}
          <div className={`card transition-all duration-500 transform hover:scale-105 ${
            activeTab === 'personal' 
              ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-lg scale-105' 
              : 'hover:shadow-md'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeTab === 'personal'
                  ? 'bg-blue-300 dark:bg-blue-800 animate-pulse'
                  : 'bg-blue-200 dark:bg-blue-900'
              }`}>
                <BarChart3 className={`w-5 h-5 transition-all duration-300 ${
                  activeTab === 'personal'
                    ? 'text-blue-800 dark:text-blue-300 animate-bounce'
                    : 'text-blue-700 dark:text-blue-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">Your Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Personal analytics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded transition-all duration-300 hover:scale-105">
                <div className="text-lg font-bold">{stats.totalEntries}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded transition-all duration-300 hover:scale-105">
                <div className="text-lg font-bold">{stats.currentStreak}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
              </div>
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded transition-all duration-300 hover:scale-105">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400">{stats.privateEntries}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Private</div>
              </div>
              <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded transition-all duration-300 hover:scale-105">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.publicEntries}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Public</div>
              </div>
            </div>

            <button
              onClick={() => handleTabSwitch('personal')}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border transition-all duration-500 transform hover:scale-105 ${
                activeTab === 'personal'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md scale-105'
                  : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-md'
              }`}
            >
              <BarChart3 size={14} />
              View Personal Progress
            </button>
          </div>

          {/* Community Stats Card */}
          <div className={`card transition-all duration-500 transform hover:scale-105 ${
            activeTab === 'community' 
              ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600 shadow-lg scale-105' 
              : 'hover:shadow-md'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeTab === 'community'
                  ? 'bg-purple-300 dark:bg-purple-800 animate-pulse'
                  : 'bg-purple-200 dark:bg-purple-900'
              }`}>
                <Users className={`w-5 h-5 transition-all duration-300 ${
                  activeTab === 'community'
                    ? 'text-purple-800 dark:text-purple-300 animate-bounce'
                    : 'text-purple-700 dark:text-purple-400'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">Community</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Global activity</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Public Entries</span>
                <span className="font-semibold">{stats.totalPublicEntries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="font-semibold">{stats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's Posts</span>
                <span className="font-semibold">{stats.todayEntries}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleTabSwitch('community')}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border transition-all duration-500 transform hover:scale-105 ${
                  activeTab === 'community'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white border-purple-600 dark:border-purple-500 shadow-md scale-105'
                    : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-md'
                }`}
              >
                <Users size={14} />
                View Community Feed
              </button>

              <button
                onClick={() => handleTabSwitch('chat')}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border transition-all duration-500 transform hover:scale-105 ${
                  activeTab === 'chat'
                    ? 'bg-green-600 dark:bg-green-500 text-white border-green-600 dark:border-green-500 shadow-md scale-105'
                    : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-md'
                }`}
              >
                <MessageCircle size={14} />
                Community Chat
              </button>
            </div>
          </div>

          {/* Add Progress CTA */}
          <div className="card !p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-300 dark:border-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="text-center">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Share Your Progress
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-300 mb-4">
                Inspire others with your achievements
              </p>
              <Link 
                to="/add" 
                className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700 transition-all duration-300 hover:scale-105"
              >
                <Plus size={16} />
                Add Progress
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Animations */}
        <div className="flex-1 min-w-0">
          <div className={`transition-all duration-300 ${
            tabTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
          }`}>
            {activeTab === 'community' ? (
              <div className={`transition-all duration-500 ${
                activeTab === 'community' 
                  ? 'bg-purple-100/50 dark:bg-purple-900/10 p-3 sm:p-4 lg:p-6 rounded-lg border border-purple-300/50 dark:border-purple-700/50 animate-fade-in-up' 
                  : ''
              }`}>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-200 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Users className="w-3 h-3 sm:w-5 sm:h-5 text-purple-700 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold truncate">Community Feed</h1>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden sm:block">
                        See what others are achieving
                      </p>
                    </div>
                  </div>

                  <Link 
                    to="/add" 
                    className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 lg:py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0 hover:scale-105"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    <span className="text-xs sm:text-sm lg:text-base font-medium hidden sm:inline">Add Progress</span>
                  </Link>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in-up">
                    <div className="text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </div>
                    <button
                      onClick={fetchCommunityProgress}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {publicProgress.length === 0 && !error ? (
                  <div className="text-center py-8 sm:py-12 animate-fade-in-up">
                    <div className="text-base sm:text-lg mb-4">No public progress entries yet.</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                      Be the first to share your progress with the community!
                    </p>
                    <Link 
                      to="/add" 
                      className="btn-primary inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 hover:scale-105 transition-transform duration-300"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                      Share Your Progress
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {publicProgress.map((entry, index) => (
                      <div 
                        key={entry.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CommunityProgressCard 
                          progress={entry}
                          showUserInfo={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'chat' ? (
              <div className={`transition-all duration-500 ${
                activeTab === 'chat' 
                  ? 'bg-green-100/50 dark:bg-green-900/10 p-3 sm:p-4 lg:p-6 rounded-lg border border-green-300/50 dark:border-green-700/50 animate-fade-in-up' 
                  : ''
              }`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-200 dark:bg-green-900 rounded-full flex items-center justify-center animate-pulse">
                    <MessageCircle className="w-3 h-3 sm:w-5 sm:h-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold">Community Chat</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden sm:block">
                      Connect and discuss with fellow achievers
                    </p>
                  </div>
                </div>

                <div className="animate-fade-in-up">
                  <CommunityChat />
                </div>
              </div>
            ) : (
              <div className={`transition-all duration-500 ${
                activeTab === 'personal' 
                  ? 'bg-blue-100/50 dark:bg-blue-900/10 p-3 sm:p-4 lg:p-6 rounded-lg border border-blue-300/50 dark:border-blue-700/50 animate-fade-in-up' 
                  : ''
              }`}>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-200 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold truncate">Your Progress</h1>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden sm:block">
                        Track your personal journey
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Filter size={12} className="sm:w-3.5 sm:h-3.5 text-gray-500" />
                    <select
                      value={personalFilter}
                      onChange={(e) => setPersonalFilter(e.target.value as 'all' | 'private' | 'public')}
                      className="text-xs sm:text-sm border border-black dark:border-white bg-white dark:bg-black px-1 sm:px-2 py-1 rounded transition-all duration-300 hover:scale-105"
                    >
                      <option value="all">All ({stats.totalEntries})</option>
                      <option value="private">Private ({stats.privateEntries})</option>
                      <option value="public">Public ({stats.publicEntries})</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Stats Grid */}
                <div className="lg:hidden grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 animate-fade-in-up">
                    <div className="text-base sm:text-lg font-bold">{stats.totalEntries}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="text-base sm:text-lg font-bold">{stats.currentStreak}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="text-base sm:text-lg font-bold text-gray-600 dark:text-gray-400">{stats.privateEntries}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Private</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">{stats.publicEntries}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Public</div>
                  </div>
                </div>

                {userProgress.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 animate-fade-in-up">
                    <div className="text-base sm:text-lg mb-4">
                      {personalFilter === 'all' 
                        ? 'No progress entries yet.' 
                        : `No ${personalFilter} progress entries yet.`
                      }
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4">
                      {personalFilter === 'all' 
                        ? 'Start documenting your daily achievements!'
                        : `Create some ${personalFilter} entries to see them here.`
                      }
                    </p>
                    <Link 
                      to="/add" 
                      className="btn-primary inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 hover:scale-105 transition-transform duration-300"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                      Add Progress
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                    {(() => {
                      const groupedProgress = groupProgressByDate(userProgress)
                      const sortedDates = Object.keys(groupedProgress).sort().reverse()
                      
                      return sortedDates.map((date, dateIndex) => (
                        <div 
                          key={date} 
                          className="space-y-3 sm:space-y-4 animate-fade-in-up"
                          style={{ animationDelay: `${dateIndex * 0.1}s` }}
                        >
                          {/* FIXED: Removed sticky positioning from date headers */}
                          <div className="bg-white dark:bg-black py-2 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-sm sm:text-base lg:text-lg font-semibold flex items-center gap-2 flex-wrap">
                              <Calendar size={12} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                              <span className="text-xs sm:text-sm lg:text-base">
                                {new Date(date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({groupedProgress[date].length} {groupedProgress[date].length === 1 ? 'entry' : 'entries'})
                              </span>
                            </h2>
                          </div>
                          
                          <div className="space-y-3 lg:space-y-4">
                            {groupedProgress[date].map((entry, entryIndex) => (
                              <div 
                                key={entry.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${(dateIndex * 0.1) + (entryIndex * 0.05)}s` }}
                              >
                                <ProgressCard 
                                  progress={entry} 
                                  onDelete={handleDeleteProgress}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}