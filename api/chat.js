export default async function handler(request, response) {
    try {
      const userId = request.body.user_id;
      const incomingMessages = request.body.messages || [];
      const newUserMessage = [...incomingMessages].reverse().find((m) => m.role === "user");

      let conversationId = request.body.conversation_id || null;

      if (!conversationId) {
        if (!userId) {
          return response.status(400).json({
            error: "Не указан conversation_id или user_id"
          });
        }

        let createdId = null;
        try {
          const createResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.SUPABASE_SECRET_KEY,
              "Prefer": "return=representation"
            },
            body: JSON.stringify({ user_id: userId })
          });
          if (createResponse.ok) {
            const createdRows = await createResponse.json();
            if (Array.isArray(createdRows) && createdRows[0] && createdRows[0].id) {
              createdId = createdRows[0].id;
            }
          }
        } catch (error) {}

        if (!createdId) {
          return response.status(500).json({
            error: "Не удалось создать диалог"
          });
        }

        conversationId = createdId;
      } else {
        const ownerCheck = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/conversations?id=eq.${conversationId}&user_id=eq.${userId}&select=id`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.SUPABASE_SECRET_KEY
            }
          }
        );
        if (!ownerCheck.ok) {
          return response.status(500).json({
            error: "Не удалось проверить доступ к диалогу"
          });
        }
        const ownerRows = await ownerCheck.json();
        if (!Array.isArray(ownerRows) || ownerRows.length === 0) {
          return response.status(403).json({
            error: "Диалог не найден или принадлежит другому пользователю"
          });
        }
      }

      let history = [];

      try {
        const historyResponse = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/messages?user_id=eq.${userId}&conversation_id=eq.${conversationId}&order=created_at.asc`,
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

      if (newUserMessage) {
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
              conversation_id: conversationId,
              role: "user",
              content: newUserMessage.content
            })
          });
        } catch (error) {}
      }

      if (reply) {
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
              conversation_id: conversationId,
              role: "assistant",
              content: reply
            })
          });
        } catch (error) {}
      }

      response.status(200).json({
        reply: reply,
        conversation_id: conversationId
      });
    } catch (error) {
      response.status(500).json({
        error: "Не удалось получить ответ AI"
      });
    }
  }