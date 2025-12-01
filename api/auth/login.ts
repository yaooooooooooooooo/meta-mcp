import { NextApiRequest, NextApiResponse } from 'next';
import { UserAuthManager } from '../../src/utils/user-auth.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate OAuth state for CSRF protection
    const state = await UserAuthManager.generateOAuthState();
    
    console.log('Generated OAuth state:', state);
    
    // Store state in a secure cookie for validation later
    const isProduction = req.headers.host?.includes('vercel.app') || req.headers.host?.includes('netlify.app');
    
    // Different cookie settings for different environments
    const cookieOptions = isProduction 
      ? `HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`
      : `HttpOnly; SameSite=Lax; Max-Age=600; Path=/`;
    
    console.log('Setting cookie with options:', cookieOptions);
    
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; ${cookieOptions}`, // 10 minutes
    ]);

    // Generate Meta OAuth URL
    const authUrl = UserAuthManager.generateMetaOAuthUrl(state);

    // Use HTML redirect instead of 302 to ensure cookie is stored before navigation
    // Some browsers don't store cookies from 302 redirects to cross-origin destinations
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${authUrl}">
        </head>
        <body>
          <p>Redirecting to Facebook...</p>
          <script>window.location.href = "${authUrl}";</script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}