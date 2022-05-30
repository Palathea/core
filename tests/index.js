import Palathea from "../src/index.js";
import intents from "./intents.js";
import handlers from "./handlers.js";

const assistant = Palathea(intents, handlers)

console.log(assistant.reply("Buenos días juan carlos"))
console.log(assistant.reply("buenas noches"))