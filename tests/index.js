import Palathea from "../index.js";
import intents from "./intents.js";

const assistant = Palathea(intents)

console.log(assistant.reply("Buenos días"))