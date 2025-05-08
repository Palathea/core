import stringSimilarity from "string-similarity-js";
import {
  MAX_HEAD_RETRIES,
  FALLBACK_RESPONSE,
  MINIMUM_RATING,
} from "./utils/constants.js";

import handlerWrapper from "./wrappers/handlerWrapper.js";

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

  return cleanedUpInput;
};

/**
 *
 * @param {Array<string>} preparedInput
 * @param {Array<Intent>} intents
 * @returns {Array}
 */
const guessIntent = (preparedInput, intents) =>
  intents
    .map(({ keywords: keywordsSets, id }) => ({
      id,
      rating: keywordsSets.reduce((highestRating, keywords) => {
        const referenceString = typeof keywords === "string" ? keywords : keywords.join(" ")
        const parsedReferenceString = prepareInput(referenceString)
        const rating = stringSimilarity(preparedInput, parsedReferenceString)

        return highestRating < rating
          ? parseFloat(rating.toFixed(6))
          : highestRating;
      }, 0),
    }))
    .sort((a, b) => b.rating - a.rating);

/**
 *  Initializes Palathea
 *  @param {Object} intents
 *  @param {Object} handlers
 */
const initialize = (intents, handlers) => {
  let previousIntent = null;

  const mappedIntents = Object.entries(intents)
    .filter(([id]) => id !== "fallback")
    .map(([id, content]) => ({
      ...content,
      id,
    }));

  return {
    /**
     * Returns the most rated intent
     * @param {String} input A valid input
     * @returns {Object}
     */
    reply: async (input) => {
      const formattedInput = prepareInput(input);
      const ratedIntents = guessIntent(formattedInput, mappedIntents);

      const mostRatedIntent = ratedIntents.at(0);

      if (mostRatedIntent.rating < MINIMUM_RATING) {
        const fallbackResponse = intents.fallback ?? FALLBACK_RESPONSE;

        return {
          type: "error",
          content: fallbackResponse,
        };
      }

      previousIntent = mostRatedIntent.id;

      if (intents[mostRatedIntent.id].handler) {
        try {
          return await handlerWrapper(
            handlers[intents[mostRatedIntent.id].handler]
          );
        } catch (err) {
          console.log("An error has occured while trying to execute a handler");
        }
      }

      if (intents[mostRatedIntent.id].responses) {
        const selectedIntent = intents[mostRatedIntent.id];

        return {
          type: selectedIntent.type,
          content: selectedIntent.responses.at(Math.floor(Math.random() * selectedIntent.responses.length)),
        };
      }

      return {
        type: "error",
        content: intents.fallback
      }
    },
    getPreviousIntent: () => previousIntent,
  };
};

export default initialize;
