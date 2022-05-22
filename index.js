/**
 *
 * @param {String} input
 * @returns {String}
 */
const prepareInput = (input) => {
  const lowcaseInput = input.toString().toLowerCase();
  const accentReplacedInput = lowcaseInput
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const signReplacedInput = accentReplacedInput.replace(/(?![a-z ])./g, "");
  const finalInput = signReplacedInput.replace(/ +/g, " ");

  return finalInput;
};

/**
 *
 * @param {String} input
 * @param {String} keyword
 */
const rateKeyword = (input, keyword) => {};

/**
 *
 * @param {String} preparedInput
 * @param {Array} intents
 * @returns {Array}
 */
const guessIntent = (preparedInput, intents) => {
  for (const [id, content] of Object.entries(intents)) {
  }

  return [1];
};

export default (intents, handlers) => ({
  /**
   * Returns the
   * @param {String} input A valid input
   * @returns {Object}
   */
  reply: (input) => {
    const formattedInput = prepareInput(input);
    const ratedIntents = guessIntent(formattedInput, intents);

    return ratedIntents[0];
  },
});
