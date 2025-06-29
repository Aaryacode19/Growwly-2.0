import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Database } from '../lib/database.types'
import { Layout } from '../components/Layout'
import { LoadingScreen } from '../components/LoadingScreen'
import { EditProfileModal } from '../components/EditProfileModal'
import { ShareProfileModal } from '../components/ShareProfileModal'
import { AvatarSelector } from '../components/AvatarSelector'
import { CommunityProgressCard } from '../components/CommunityProgressCard'
import { AchievementModal } from '../components/AchievementModal'
import { CustomAchievementCard } from '../components/CustomAchievementCard'
import { 
  User, 
  MapPin, 
  Globe, 
  Calendar, 
  Edit3, 
  Share2, 
  Trophy, 
  TrendingUp, 
  Eye,
  EyeOff,
  Award,
  Target,
  Flame,
  BarChart3,
  Camera,
  Plus,
  Filter,
  Star
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProgressEntry = Database['public']['Tables']['daily_progress']['Row']

interface CustomAchievement {
  id: string
  title: string
  description: string
  date_earned: string
  certificate_url?: string
  certificate_id?: string
  external_link?: string
  category: string
  issuer: string
  skills: string[]
  is_featured: boolean
  created_at: string
}

export function UserProfile() {
  const { userId } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [customAchievements, setCustomAchievements] = useState<CustomAchievement[]>([])
  const [recentProgress, setRecentProgress] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [updatingAvatar, setUpdatingAvatar] = useState(false)
  const [progressFilter, setProgressFilter] = useState<'all' | 'public' | 'private'>('all')
  const [stats, setStats] = useState({
    totalEntries: 0,
    publicEntries: 0,
    privateEntries: 0,
    uniqueDays: 0,
    currentStreak: 0,
    totalPoints: 0,
    joinedDays: 0
  })

  const isOwnProfile = !userId || userId === user?.id
  const targetUserId = userId || user?.id

  useEffect(() => {
    if (targetUserId) {
      fetchProfile()
      fetchCustomAchievements()
      fetchRecentProgress()
      fetchStats()
    }
  }, [targetUserId, progressFilter])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchCustomAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('user_custom_achievements')
        .select('*')
        .eq('user_id', targetUserId)
        .order('date_earned', { ascending: false })

      if (error) throw error
      setCustomAchievements(data || [])
    } catch (error) {
      console.error('Error fetching custom achievements:', error)
    }
  }

  const fetchRecentProgress = async () => {
    try {
      let query = supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', targetUserId)

      // Apply visibility filter
      if (progressFilter !== 'all') {
        query = query.eq('visibility', progressFilter)
      }

      // If viewing someone else's profile, only show public posts
      if (!isOwnProfile) {
        query = query.eq('visibility', 'public')
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setRecentProgress(data || [])
    } catch (error) {
      console.error('Error fetching recent progress:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Get progress stats
      let query = supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', targetUserId)

      // If viewing someone else's profile, only count public posts
      if (!isOwnProfile) {
        query = query.eq('visibility', 'public')
      }

      const { data: progressData } = await query

      if (progressData) {
        const uniqueDates = new Set(progressData.map(p => p.date))
        const publicCount = progressData.filter(p => p.visibility === 'public').length
        const privateCount = progressData.filter(p => p.visibility === 'private').length
        
        // Calculate current streak
        const currentStreak = calculateStreak(Array.from(uniqueDates).sort().reverse())

        // Calculate days since joining
        const joinDate = new Date(profile?.created_at || new Date())
        const today = new Date()
        const joinedDays = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))

        setStats({
          totalEntries: progressData.length,
          publicEntries: publicCount,
          privateEntries: isOwnProfile ? privateCount : 0,
          uniqueDays: uniqueDates.size,
          currentStreak,
          totalPoints: 0, // Remove system achievement points
          joinedDays
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
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

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!profile) return
    
    setUpdatingAvatar(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl || null })
        .eq('id', profile.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      setShowAvatarSelector(false)
    } catch (error) {
      console.error('Error updating avatar:', error)
    } finally {
      setUpdatingAvatar(false)
    }
  }

  const handleToggleFeatured = async (achievementId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('user_custom_achievements')
        .update({ is_featured: !currentFeatured })
        .eq('id', achievementId)

      if (error) throw error
      await fetchCustomAchievements()
    } catch (error) {
      console.error('Error toggling featured status:', error)
    }
  }

  const handleDeleteCustomAchievement = async (achievementId: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return

    try {
      const { error } = await supabase
        .from('user_custom_achievements')
        .delete()
        .eq('id', achievementId)

      if (error) throw error
      await fetchCustomAchievements()
    } catch (error) {
      console.error('Error deleting achievement:', error)
    }
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const featuredCustomAchievements = customAchievements.filter(a => a.is_featured).slice(0, 3)

  if (loading) {
    return <LoadingScreen onLoadingComplete={() => {}} />
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-lg mb-4">Profile not found</div>
          <Link to="/" className="btn-primary">
            Back to Community
          </Link>
        </div>
      </Layout>
    )
  }

  // Check if profile is private and user is not the owner
  if (profile.profile_visibility === 'private' && !isOwnProfile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeOff className="w-8 h-8 text-gray-500" />
          </div>
          <div className="text-lg mb-2">Private Profile</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This user has set their profile to private.
          </p>
          <Link to="/" className="btn-primary">
            Back to Community
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              {/* Clickable Avatar with Fixed Hover */}
              <div className="relative mb-3 sm:mb-4">
                <button
                  onClick={() => isOwnProfile && setShowAvatarSelector(true)}
                  disabled={!isOwnProfile || updatingAvatar}
                  className={`
                    relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden
                    transition-all duration-200 group
                    ${isOwnProfile ? 'cursor-pointer hover:ring-2 hover:ring-black dark:hover:ring-white hover:ring-offset-2' : ''}
                    ${updatingAvatar ? 'opacity-50' : ''}
                  `}
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full"
                    />
                  ) : (
                    <User size={32} className="sm:w-10 sm:h-10 text-gray-500 dark:text-gray-400" />
                  )}
                  
                  {/* Camera overlay on hover for own profile */}
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center rounded-full">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  )}
                </button>
                
                {isOwnProfile && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 max-w-[100px]">
                    Click to change
                  </div>
                )}
              </div>
              
              {/* Action Buttons - FIXED FOR MOBILE */}
              {isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="btn-secondary flex items-center justify-center gap-2 px-3 py-2 text-sm w-full sm:w-auto"
                  >
                    <Edit3 size={14} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="btn-secondary flex items-center justify-center gap-2 px-3 py-2 text-sm w-full sm:w-auto"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold mb-1 truncate">
                    {profile.full_name || 'Anonymous User'}
                  </h1>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    {profile.profile_visibility === 'public' ? (
                      <>
                        <Eye size={14} />
                        <span>Public Profile</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={14} />
                        <span>Private Profile</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                  {profile.bio}
                </p>
              )}

              {/* Profile Meta - RESPONSIVE LAYOUT */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span className="truncate">{profile.location}</span>
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center gap-1 min-w-0">
                    <Globe size={14} />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600 dark:text-blue-400 truncate"
                    >
                      Website
                    </a>
                  </div>
                )}
                
                {profile.show_join_date && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Joined {formatJoinDate(profile.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Featured Achievements */}
              {featuredCustomAchievements.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Featured Achievements
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {featuredCustomAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                        <Star size={10} />
                        <span className="truncate max-w-[120px]">{achievement.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - RESPONSIVE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="card !p-3 sm:!p-4 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalEntries}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Entries</div>
          </div>

          <div className="card !p-3 sm:!p-4 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <Flame className="w-3 h-3 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>

          <div className="card !p-3 sm:!p-4 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-3 h-3 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold">{stats.uniqueDays}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active Days</div>
          </div>

          <div className="card !p-3 sm:!p-4 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold">{customAchievements.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Achievements</div>
          </div>
        </div>

        {/* Recent Progress Section */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold truncate">Recent Progress</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Latest achievements and milestones
                </p>
              </div>
            </div>

            {/* Controls - RESPONSIVE LAYOUT */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              {isOwnProfile && (
                <>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Filter size={12} className="sm:w-3.5 sm:h-3.5 text-gray-500 flex-shrink-0" />
                    <select
                      value={progressFilter}
                      onChange={(e) => setProgressFilter(e.target.value as 'all' | 'public' | 'private')}
                      className="text-xs sm:text-sm border border-black dark:border-white bg-white dark:bg-black px-2 py-1 rounded flex-1 sm:flex-none"
                    >
                      <option value="all">All Posts</option>
                      <option value="public">Public Only</option>
                      <option value="private">Private Only</option>
                    </select>
                  </div>
                  <Link to="/add" className="btn-primary flex items-center justify-center gap-2 px-3 py-2 text-sm whitespace-nowrap">
                    <Plus size={14} />
                    <span>Add Progress</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {recentProgress.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <div className="text-base sm:text-lg mb-2">
                {isOwnProfile 
                  ? progressFilter === 'all' 
                    ? 'No progress entries yet'
                    : `No ${progressFilter} progress entries yet`
                  : 'No public progress shared yet'
                }
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 sm:mb-4">
                {isOwnProfile 
                  ? 'Start documenting your daily achievements!'
                  : 'This user hasn\'t shared any public progress yet.'
                }
              </p>
              {isOwnProfile && (
                <Link to="/add" className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} />
                  Add Progress
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {recentProgress.map((progress) => (
                <CommunityProgressCard
                  key={progress.id}
                  progress={{
                    ...progress,
                    profiles: profile
                  }}
                  showUserInfo={false}
                  allowSharing={true}
                />
              ))}
              
              {recentProgress.length >= 6 && (
                <div className="text-center">
                  <Link 
                    to={isOwnProfile ? "/" : `/profile/${targetUserId}`}
                    className="btn-secondary"
                  >
                    View All Progress
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Trophy className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Achievements</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {customAchievements.length} achievements earned
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setShowAchievementModal(true)}
                className="btn-primary flex items-center justify-center gap-2 px-3 py-2 text-sm w-full sm:w-auto"
              >
                <Plus size={14} />
                <span>Add Achievement</span>
              </button>
            )}
          </div>

          {customAchievements.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <div className="text-base sm:text-lg mb-2">No achievements yet</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 sm:mb-4">
                {isOwnProfile 
                  ? 'Add your certifications, awards, and accomplishments!'
                  : 'This user hasn\'t added any achievements yet.'
                }
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => setShowAchievementModal(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Achievement
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {customAchievements.map((achievement) => (
                <CustomAchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  showActions={isOwnProfile}
                  onToggleFeatured={() => handleToggleFeatured(achievement.id, achievement.is_featured)}
                  onDelete={() => handleDeleteCustomAchievement(achievement.id)}
                />
              ))}
            </div>
          )}

          {customAchievements.length > 6 && (
            <div className="text-center mt-4 sm:mt-6">
              <button className="btn-secondary">
                View All Achievements ({customAchievements.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isOwnProfile && (
        <>
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            profile={profile}
            onProfileUpdated={(updatedProfile) => {
              setProfile(updatedProfile)
              setShowEditModal(false)
            }}
          />
          
          <ShareProfileModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            profile={profile}
            stats={stats}
          />

          {showAvatarSelector && (
            <AvatarSelector
              currentAvatar={profile.avatar_url}
              onAvatarSelect={handleAvatarSelect}
              onClose={() => setShowAvatarSelector(false)}
              disabled={updatingAvatar}
            />
          )}

          <AchievementModal
            isOpen={showAchievementModal}
            onClose={() => setShowAchievementModal(false)}
            onAchievementAdded={() => {
              fetchCustomAchievements()
              setShowAchievementModal(false)
            }}
          />
        </>
      )}
    </Layout>
  )
}