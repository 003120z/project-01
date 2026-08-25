export default async function handler(request, response) {
    try {
      const gmiResponse = await fetch("https://api.gmi-serving.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GMI_API_KEY}`
        },
        body: JSON.stringify({
          model: "MiniMaxAI/MiniMax-M3",
          messages: [
            {
              role: "user",
              content: "Привет! Ответь одной короткой фразой на русском."
            }
          ]
        })
      });
  
      const data = await gmiResponse.json();
  
      response.status(200).json({
        reply: data.choices?.[0]?.message?.content || "Модель не вернула ответ"
      });
    } catch (error) {
      response.status(500).json({
        error: "Не удалось получить ответ AI"
      });
    }
  }