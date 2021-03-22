const { test, expect } = require("@jest/globals");
const { doesNotMatch } = require("assert");
const Assistant = require("../src/index");

const handlers = require("./files/handlers");
const intents = require("./files/intents.json");

describe("Basic Assistant tests", () => {
  test("Initializes Assistant", () => {
    expect(typeof new Assistant(intents)).toBe("object");
  });

  test("Checks basic intent", async () => {
    const palathea = new Assistant(intents);
    const reply = await palathea.reply("Hola palathea");

    expect(reply.type).not.toBeFalsy();
    expect((await palathea.reply("Hola palathea")).response).toBe("Intent 1");
  });

  test("Does not check basic intent", async () => {
    const palathea = new Assistant(intents);
    const reply = await palathea.reply("This is a test");

    expect(reply.type).not.toBeFalsy();
    expect(reply.response).not.toBe("Intent 1");
  });
});

describe("Basic Handler tests", () => {
  test("Executes handler and replies with the correct information", async () => {
    const palathea = new Assistant(intents, handlers);
    expect(
      (await palathea.reply("prueba del handler, por favor")).response
    ).toBe("This is a handler test");
  });
});