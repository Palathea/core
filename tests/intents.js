export default {
  greeting: {
    keywords: [
      ["buenos", "dias"],
      ["buenos", "dias", "palathea"],
      ["buenas", "noches"],
      ["buenas", "tardes"],
    ],
    handler: "greetingHandler",
    type: "string",
  },
  getWeather: {
      keywords: [
          ["que", "tiempo", "hace", "hoy"],
          ["que", "tiempo", "hara", "hoy"]
      ],
      handler: "weatherHandler",
      type: "string"
  },
  joke: {
      keywords: [
          ["cuentame", "chiste"],
          ["podrias", "contarme", "chiste"]
      ],
      handler: "jokeHandler",
      type: "string"
  },
  thanks: {
      keywords: [
          ["gracias", "palathea"],
          ["muchas", "gracias", "palathea"],
          ["muchas", "gracias"]
      ],
      responses: [
        "No hay de qué",
        "Estoy aquí para ayudarte"
      ],
      type: "string"
  },
  interestinFact: {
      keywords: [
          ["cuentame", "curiosidad"],
          ["cuentame", "algo", "interesante"]
      ],
      handler: "interestingFactHandler",
      type: "string"
  }
};
