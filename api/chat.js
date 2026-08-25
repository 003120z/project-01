export default async function handler(request, response) {
    try {
      const messages = request.body.messages;
      const userId = request.body.user_id;

      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

      if (userId && lastUserMessage) {
        try {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.SUPABASE_SECRET_KEY,
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              user_id: userId,
              role: "user",
              content: lastUserMessage.content
            })
          });
        } catch (error) {}
      }

      const gmiResponse = await fetch("https://api.gmi-serving.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GMI_API_KEY}`
        },
        body: JSON.stringify({
          model: "MiniMaxAI/MiniMax-M3",
          messages: messages
        })
      });
  
      const data = await gmiResponse.json();

      const reply = data.choices?.[0]?.message?.content || "Модель не вернула ответ";

      if (userId && reply) {
        try {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.SUPABASE_SECRET_KEY,
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              user_id: userId,
              role: "assistant",
              content: reply
            })
          });
        } catch (error) {}
      }

      response.status(200).json({
        reply: reply
      });
    } catch (error) {
      response.status(500).json({
        error: "Не удалось получить ответ AI"
      });
    }
  }