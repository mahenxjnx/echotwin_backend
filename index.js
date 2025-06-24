const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  const audioPath = req.file.path;

  try {
    const whisperRes = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      fs.createReadStream(audioPath),
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        params: { model: 'whisper-1' },
      }
    );

    const transcript = whisperRes.data.text;

    const gptRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Summarize this transcript clearly.' },
          { role: 'user', content: transcript },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const summary = gptRes.data.choices[0].message.content;

    res.json({ transcript, summary });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    fs.unlinkSync(audioPath);
  }
});

app.listen(3000, () => {
  console.log('🔥 EchoTwin backend running on http://localhost:3000');
});
