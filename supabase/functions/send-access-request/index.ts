interface AccessRequestPayload {
  email: string
  fullName: string
  reason: string
  company?: string
  portfolioUrl?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    let payload: AccessRequestPayload
    try {
      payload = await req.json()
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { email, fullName, reason, company, portfolioUrl } = payload

    // Validate required fields
    if (!email || !fullName || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, fullName, and reason are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')

    // If email service is not configured, return success without sending email
    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Access request received successfully (email notification not configured)' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send email using Resend
    try {
      const emailPayload = {
        from: 'Growwly <onboarding@resend.dev>', // Use Resend's default domain
        to: [ADMIN_EMAIL],
        subject: `New Access Request from ${fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Access Request for Growwly</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${fullName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Company:</strong> ${company || 'Not provided'}</p>
              <p><strong>Portfolio:</strong> ${portfolioUrl ? `<a href="${portfolioUrl}" style="color: #0066cc;">${portfolioUrl}</a>` : 'Not provided'}</p>
            </div>
            <div style="margin: 20px 0;">
              <p><strong>Reason for access:</strong></p>
              <div style="background: #fff; padding: 15px; border-left: 4px solid #0066cc; margin: 10px 0;">
                ${reason.replace(/\n/g, '<br>')}
              </div>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;"><em>Submitted at: ${new Date().toLocaleString()}</em></p>
          </div>
        `,
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      const responseText = await emailResponse.text()

      if (!emailResponse.ok) {
        // Still return success since the database insert succeeded
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Access request received (email notification failed)',
            emailError: responseText
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Access request sent successfully with email notification' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (emailError) {
      // Still return success since the database insert succeeded
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Access request received (email notification failed)',
          emailError: emailError instanceof Error ? emailError.message : 'Unknown email error'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ 
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