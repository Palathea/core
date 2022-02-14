import Response from "./Response.js";
import { RATINGS } from "../utils/constants.js";

const assistant = (intents, handlers = null, dictionaries = null) => {
  const prepareInput = (input) => {
    const lowcase = input.toString().toLowerCase();
    const normalized = lowcase.normalize("NFD");
    const replacedAccents = normalized.replace(/[\u0300-\u036f]/g, "");
    const replacedSigns = replacedAccents.replace(/(?![a-z ])./g, "");
    const escapedSpaces = replacedSigns.replace(/ +/g, " ");
    const splitted = escapedSpaces.split(" ");

    return splitted;
  };

  const rateKeyword = (inputs, keyword) => {
    let bestRating = 0;
    for (const input of inputs) {
      // If input has less than three letters, avoid stops.
      // This is done to prevent simple words such as "to" or "get" to form part of a bigger word.
      // Improves the quality of the response
      const MAX_HEAD_STOPS = input.length > 3 ? 2 : 0;
      // The same goes on with its value.
      const LETTER_VALUE = input.length > 3 ? 1 : .25;

      let rating = 0;

      // Checks if the current keyword and the input word are equal
      // If it isn't, verify letter by letter how similar they are
      if (input !== keyword) {
        let stillChecking = true;
        let headCheckPos = 0;
        let currentCharRating = 0;

        if (input.length > keyword.length) {
          for (let i = 0; i < keyword.length && stillChecking; i++) {
            if (keyword[i - headCheckPos] === input[i]) {
              currentCharRating += LETTER_VALUE;
            } else {
              if (headCheckPos < MAX_HEAD_STOPS) {
                headCheckPos++;
              } else {
                stillChecking = false;
              }
            }
          }

          if (stillChecking) {
            rating = currentCharRating / input.length;
          }
        } else {
          for (let i = 0; i < input.length; i++) {
            if (input[i - headCheckPos] === keyword[i]) {
              currentCharRating += LETTER_VALUE;
            } else {
              if (headCheckPos < MAX_HEAD_STOPS) {
                headCheckPos++;
              } else {
                stillChecking = false;
              }
            }
          }

          if (stillChecking) {
            rating = currentCharRating / keyword.length;
          }
        }
      } else {
        rating = LETTER_VALUE;
      }

      if (rating > bestRating) {
        bestRating = rating;
      }
    }

    return bestRating;
  };

  const checkHandlerAndExec = async (intent) => {
    const responseObj = new Response();
    responseObj.setType(intent.type);

    if (intent.handler) {
      this.handlers[intent.handler].bind(responseObj);
      await this.handlers[intent.handler]({ res: responseObj });
    } else {
      responseObj.reply(intent.response);
    }

    if (responseObj.response === "") {
      responseObj.reply("Se ha producido un error");
    }

    responseObj.setIntentId(intent.id);

    return responseObj;
  };

  const mapAndRate = (intent, splittedInput) => {
    let bestRating = 0;
    for (const keywordSet of intent.keywords) {
      let newRating = keywordSet
        .map((keyword) => rateKeyword(splittedInput, keyword))
        .reduce((acc, rating) => acc + rating);

      if (bestRating < newRating) {
        bestRating = newRating;
      }
    }
    return { intent, rating: bestRating };
  };

  const filterByReference = (intent) => {
    let check = false;

    if (typeof intent.references === "number") {
      check = intent.references === latestQueryId;
    } else if (intent.references) {
      check = intent.references.indexOf(latestQueryId) !== -1;
    }

    return check;
  };

  const sortByRating = (a, b) => b.rating - a.rating;

  const nonReferencedEval = () => {
    const notRefIntents = intents.filter((intent) => !intent.references);

    const ratedIntents = notRefIntents.map((intent) =>
      mapAndRate(intent, preparedInput)
    );
    const mostRatedIntent = ratedIntents.sort(sortByRating)[0];

    return {
      ratedIntents,
      mostRatedIntent,
    };
  };

  const reply = (input, options = {}) => {
    const latestQueryId = parseInt(options.latestQuery);
    const preparedInput = prepareInput(input);

    let ratedIntents = null;
    let mostRatedIntent = null;

    const filteredIntentByRef = intents.filter(filterByReference);

    if (latestQueryId && filteredIntentByRef.length) {
      const filteredInput = preparedInput.filter((val) => val.length > 1);

      const filteredIntentsByReply = intents.filter(filterByReference);
      const ratedRefIntents = filteredIntentsByReply.map((intent) =>
        mapAndRate(intent, filteredInput)
      );
      const mostRatedRefIntent = ratedRefIntents.sort(sortByRating)[0];

      if (mostRatedRefIntent.rating < RATINGS.REFERENCED_INTENT) {
      } else {
        mostRatedIntent = mostRatedRefIntent;
      }
    } else {
    }

    if (mostRatedIntent.rating < RATINGS.BASIC_INTENT) {
      mostRatedIntent.intent = {
        id: 0,
        keywords: [],
        response:
          "Lo siento, no he logrado entenderte. ¿Podrías repetirlo de nuevo?",
        type: "Error",
      };
      mostRatedIntent.rating = 1;
    }
  };
};

export default assistant;
