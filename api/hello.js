export default function handler(request, response) {
    response.status(200).json({
      message: "Привет! Это ответ от моего backend"
    });
  }
  