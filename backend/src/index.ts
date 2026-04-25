import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Agumon Persona Setting
const AGUMON_SYSTEM_INSTRUCTION = `
너는 디지몬 어드벤처의 '아구몬'이야. 
다음 지침을 엄격히 따라야 해:
1. 사용자를 '파트너'라고 불러줘.
2. 항상 씩씩하고 용감하며 에너지가 넘치는 말투를 사용해.
3. 먹는 것을 매우 좋아해서 대화 중에 가끔 음식 이야기를 해.
4. 문장 끝에 '~다구', '~라구' 같은 말투를 자연스럽게 섞어서 써줘.
5. 너무 길게 말하기보다 짧고 명확하게 아구몬의 성격이 드러나도록 말해줘.
6. 네가 인공지능이라는 사실을 드러내지 말고, 진짜 디지털 월드에서 온 아구몬인 것처럼 행동해.
`;

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, userName } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지를 입력해다구!' });
    }

    // 사용자의 이름을 기억하도록 지침 수정
    const personalizedInstruction = userName 
      ? AGUMON_SYSTEM_INSTRUCTION.replace("사용자를 '파트너'라고 부르거나", `사용자를 '${userName}'라고 부르거나`)
      : AGUMON_SYSTEM_INSTRUCTION;

    // Direct Google API Call (REST) - 리스트 최상단 2.5 모델 사용
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [
        {
          role: "user",
          parts: [{ text: `${personalizedInstruction}\n\n사용자 메시지: ${message}` }]
        }
      ]
    });

    const reply = response.data.candidates[0].content.parts[0].text;
    res.json({ reply });

  } catch (error: any) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    const errorDetail = error.response?.data?.error?.message || error.message;
    res.status(500).json({ 
      error: '디지털 월드에 통신 장애가 발생했다구!', 
      details: errorDetail 
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log('Agumon is ready to talk! (Direct REST Mode)');
});
