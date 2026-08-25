export default async function handler(request, response) {
    try {
      const userId = request.body.user_id;
      const incomingMessages = request.body.messages || [];
      const newUserMessage = [...incomingMessages].reverse().find((m) => m.role === "user");

      let history = [];

      if (userId) {
        try {
          const historyResponse = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/messages?user_id=eq.${userId}&order=created_at.asc`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "apikey": process.env.SUPABASE_SECRET_KEY
              }
            }
          );
          if (historyResponse.ok) {
            const rows = await historyResponse.json();
            history = rows.map((row) => ({ role: row.role, content: row.content }));
          }
        } catch (error) {}
      }

      if (newUserMessage) {
        const last = history[history.length - 1];
        if (!last || last.role !== "user" || last.content !== newUserMessage.content) {
          history.push({ role: "user", content: newUserMessage.content });
        }
      }

      const gmiResponse = await fetch("https://api.gmi-serving.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GMI_API_KEY}`
        },
        body: JSON.stringify({
          model: "MiniMaxAI/MiniMax-M3",
          messages: history
        })
      });

      const data = await gmiResponse.json();

      const reply = data.choices?.[0]?.message?.content || "Модель не вернула ответ";

      if (userId && newUserMessage) {
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
              content: newUserMessage.content
            })
          });
        } catch (error) {}
      }

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