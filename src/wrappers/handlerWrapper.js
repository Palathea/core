import { FALLBACK_RESPONSE } from "../utils/constants.js";

const handlerWrapper = async (handler) => {
  let finalResponse = {};

  const res = {
    reply: (content = "", options) => {
      finalResponse = {
        ...FALLBACK_RESPONSE,
        content,
        ...options,
      };
    },
  };

  await handler(res);

  console.log(finalResponse);
  return finalResponse;
};

export default handlerWrapper;
