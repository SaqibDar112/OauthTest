import express from 'express';
import cors from 'cors';
import { FrejunOAuth } from '@frejun/oauth';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

const oauth = new FrejunOAuth({
  clientId: "*****",
  clientSecret: "****",
});

app.post('/auth/create-tokens', async (req, res) => {
  const result = await oauth.createTokens(req.body.code);
  res.json(result);
});

app.post('/auth/refresh', async (req, res) => {
  const result = await oauth.refreshTokens(req.body.refresh_token);
  res.json(result);
});

app.post('/auth/verify', async (req, res) => {
  const result = await oauth.verifyToken(req.body.token);
  res.json(result);
});

app.post('/auth/disconnect', async (req, res) => {
  const result = await oauth.disconnect(req.body.refresh_token);
  res.json(result);
});

app.listen(8000, () => console.log('Backend running on http://localhost:8000'));
