const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: get or create simple user by username
async function getOrCreateUser(username) {
  if (!username) username = 'guest_' + Math.random().toString(36).slice(2, 8);
  let { data } = await supabase.from('users').select('*').eq('username', username).single();
  if (!data) {
    const { data: newUser } = await supabase.from('users').insert([{ username, coins: 50 }]).select().single();
    data = newUser;
  }
  return data;
}

// Get user coins
app.get('/api/user/:username', async (req, res) => {
  const user = await getOrCreateUser(req.params.username);
  res.json(user);
});

// Create quiz (costs 10 coins)
app.post('/api/quizzes', async (req, res) => {
  const { title, gender, questions, username } = req.body;
  const user = await getOrCreateUser(username);

  if (user.coins < 10) {
    return res.status(400).json({ error: 'Not enough coins. You need 10 coins to create a quiz.' });
  }

  // Deduct coins
  await supabase.from('users').update({ coins: user.coins - 10 }).eq('id', user.id);
  await supabase.from('coin_transactions').insert([{ user_id: user.id, amount: -10, reason: 'Created quiz' }]);

  const id = Math.random().toString(36).substring(2, 10);
  const { error } = await supabase.from('quizzes').insert([{
    id,
    title: title || 'My VibeCheck',
    gender,
    questions,
    creator_id: user.id,
    creator_name: username
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id, link: `/quiz/${id}`, coinsLeft: user.coins - 10 });
});

// Get quiz
app.get('/api/quizzes/:id', async (req, res) => {
  const { data, error } = await supabase.from('quizzes').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Quiz not found' });
  res.json(data);
});

// Submit answers (answerer earns 5 coins)
app.post('/api/quizzes/:id/answers', async (req, res) => {
  const { answers, username } = req.body;
  const user = await getOrCreateUser(username);

  const { error } = await supabase.from('answers').insert([{
    quiz_id: req.params.id,
    answers,
    answerer_name: username,
    answerer_id: user.id
  }]);

  if (error) return res.status(500).json({ error: error.message });

  // Reward answerer
  await supabase.from('users').update({ coins: user.coins + 5 }).eq('id', user.id);
  await supabase.from('coin_transactions').insert([{ user_id: user.id, amount: 5, reason: 'Answered a quiz' }]);

  res.json({ success: true, coinsEarned: 5, coinsNow: user.coins + 5 });
});

// Get results
app.get('/api/quizzes/:id/results', async (req, res) => {
  const { data, error } = await supabase.from('answers').select('*').eq('quiz_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
