import palathea from "./index.js";
import intents from "../tests/intents.js";
import handlers from "../tests/handlers.js";
import { FALLBACK_RESPONSE } from "./utils/constants.js";

import { describe, expect, test } from "vitest";

describe("Palathea", () => {
  describe("is able to reply with a valid response", () => {
    const assistant = palathea(intents, handlers);

    test("from an intent with simple responses", () => {
      const input = "Cómo te llamas?";
      const result = assistant.reply(input);

      expect(intents.whatsYourName.responses).to.include(result.content);
    });

    test("from an intent with a handler", () => {
      const input = "Buenas noches Palathea";
      const result = assistant.reply(input);

      expect(result).toStrictEqual(handlers[intents.greeting.handler]());
    });

    test("from an intent simple response after failing to execute its handler", () => {
      const input = "cuentame un chiste";
      const result = assistant.reply(input);

      const expected = {
        content: intents.joke.responses.at(0),
        type: intents.joke.type,
      };

      expect(result).toStrictEqual(expected);
    });
  });

  describe("replies with a fallback response", () => {
    test("when there is not a valid enough response but a custom fallback response", () => {
      const assistant = palathea(intents, handlers);

      const input = "No, me gusta hacer muchas cosas";
      const result = assistant.reply(input);

      expect(result).toStrictEqual(intents.fallback);
    });

    test("when there is not a valid enough response nor custom fallback response", () => {
        const assistant = palathea({...intents, fallback: null}, handlers);

      const input = "No, me gusta hacer muchas cosas";
      const result = assistant.reply(input);

      expect(result).toStrictEqual(FALLBACK_RESPONSE)
    });
  });

  describe("handles conversational flow", () => {
    test("returns the previousIntentId", () => {
      const assistant = palathea(intents, handlers);
      const input = "Buenos días por la mañana";

      assistant.reply(input);

      const expected = "greeting";

      expect(assistant.getPreviousIntent()).toStrictEqual(expected);
    });

    test("returns null if no replies have been thrown", () => {
      const assistant = palathea(intents, handlers);

      expect(assistant.getPreviousIntent()).toStrictEqual(null);
    });
  });
});
