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

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  try {
    const { data: plan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return res.status(200).json({
        can_start: false,
        minutes_remaining: 0,
        minutes_used: 0,
        monthly_limit: 0,
        plan_type: 'none'
      });
    }

    const monthlyLimit = plan.voice_minutes;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: sessions, error: sessionsError } = await supabase
      .from('voice_sessions')
      .select('duration_seconds')
      .eq('user_id', user_id)
      .gte('created_at', monthStart.toISOString());

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: 'Database error' });
    }

    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const minutesUsed = Math.ceil(totalSeconds / 60);
    const minutesRemaining = Math.max(0, monthlyLimit - minutesUsed);

    return res.status(200).json({
      can_start: minutesRemaining > 0,
      minutes_remaining: minutesRemaining,
      minutes_used: minutesUsed,
      monthly_limit: monthlyLimit,
      plan_type: plan.plan_name
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
