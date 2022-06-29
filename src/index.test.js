import palathea from "./index.js";
import intents from "../tests/intents.js";
import handlers from "../tests/handlers.js";

import handlerWrapper from "./wrappers/handlerWrapper.js";
import { FALLBACK_RESPONSE } from "./utils/constants.js";

import { describe, expect, test } from "vitest";

describe("Palathea", () => {
  describe("is able to reply with a valid response", () => {
    const assistant = palathea(intents, handlers);

    test("from an intent with simple responses", async () => {
      const input = "Cómo te llamas?";
      const result = await assistant.reply(input);

      expect(intents.whatsYourName.responses).to.include(result.content);
    });

    test.only("from an intent with a handler", async () => {
      const input = "Buenas noches Palathea";
      const result = await assistant.reply(input);

      expect(result).toStrictEqual(
        await handlerWrapper(handlers[intents.greeting.handler])
      );
    });

    test("from an intent simple response after failing to execute its handler", async () => {
      const input = "cuentame un chiste";
      const result = await assistant.reply(input);

      const expected = {
        content: intents.joke.responses.at(0),
        type: intents.joke.type,
      };

      expect(result).toStrictEqual(expected);
    });
  });

  describe("replies with a fallback response", () => {
    test("when there is not a valid enough response but a custom fallback response", async () => {
      const assistant = palathea(intents, handlers);

      const input = "No, me gusta hacer muchas cosas";
      const result = await assistant.reply(input);

      expect(result).toStrictEqual({
        type: "error",
        content: intents.fallback,
      });
    });

    test("when there is not a valid enough response nor custom fallback response", async () => {
      const assistant = palathea({ ...intents, fallback: null }, handlers);

      const input = "No, me gusta hacer muchas cosas";
      const result = await assistant.reply(input);

      expect(result).toStrictEqual({
        type: "error",
        content: FALLBACK_RESPONSE,
      });
    });
  });

  describe("handles conversational flow", () => {
    test("returns the previousIntentId", async () => {
      const assistant = palathea(intents, handlers);
      const input = "Buenos días por la mañana";

      await assistant.reply(input);

      const expected = "greeting";

      expect(assistant.getPreviousIntent()).toStrictEqual(expected);
    });

    test("returns null if no replies have been thrown", async () => {
      const assistant = palathea(intents, handlers);

      expect(assistant.getPreviousIntent()).toStrictEqual(null);
    });
  });
});
