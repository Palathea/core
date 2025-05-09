import stringSimilarity from "string-similarity-js";
import {
  FALLBACK_RESPONSE,
  MAX_HEAD_RETRIES,
  MINIMUM_RATING,
} from "./utils/constants.js";

import handlerWrapper from "./wrappers/handlerWrapper.js";
import _ from "lodash";

/**
 * A basic intent
 * @typedef {Object} Intent
 * @property {Array} keywords
 * @property {String} type
 * @property {String} handler
 * @property {string} id
 */

/**
 * @param {String} input
 * @returns {Array<String>}
 */
const formatToStandard = (input) => {
  const lowcaseInput = input.toString().toLowerCase();
  const accentReplacedInput = lowcaseInput
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const signReplacedInput = accentReplacedInput.replace(/(?![a-z ])./g, "");
  const cleanedUpInput = signReplacedInput.replace(/ +/g, " ");

  return cleanedUpInput;
};

/**
 * @param {Array<string>} preparedInput
 * @param {Array<Intent>} intents
 * @returns {Array}
 */
const guessIntent = (preparedInput, intents, previousIntent, context) =>
  intents
    .map(({ keywords: keywordsSets, id, references, categories }) => ({
      id,
      rating: keywordsSets.reduce((highestRating, keywords) => {
        const categoriesRating = _.intersection(context.categories, categories).length * 0.02
        const referenceString = typeof keywords === "string"
          ? keywords
          : keywords.join(" ");
        const parsedReferenceString = formatToStandard(referenceString);

        let rating = stringSimilarity(preparedInput, parsedReferenceString) + categoriesRating;

        if (previousIntent && references?.includes(previousIntent)) {
          rating += .1;
        }

        return highestRating < rating
          ? parseFloat(rating.toFixed(6))
          : highestRating;
      }, 0),
    }))
    .sort((a, b) => b.rating - a.rating);

/**
 * @param {string} input
 * @param {object} dictionaries
 */
const getContext = (input, dictionaries) => {
  const splittedInput = input.split(" ");
  const context = {
    relatedCategories: [],
    tokens: {},
  };

  const entries = Object.entries(dictionaries).map(([entryName, tokens]) =>
    tokens.map((token) => ({ entryName, value: token }))
  ).flat();

  for (const { entryName, value } of entries) {
    for (const [index, inputToken] of splittedInput.entries()) {
      const valueLength = value.split(/ +/g).length;
      const fullToken = splittedInput.slice(index, valueLength+index).join(" ");
      
      if (stringSimilarity(fullToken, formatToStandard(value)) > 0.8) {
        context.tokens[entryName] = [...context.tokens[entryName] ? context.tokens[entryName] : [], value]
      }
    }
  }

  context.relatedCategories = Object.keys(context.tokens)

  return context;
};

/**
 *  Initializes Palathea
 *  @param {Object} intents
 *  @param {Object} handlers
 */
const initialize = (intents, handlers, dictionaries = {}) => {
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
      const formattedInput = formatToStandard(input);

      const context = getContext(formattedInput, dictionaries);

      const ratedIntents = guessIntent(
        formattedInput,
        mappedIntents,
        previousIntent,
        context
      );

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
            handlers[intents[mostRatedIntent.id].handler],
            context
          );
        } catch (err) {
          console.log("An error has occured while trying to execute a handler");
        }
      }

      if (intents[mostRatedIntent.id].responses) {
        const selectedIntent = intents[mostRatedIntent.id];

        return {
          type: selectedIntent.type,
          content: selectedIntent.responses.at(
            Math.floor(Math.random() * selectedIntent.responses.length),
          ),
        };
      }

      return {
        type: "error",
        content: intents.fallback,
      };
    },
    getPreviousIntent: () => previousIntent,
  };
};

export default initialize;
