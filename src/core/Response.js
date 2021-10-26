export default class Response {
    response = "";
    type = "String";
    intentId = null;
    replyHandler = null;

    setReplyHandler(handlerFn) {
        if (handlerFn) {
            this.replyAfterResponse = {
                handles: !!handlerFn,
                handlerFn
            }
        }

        return this;
    }

    setType(type) {
        this.type = type;
    }

    reply(response) {
        this.response = response;
        return this;
    }

    setIntentId(intentId) {
        this.intentId = intentId;
    }
}