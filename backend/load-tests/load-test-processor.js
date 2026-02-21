/**
 * Artillery processor for load tests
 * Provides custom functions for generating test data
 */

const crypto = require('crypto');

module.exports = {
  // Generate random string for names and emails
  randomString: function(context, events, done) {
    context.vars.randomString = crypto.randomBytes(8).toString('hex');
    return done();
  },
  
  // Generate random email
  randomEmail: function(context, events, done) {
    const randomStr = crypto.randomBytes(8).toString('hex');
    context.vars.randomEmail = `user_${randomStr}@loadtest.com`;
    return done();
  },
  
  // Generate random name
  randomName: function(context, events, done) {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    context.vars.randomName = `${firstName} ${lastName}`;
    return done();
  },
  
  // Log response time for monitoring
  logResponseTime: function(requestParams, response, context, ee, next) {
    if (response.timings) {
      const totalTime = response.timings.phases.total;
      if (totalTime > 500) {
        console.log(`Slow response detected: ${totalTime}ms for ${requestParams.url}`);
      }
    }
    return next();
  },
  
  // Check for errors
  checkErrors: function(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      console.error(`Error response: ${response.statusCode} for ${requestParams.url}`);
      console.error(`Body: ${JSON.stringify(response.body)}`);
    }
    return next();
  }
};
