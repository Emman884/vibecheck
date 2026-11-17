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

async function getOrCreateUser(username) {
  if (!username) username = "guest_" + Math.random().toString(36).slice(2, 8);
  let { data } = await supabase.from('users').select('*').eq('username', username).single();
  if (!data) {
    const { data: newUser } = await supabase.from('users').insert([{ username, coins: 50 }]).select().single();
    data = newUser;
  }
  return data;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});
