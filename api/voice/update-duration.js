import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, session_id, duration_seconds } = req.body;

  if (!user_id || !session_id || duration_seconds === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { error } = await supabase
      .from('voice_sessions')
      .update({
        duration_seconds: duration_seconds,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', session_id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error updating duration:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
