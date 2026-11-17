const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/api/quiz', async (req, res) => {
  try {
    const { questions, creator } = req.body;
    const { data, error } = await supabase.from('quizzes').insert([{ questions, creator: creator || 'Anonymous' }]).select().single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/quiz/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('quizzes').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));
