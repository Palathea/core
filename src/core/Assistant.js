import Response from "./Response.js";

/**
 * Basic Intent
 * @typedef {{
 *    id: Integer,
 *    keywords: Array,
 *    handler: String,
 *    type: String
 *  }} Intent
 */

export default class Assistant {
  constructor(intents, handlers = null, dictionaries = null) {
    this.intents = intents;
    this.dictionaries = dictionaries;
    this.handlers = handlers;
  }

  /**
   * Prepares queries to be processed and removes anything that doesn't equals to basic letters.
   * @param {String} input
   * @returns {String} finalInput
   */
  prepare(input) {
    const lowcaseInput = input.toString().toLowerCase();
    const accentReplacedInput = lowcaseInput
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const signReplacedInput = accentReplacedInput.replace(/(?![a-z ])./g, "");
    const finalInput = signReplacedInput.replace(/ +/g, " ");

    return finalInput;
  }

  /**
   * Selects the correct intent based on a selected input.
   * @param {String} input Processed input ready to be splitted
   * @returns {{
   *    type: String,
   *    response: String
   * }} Resultant intent
   */
  async reply(input, options = {}) {
    // Functions declaration

    /**
     * Rates an intent
     * @param {String} inputs
     * @param {Intent} keyword
     * @returns {Integer} intent rating
     */
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

    /**
     * Check if intent has handlers. In case it does have, executes them. If not, adds response directly from intent.
     * @param {Intent} intent
     * @returns {{
     *    type: String,
     *    response: String
     * }}
     */
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

    // Main method flow
    const latestQueryId = parseInt(options.latestQuery);

    const preparedInput = this.prepare(input);
    const splittedInput = preparedInput.split(" ");

    let ratedIntents = null;
    let mostRatedIntent = null;

    // Check if latest intent has any children that references to it.
    // In that case, children have priority over other intents.
    if (latestQueryId && this.intents.filter(filterByReference).length) {
      const filteredInputAfterSplit = splittedInput.filter((value) =>
        value.length > 1
      );

      const filteredIntentsByReply = this.intents.filter(filterByReference);
      const ratedReferencedIntents = filteredIntentsByReply.map((intent) =>
        mapAndRate(intent, filteredInputAfterSplit)
      );
      const mostRatedReferencedIntent = ratedReferencedIntents.sort((a, b) =>
        b.rating - a.rating
      )[0];

      if (mostRatedReferencedIntent.rating < .5) {
        ratedIntents = this.intents.filter((intent) => !intent.references).map((
          intent,
        ) => mapAndRate(intent, splittedInput));
        mostRatedIntent = ratedIntents.sort((a, b) => b.rating - a.rating)[0];
      } else {
        mostRatedIntent = mostRatedReferencedIntent;
      }
    } else {
      ratedIntents = this.intents.filter((intent) => !intent.references).map((
        intent,
      ) => mapAndRate(intent, splittedInput));
      mostRatedIntent = ratedIntents.sort((a, b) => b.rating - a.rating)[0];
    }

    if (mostRatedIntent.rating < 0.35) {
      mostRatedIntent.intent = {
        id: 0,
        keywords: [],
        response:
          "Lo siento, no he logrado entenderte. ¿Podrías repetirlo de nuevo?",
        type: "Error",
      };
      mostRatedIntent.rating = 1;
    }

    const finalResponse = await checkHandlerAndExec(mostRatedIntent.intent);

    return finalResponse;
  }
}
