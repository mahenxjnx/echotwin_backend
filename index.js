const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data'); // Only here!
require('dotenv').config();

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  const audioPath = req.file.path;

  try {
    // 🔥 Whisper Transcription
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');

    const whisperRes = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    const transcript = whisperRes.data.text;

    // 🔮 GPT Summarization
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

    // 🚀 Respond back to app
    res.json({ transcript, summary });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  } finally {
    fs.unlinkSync(audioPath); // 🧹 Clean up file
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 EchoTwin backend running on port ${PORT}`);
});