import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, session_id, duration_seconds } = req.body;

  if (!user_id || !session_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { error } = await supabase
      .from('voice_sessions')
      .update({
        duration_seconds: duration_seconds,
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('session_id', session_id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error ending session:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
