import { useState, useEffect } from 'react'
import { BarChart3, Calendar, TrendingUp, Target, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LoadingScreen } from './LoadingScreen'

interface ProgressData {
  date: string
  count: number
  visibility: 'public' | 'private'
}

interface ProgressStats {
  totalEntries: number
  publicEntries: number
  privateEntries: number
  currentStreak: number
  longestStreak: number
  averagePerWeek: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
}

export function ProgressChart() {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [stats, setStats] = useState<ProgressStats>({
    totalEntries: 0,
    publicEntries: 0,
    privateEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    averagePerWeek: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  })
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProgressData()
    }
  }, [user, timeRange])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'month':
          startDate.setDate(endDate.getDate() - 30)
          break
        case 'year':
          startDate.setDate(endDate.getDate() - 365)
          break
      }

      const { data, error } = await supabase
        .from('daily_progress')
        .select('date, visibility, created_at')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error

      // Process data for chart
      const processedData = processProgressData(data || [])
      setProgressData(processedData)
      
      // Calculate comprehensive stats
      const calculatedStats = calculateStats(data || [])
      setStats(calculatedStats)
      
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processProgressData = (data: any[]) => {
    const groupedByDate: { [key: string]: { public: number, private: number } } = {}
    
    data.forEach(entry => {
      const date = entry.date
      if (!groupedByDate[date]) {
        groupedByDate[date] = { public: 0, private: 0 }
      }
      groupedByDate[date][entry.visibility]++
    })

    return Object.entries(groupedByDate).map(([date, counts]) => [
      { date, count: counts.public, visibility: 'public' as const },
      { date, count: counts.private, visibility: 'private' as const }
    ]).flat()
  }

  const calculateStats = (data: any[]): ProgressStats => {
    const totalEntries = data.length
    const publicEntries = data.filter(d => d.visibility === 'public').length
    const privateEntries = data.filter(d => d.visibility === 'private').length
    
    // Calculate streaks
    const uniqueDates = [...new Set(data.map(d => d.date))].sort()
    const { currentStreak, longestStreak } = calculateStreaks(uniqueDates)
    
    // Calculate time-based stats
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    
    const thisWeek = data.filter(d => new Date(d.date) >= oneWeekAgo).length
    const lastWeek = data.filter(d => {
      const date = new Date(d.date)
      return date >= twoWeeksAgo && date < oneWeekAgo
    }).length
    
    const thisMonth = data.filter(d => new Date(d.date) >= oneMonthAgo).length
    const lastMonth = data.filter(d => {
      const date = new Date(d.date)
      return date >= twoMonthsAgo && date < oneMonthAgo
    }).length
    
    const averagePerWeek = uniqueDates.length > 0 ? (uniqueDates.length / Math.max(1, uniqueDates.length / 7)) : 0
    
    return {
      totalEntries,
      publicEntries,
      privateEntries,
      currentStreak,
      longestStreak,
      averagePerWeek: Math.round(averagePerWeek * 10) / 10,
      thisWeek,
      lastWeek,
      thisMonth,
      lastMonth,
    }
  }

  const calculateStreaks = (sortedDates: string[]) => {
    if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 }
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1
    
    // Calculate current streak (from today backwards)
    const today = new Date().toISOString().split('T')[0]
    let checkDate = new Date(today)
    
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sortedDates.includes(dateStr)) {
        currentStreak++
      } else if (currentStreak > 0) {
        break // Streak is broken
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)
    
    return { currentStreak, longestStreak }
  }

  const getMaxCount = () => {
    return Math.max(...progressData.map(d => d.count), 1)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (timeRange === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else if (timeRange === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return { change: Math.round(change), isPositive: change >= 0 }
  }

  if (loading) {
    return (
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-green-600 dark:text-green-400">Loading progress data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">Progress Patterns</h3>
            <p className="text-xs text-green-600 dark:text-green-400">Your activity insights</p>
          </div>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
          className="text-xs border border-green-300 dark:border-green-600 bg-white dark:bg-black rounded px-2 py-1"
        >
          <option value="week">7 Days</option>
          <option value="month">30 Days</option>
          <option value="year">1 Year</option>
        </select>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Current Streak</span>
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.currentStreak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Best: {stats.longestStreak} days
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">This Week</span>
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.thisWeek}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {(() => {
              const { change, isPositive } = getChangeIndicator(stats.thisWeek, stats.lastWeek)
              return (
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '+' : ''}{change}% vs last week
                </span>
              )
            })()}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Public</span>
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.publicEntries}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.totalEntries > 0 ? Math.round((stats.publicEntries / stats.totalEntries) * 100) : 0}% of total
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-1">
            <EyeOff className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Private</span>
          </div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.privateEntries}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.totalEntries > 0 ? Math.round((stats.privateEntries / stats.totalEntries) * 100) : 0}% of total
          </div>
        </div>
      </div>

      {/* Simple Bar Chart */}
      {progressData.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
            Daily Activity ({timeRange})
          </div>
          
          <div className="space-y-1">
            {/* Group data by date for display */}
            {(() => {
              const groupedByDate: { [key: string]: { public: number, private: number } } = {}
              progressData.forEach(item => {
                if (!groupedByDate[item.date]) {
                  groupedByDate[item.date] = { public: 0, private: 0 }
                }
                groupedByDate[item.date][item.visibility] = item.count
              })
              
              return Object.entries(groupedByDate)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-10) // Show last 10 days
                .map(([date, counts]) => {
                  const total = counts.public + counts.private
                  const maxCount = getMaxCount()
                  
                  return (
                    <div key={date} className="flex items-center gap-2">
                      <div className="w-12 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(date)}
                      </div>
                      <div className="flex-1 flex gap-0.5">
                        {/* Public entries bar */}
                        <div
                          className="bg-green-500 dark:bg-green-400 rounded-l"
                          style={{
                            width: `${(counts.public / Math.max(maxCount, 1)) * 100}%`,
                            minWidth: counts.public > 0 ? '4px' : '0px',
                            height: '16px'
                          }}
                          title={`${counts.public} public entries`}
                        />
                        {/* Private entries bar */}
                        <div
                          className="bg-green-300 dark:bg-green-600 rounded-r"
                          style={{
                            width: `${(counts.private / Math.max(maxCount, 1)) * 100}%`,
                            minWidth: counts.private > 0 ? '4px' : '0px',
                            height: '16px'
                          }}
                          title={`${counts.private} private entries`}
                        />
                      </div>
                      <div className="w-6 text-xs text-gray-600 dark:text-gray-400 text-right">
                        {total}
                      </div>
                    </div>
                  )
                })
            })()}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded"></div>
              <span>Public</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-300 dark:bg-green-600 rounded"></div>
              <span>Private</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            No progress data for this period
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Start adding entries to see your patterns!
          </div>
        </div>
      )}
    </div>
  )
}