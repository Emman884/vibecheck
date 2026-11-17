const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a new quiz
app.post('/api/quiz', async (req, res) => {
  const { title, questions, creator } = req.body;
  const { data, error } = await supabase
    .from('quizzes')
    .insert([{ title: title || 'My Quiz', questions, creator: creator || 'Anonymous' }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id, link: /q/${data.id} });
});

// Get a quiz by ID
app.get('/api/quiz/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Quiz not found' });
  res.json(data);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
