import { MAX_HEAD_FAILS } from "./constants.js";

/**
 * A basic intent
 * @typedef {Object} Intent
 * @property {Array} keywords
 * @property {String} type
 * @property {String} handler
 * @property {string} id
 */

/**
 *
 * @param {String} input
 * @returns {Array<String>}
 */
const prepareInput = (input, options) => {
  const lowcaseInput = input.toString().toLowerCase();
  const accentReplacedInput = lowcaseInput
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const signReplacedInput = accentReplacedInput.replace(/(?![a-z ])./g, "");
  const cleanedUpInput = signReplacedInput.replace(/ +/g, " ");
  const finalInput = cleanedUpInput.split(" ");

  return finalInput;
};

/**
 * Rates a keyword based on an specified word
 * @param {string} word
 * @param {string} keyword
 */
const rateKeyword = (word, keyword) => {
  const MAX_HEAD_RETRIES = 2;

  if (word === keyword) return 1;

  let currentRetries = 0;
  let points = 0;

  for (let i = 0; i < word.length && currentRetries < MAX_HEAD_RETRIES; i++) {
    if (word[i] !== keyword[i + currentRetries]) {
      i--;
      currentRetries++;
    } else points++;
  }

  return points / word.length;
};

/**
 *
 * @param {Array<string>} preparedInput
 * @param {Array<Intent>} intents
 * @returns {Array}
 */
const guessIntent = (preparedInput, intents) => {
  let ratedIntents = [];

  intents.forEach(({ keywords: keywordsSets, id }) => {
    let ratedIntent = { rating: 0, id };

    keywordsSets.forEach((keywords) => {
      const rating =
        preparedInput.reduce((totalInputRating, word) => {
          return (
            totalInputRating +
            keywords.reduce((totalKeywordRating, keyword) => {
              return totalKeywordRating + rateKeyword(word, keyword);
            }, 0)
          );
        }, 0) / preparedInput.length;

      if (ratedIntent.rating < rating) ratedIntent.rating = rating;
    });

    ratedIntents.push(ratedIntent);
  });

  return ratedIntents;
};

export default (intents, handlers) => {
  const mappedIntents = Object.entries(intents).map(([id, content]) => ({
    ...content,
    id,
  }));

  return {
    /**
     * Returns the most rated intent
     * @param {String} input A valid input
     * @returns {Object}
     */
    reply: (input) => {
      const formattedInput = prepareInput(input);
      const ratedIntents = guessIntent(formattedInput, mappedIntents);

      const mostRatedIntent = ratedIntents[0];

      console.log(ratedIntents)

      const generatedResponse = intents[mostRatedIntent.id]
        ? handlers[intents[mostRatedIntent.id].handler]()
        : intents[mostRatedIntent.id];

      return generatedResponse;
    },
  };
};
