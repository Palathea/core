export default {
  whatsYourName: {
    keywords: [
      "Cómo te llamas?",
      "cual es tu nombre"
    ],
    responses: [
      "Mi nombre es Palathea, encantada de conocerte",
      "Me llamo Palathea. Encantada!"
    ],
    type: "string"
  },
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
      responses: [
        "Van dos y se cae el del medio"
      ],
      type: "string"
  },
  thanks: {
      keywords: [
          "gracias palathea",
          "muchas gracias palathea"
      ],
      responses: [
        "No hay de qué",
        "Estoy aquí para ayudarte"
      ],
      type: "string"
  },
  interestinFact: {
      keywords: [
        "cuentame una curiosidad",
        "cuentame algo interesante"
      ],
      references: ["interestingFact"],
      handler: "interestingFactHandler",
      type: "string"
  },
  fallback: "No lo he entendido. Podrías repetirlo de nuevo?"
};
