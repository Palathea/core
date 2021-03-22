/**
 * Basic Intent
 * @typedef {{
 *    id: Integer,
 *    keywords: Array,
 *    handler: String,
 *    type: String
 *  }} Intent
 */

module.exports = class Assistant {
  constructor(intents, handlers = null, dictionaries = null) {
    this.intents = intents;
    this.dictionaries = dictionaries;
    this.handlers = handlers;

    this.middleware = [];
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
   * Adds a function between basic execution and request processing. This enables the user to use any functions they want to modify the request.
   * @param {Function} middleware Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Selects the correct intent based on a selected input.
   * @param {String} input Processed input ready to be splitted
   * @returns {{
   *    type: String,
   *    response: String
   * }} Resultant intent
   *
   */
  async reply(input) {
    // Functions declaration

    /**
     * Rates an intent
     * @param {String} input
     * @param {Intent} intent
     * @returns {Integer} intent rating
     */
    const rateKeyword = (inputs, option) => {
      const MAX_HEAD_STOPS = 2;
      let bestRating = 0;
      for (const input of inputs) {
        let rating = 0;

        if (input !== option) {
          let stillChecking = true;
          let headCheckPos = 0;
          let currentCharRating = 0;

          if (input.length > option.length) {
            for (let i = 0; i < option.length && stillChecking; i++) {
              if (option[i - headCheckPos] === input[i]) {
                currentCharRating++;
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
              if (input[i - headCheckPos] === option[i]) {
                currentCharRating++;
              } else {
                if (headCheckPos < MAX_HEAD_STOPS) {
                  headCheckPos++;
                } else {
                  stillChecking = false;
                }
              }
            }

            if (stillChecking) {
              rating = currentCharRating / option.length;
            }
          }
        } else {
          rating = 1;
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
      let result = {
        type: intent.type,
      };

      if (intent.handler) {
        result.response = await this.handlers[intent.handler](result);
      } else {
        result.response = intent.response;
      }

      return result;
    };

    // Main method flow
    const preparedInput = this.prepare(input);
    const splittedInput = preparedInput.split(" ");
    const ratedIntents = this.intents.map((intent) => {
      return { intent, rating: intent.keywords.map(keyword => rateKeyword(splittedInput, keyword)).reduce((acc, rating) => acc + rating) };
    });

    let mostRatedIntent = ratedIntents.sort((a, b) => b.rating - a.rating)[0];

    if (mostRatedIntent.rating < 0.4) {
      mostRatedIntent.intent = {
        id: 0,
        keywords: [],
        response: "Didn't get it, could you say it again, please?",
        type: "Error",
      };
      mostRatedIntent.rating = 1;
    }

    const finalResponse = await checkHandlerAndExec(mostRatedIntent.intent);

    return finalResponse;
  }
};
