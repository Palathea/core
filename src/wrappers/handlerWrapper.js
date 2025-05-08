import { FALLBACK_RESPONSE } from "../utils/constants.js";

const handlerWrapper = async (handler) => {
  let finalResponse = {};

  const res = {
    reply: (content = "", options = { type: "string" }) => {
      finalResponse = {
        ...FALLBACK_RESPONSE,
        content,
        ...options,
      };
    }
  };

  await handler(res);

  return finalResponse;
};

export default handlerWrapper;
