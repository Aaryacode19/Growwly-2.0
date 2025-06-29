const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface MusicTrack {
  id: string
  title: string
  artist: string
  description: string
  url: string
  duration: number
  genre: string
  created_at: string
}

// Sample lofi music tracks - you can replace these URLs with your own hosted music files
const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: '1',
    title: 'Chill Study Vibes',
    artist: 'Focus Beats',
    description: 'Perfect for concentration and deep work',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your music URL
    duration: 180,
    genre: 'lofi',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Peaceful Morning',
    artist: 'Ambient Sounds',
    description: 'Relaxing beats for a calm start',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your music URL
    duration: 200,
    genre: 'lofi',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Coffee Shop Ambience',
    artist: 'Study Music Co.',
    description: 'Background music for productivity',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your music URL
    duration: 165,
    genre: 'lofi',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Rainy Day Focus',
    artist: 'Lofi Collective',
    description: 'Gentle beats with rain sounds',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Replace with your music URL
    duration: 220,
    genre: 'lofi',
    created_at: new Date().toISOString()
  }
]

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname

    // GET /music-api - Get all tracks
    if (req.method === 'GET' && path === '/music-api') {
      const genre = url.searchParams.get('genre')
      const limit = url.searchParams.get('limit')
      
      let tracks = MUSIC_TRACKS
      
      // Filter by genre if specified
      if (genre) {
        tracks = tracks.filter(track => track.genre.toLowerCase() === genre.toLowerCase())
      }
      
      // Limit results if specified
      if (limit) {
        const limitNum = parseInt(limit, 10)
        if (!isNaN(limitNum) && limitNum > 0) {
          tracks = tracks.slice(0, limitNum)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: tracks,
          total: tracks.length
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // GET /music-api/[id] - Get specific track
    if (req.method === 'GET' && path.startsWith('/music-api/')) {
      const trackId = path.split('/').pop()
      const track = MUSIC_TRACKS.find(t => t.id === trackId)
      
      if (!track) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Track not found'
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: track
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // GET /music-api/random - Get random track(s)
    if (req.method === 'GET' && path === '/music-api/random') {
      const count = parseInt(url.searchParams.get('count') || '1', 10)
      const genre = url.searchParams.get('genre')
      
      let availableTracks = MUSIC_TRACKS
      if (genre) {
        availableTracks = availableTracks.filter(track => track.genre.toLowerCase() === genre.toLowerCase())
      }
      
      const shuffled = [...availableTracks].sort(() => Math.random() - 0.5)
      const randomTracks = shuffled.slice(0, Math.min(count, shuffled.length))

      return new Response(
        JSON.stringify({
          success: true,
          data: count === 1 ? randomTracks[0] : randomTracks,
          total: randomTracks.length
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // POST /music-api - Add new track (for future use)
    if (req.method === 'POST' && path === '/music-api') {
      const body = await req.json()
      
      // Validate required fields
      const requiredFields = ['title', 'artist', 'url']
      for (const field of requiredFields) {
        if (!body[field]) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Missing required field: ${field}`
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }

      const newTrack: MusicTrack = {
        id: (MUSIC_TRACKS.length + 1).toString(),
        title: body.title,
        artist: body.artist,
        description: body.description || '',
        url: body.url,
        duration: body.duration || 180,
        genre: body.genre || 'lofi',
        created_at: new Date().toISOString()
      }

      // In a real implementation, you'd save this to a database
      MUSIC_TRACKS.push(newTrack)

      return new Response(
        JSON.stringify({
          success: true,
          data: newTrack,
          message: 'Track added successfully'
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Route not found
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Route not found',
        availableRoutes: [
          'GET /music-api - Get all tracks',
          'GET /music-api/random - Get random track(s)',
          'GET /music-api/[id] - Get specific track',
          'POST /music-api - Add new track'
        ]
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})