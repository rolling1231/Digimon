import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const DIGIMON = {
  koromon: {
    name: "코로몬",
    image: "/images/koromon.png",
    label: "유년기",
  },
  agumon: {
    name: "아구몬",
    image: "/images/agumon.png",
    label: "성장기",
  },
  greymon: {
    name: "그레이몬",
    image: "/images/greymon.png",
    label: "성숙기",
  },
  metalgreymon: {
    name: "메탈그레이몬",
    image: "/images/metalgreymon.png",
    label: "완전체",
  },
  skullgreymon: {
    name: "스컬그레이몬",
    image: "/images/skullgreymon.png",
    label: "암흑진화",
  },
};

const EVOLUTION_VIDEO = {
  agumon: "/videos/koromon-to-agumon.mp4",
  greymon: "/videos/agumon-to-greymon.mp4",
  metalgreymon: "/videos/greymon-to-metalgreymon.mp4",
  skullgreymon: "/videos/greymon-to-skullgreymon.mp4",
};

function App() {
  const [stage, setStage] = useState("intro");
  const [userName, setUserName] = useState("");
  const [digimonStage, setDigimonStage] = useState("koromon");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [growthGauge, setGrowthGauge] = useState(0);
  const [darkGauge, setDarkGauge] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const currentDigimon = DIGIMON[digimonStage];

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const enterDigitalWorld = () => {
    setStage("portal");
    setTimeout(() => {
      setDigimonStage("koromon");
      setStage("naming");
    }, 2500);
  };

  const handleStart = () => {
    if (userName.trim() === "") return;
    setMessages([
      {
        sender: "digimon",
        text: `안녕, ${userName}! 나는 코로몬이야. 네 고민을 들으면서 함께 성장할게.`,
      },
    ]);
    setStage("chat");
  };

  const getEvolutionLine = (stageName) => {
    if (stageName === "agumon") return "내 안에 뜨거운 힘이 느껴져! 이제 내가 네 고민을 더 제대로 들어줄 수 있어.";
    if (stageName === "greymon") return "고민을 피하지 않고 마주한 너 덕분에 더 강해졌어.";
    if (stageName === "metalgreymon") return "이제 너는 답을 알고 있어. 나는 네 선택을 믿어.";
    if (stageName === "skullgreymon") return "감정이 너무 깊어졌어. 나는 조금 위험한 모습이 되어버렸어.";
    return "진화했어.";
  };

  const evolveTo = (nextStage) => {
    const fromName = DIGIMON[digimonStage].name;
    const toName = DIGIMON[nextStage].name;
    setIsEvolving({
      from: fromName,
      to: toName,
      nextStage,
      video: EVOLUTION_VIDEO[nextStage],
    });
  };

  const finishEvolution = () => {
    if (!isEvolving) return;
    const nextStage = isEvolving.nextStage;
    const toName = DIGIMON[nextStage].name;
    setDigimonStage(nextStage);
    setIsEvolving(false);
    setMessages((prev) => [
      ...prev,
      { sender: "system", text: `${toName}(으)로 진화했습니다.` },
      { sender: "digimon", text: getEvolutionLine(nextStage) },
    ]);
  };

  const analyzeMessage = (text) => {
    const darkWords = ["죽", "싫어", "짜증", "화나", "포기", "망함", "우울", "최악"];
    const growthWords = ["해볼게", "괜찮", "고마워", "노력", "할 수", "정리", "계획", "해결"];
    let growth = 18;
    let dark = 5;
    darkWords.forEach((word) => { if (text.includes(word)) dark += 18; });
    growthWords.forEach((word) => { if (text.includes(word)) growth += 18; });
    return { growth, dark };
  };

  const handleSend = async () => {
    if (input.trim() === "" || isEvolving || isLoading) return;

    const userText = input.trim();
    const { growth, dark } = analyzeMessage(userText);

    const newGrowth = Math.min(growthGauge + growth, 100);
    const newDark = Math.min(darkGauge + dark, 100);

    // 사용자 메시지 즉시 추가
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setIsLoading(true);

    try {
      // 진짜 백엔드(Gemini)에 요청! (이름도 같이 보낸다구!)
      const response = await axios.post("http://localhost:4000/api/chat", {
        message: userText,
        userName: userName
      });

      const reply = response.data.reply;

      setMessages((prev) => [...prev, { sender: "digimon", text: reply }]);
      setGrowthGauge(newGrowth);
      setDarkGauge(newDark);

      // 진화 체크 로직
      const messageCount = messages.filter((m) => m.sender === "user").length + 1;
      if (newDark >= 80 && digimonStage !== "skullgreymon") {
        evolveTo("skullgreymon");
      } else if (messageCount >= 5 && newGrowth >= 85 && digimonStage !== "metalgreymon") {
        evolveTo("metalgreymon");
      } else if (messageCount >= 2 && digimonStage === "koromon") {
        evolveTo("agumon");
      } else if (messageCount >= 4 && digimonStage === "agumon") {
        evolveTo("greymon");
      }

    } catch (error) {
      console.error("Failed to fetch Agumon reply:", error);
      setMessages((prev) => [
        ...prev, 
        { sender: "digimon", text: "미안해 태일아... 디지털 월드와 연결이 잠시 끊긴 것 같아다구!" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    setStage("intro");
    setUserName("");
    setDigimonStage("koromon");
    setMessages([]);
    setGrowthGauge(0);
    setDarkGauge(0);
    setInput("");
    setIsEvolving(false);
  };

  if (stage === "intro") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e3a8a_0%,_#020617_45%,_#000_100%)] opacity-70" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center"
        >
          <h1 className="text-6xl font-bold tracking-widest mb-6">
            DIGIWORLD LINK
          </h1>

          <p className="text-gray-400 mb-10">
            디지바이스 신호가 감지되었습니다
          </p>

          <button
            onClick={enterDigitalWorld}
            className="px-8 py-4 border border-white rounded-xl hover:bg-white hover:text-black transition text-lg"
          >
            디지바이스 연결
          </button>
        </motion.div>
      </div>
    );
  }

  if (stage === "portal") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.1, 1],
            opacity: 1,
            rotate: [0, 2, -2, 0],
          }}
          transition={{ duration: 0.8 }}
          className="relative z-20 w-72 h-96 border-4 border-white rounded-[3rem] flex flex-col items-center justify-center bg-zinc-900 shadow-2xl"
        >
          <div className="w-44 h-44 border-2 border-zinc-500 rounded-2xl bg-black flex items-center justify-center mb-8 overflow-hidden">
            <motion.div
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.08, 1],
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-5xl"
            >
              ᛫᛫᛫
            </motion.div>
          </div>

          <p className="text-sm tracking-widest text-zinc-400">
            DIGIVICE LINK
          </p>

          <motion.p
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="mt-3 text-lg font-bold"
          >
            CONNECTING
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 3.5], opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.4 }}
          className="absolute w-96 h-96 rounded-full border-4 border-cyan-300 z-10"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1] }}
          transition={{ duration: 2.4 }}
          className="absolute inset-0 bg-gradient-to-br from-black via-blue-950 to-black"
        />

        <p className="absolute bottom-16 text-zinc-300 tracking-widest z-20">
          DIGITAL WORLD GATE OPENING...
        </p>
      </div>
    );
  }

  if (stage === "naming") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img
            src="/images/koromon.png"
            alt="코로몬"
            className="w-[340px] h-[340px] object-contain"
          />
        </motion.div>

        <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-xl text-center">
          <p className="text-2xl mb-3">안녕! 나는 코로몬이야!</p>
          <p className="text-gray-400 text-lg">너의 이름은 뭐야?</p>
        </div>

        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          placeholder="이름 입력"
          className="mt-8 w-full max-w-sm bg-transparent border border-gray-500 rounded-xl px-5 py-4 text-center text-xl outline-none focus:border-white"
        />

        <button
          onClick={handleStart}
          className="mt-6 px-8 py-4 border border-white rounded-xl hover:bg-white hover:text-black transition"
        >
          시작하기
        </button>
      </div>
    );
  }

  if (stage === "chat") {
    return (
      <div className="h-screen bg-zinc-950 text-white flex overflow-hidden relative">
        <AnimatePresence>
          {isEvolving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black flex items-center justify-center"
            >
              {isEvolving.video ? (
                <video
                  src={isEvolving.video}
                  autoPlay
                  playsInline
                  onEnded={finishEvolution}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-5xl font-bold">EVOLUTION</div>
              )}

              <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-white text-3xl font-black drop-shadow-lg">
                  {isEvolving.from} → {isEvolving.to}
                </p>
              </div>

              <button
                onClick={finishEvolution}
                className="absolute top-6 right-6 bg-white text-black px-4 py-2 rounded-lg font-bold"
              >
                SKIP
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="w-[42%] min-w-[460px] bg-black border-r border-zinc-800 flex flex-col items-center justify-center p-8">
          <p className="text-sm text-zinc-500 tracking-widest mb-6">
            CURRENT PARTNER
          </p>

          <motion.div
            key={digimonStage}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              scale: [1, 1.03, 1],
              opacity: 1,
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="mb-8"
          >
            <img
              src={currentDigimon.image}
              alt={currentDigimon.name}
              className="w-[420px] h-[420px] object-contain"
            />
          </motion.div>

          <h2 className="text-5xl font-bold">{currentDigimon.name}</h2>
          <p className="text-zinc-500 mt-3 text-lg">{currentDigimon.label}</p>
        </section>

        <section className="flex-1 flex flex-col">
          <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-8">
            <div>
              <h1 className="text-2xl font-bold">{userName}의 고민방</h1>
              <p className="text-zinc-500 text-sm">
                고민을 말하면 파트너가 성장합니다
              </p>
            </div>

            <button
              onClick={resetApp}
              className="text-sm border border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-800"
            >
              처음으로
            </button>
          </header>

          <main ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "system" ? (
                  <div className="w-full text-center text-yellow-400 text-sm my-4">
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[70%] rounded-2xl px-5 py-4 leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-white shadow-lg"
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 rounded-2xl px-5 py-4 flex gap-2 items-center">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>•</motion.div>
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>•</motion.div>
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>•</motion.div>
                </div>
              </div>
            )}
          </main>

          <footer className="border-t border-zinc-800 p-6 flex gap-3">
            <input
              disabled={!!isEvolving || isLoading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isLoading ? "아구몬이 생각 중입니다..." : "고민을 입력하세요"}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 outline-none focus:border-white disabled:opacity-40"
            />

            <button
              disabled={!!isEvolving || isLoading}
              onClick={handleSend}
              className="px-6 py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-40"
            >
              {isLoading ? "..." : "보내기"}
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return null;
}

export default App;
