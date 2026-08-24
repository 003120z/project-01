const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
const demoChat = document.getElementById("demoChat");
const demoForm = document.getElementById("demoForm");
const demoInput = document.getElementById("demoInput");
const signupForm = document.getElementById("signupForm");
const formMessage = document.getElementById("formMessage");

menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
  });
});

document.querySelector('.hero-actions a[href="#demo"]').addEventListener("click", (event) => {
  event.preventDefault();
  demoChat.scrollIntoView({ behavior: "smooth", block: "start" });
});

function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = "bubble " + type;
  bubble.textContent = text;
  demoChat.appendChild(bubble);
  demoChat.scrollTop = demoChat.scrollHeight;
}

function replyTo(message) {
  const text = message.toLowerCase();

  if (text.includes("роз") || text.includes("букет") || text.includes("пион")) {
    return "Да, розы и пионы есть. Букет к пятнице соберём, если закажете сегодня. Нужна доставка или самовывоз?";
  }
  if (text.includes("цен") || text.includes("сколько") || text.includes("стоит")) {
    return "Сборные букеты от 2 500 ₽, монобукет роз — от 3 200 ₽. Могу подобрать вариант под ваш бюджет.";
  }
  if (text.includes("доставк") || text.includes("адрес")) {
    return "Доставляем по городу с 10:00 до 20:00. Напишите адрес и удобный интервал — передадим курьеру.";
  }
  if (text.includes("работ") || text.includes("открыт") || text.includes("час")) {
    return "Мы открыты ежедневно с 10:00 до 21:00. Самовывоз — улица Садовая, 8.";
  }
  if (text.includes("запис") || text.includes("завтра") || text.includes("время")) {
    return "Могу забронировать сборку на завтра. Напишите время и для какого случая букет.";
  }

  return "Спасибо за сообщение! Уточните, пожалуйста: нужен букет, доставка или часы работы — подскажу точнее.";
}

addBubble("Здравствуйте! Можно заказать букет на пятницу?", "incoming");
addBubble(
  "Конечно. Напишите, какой цветок любите и нужен ли курьер — соберём и подтвердим.",
  "outgoing"
);

demoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = demoInput.value.trim();
  if (!message) {
    return;
  }

  addBubble(message, "incoming");
  demoInput.value = "";

  window.setTimeout(() => {
    addBubble(replyTo(message), "outgoing");
  }, 500);
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.classList.remove("error");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const business = document.getElementById("business").value.trim();

  if (!name || !email || !business) {
    formMessage.classList.add("error");
    formMessage.textContent = "Заполните все поля.";
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    formMessage.classList.add("error");
    formMessage.textContent = "Похоже, email указан неверно.";
    return;
  }

  formMessage.textContent =
    "Заявка принята (только в этом окне). Спасибо, " + name + "!";
  signupForm.reset();
});

const factBtn = document.getElementById("factBtn");
const factText = document.getElementById("factText");

factBtn.addEventListener("click", async () => {
  factText.textContent = "Загрузка...";

  try {
    const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
    if (!response.ok) {
      throw new Error();
    }
    const data = await response.json();
    factText.textContent = data.text;
  } catch (error) {
    factText.textContent = "Не удалось получить факт. Попробуйте ещё раз.";
  }
});

const helloBtn = document.getElementById("helloBtn");
const helloText = document.getElementById("helloText");

helloBtn.addEventListener("click", async () => {
  const response = await fetch("/api/hello");
  const data = await response.json();
  helloText.textContent = data.message;
});
