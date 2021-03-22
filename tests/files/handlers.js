module.exports = {
    basicHandler: currentResult => {
        return currentResult.response = "This is a handler test";
    }
}