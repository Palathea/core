const StormDB = require("stormdb");

module.exports = class Session {
  constructor() {
    const engine = new StormDB.localFileEngine("../db/sessions.stormdb");
    const db = new StormDB(engine);

    db.default({sessions: []});
  }

  
};
