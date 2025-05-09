export default {
  greetingHandler: (res) => {
    res.reply("Buenas noches");
  },
  howToCookHandler: (res, ctx) => {
    res.reply(ctx);
  }
};
