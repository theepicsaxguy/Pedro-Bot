// utils/errorHandler.js
module.exports = (error, context = 'Unknown') => {
    console.error(`[❌] [${context}] ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  };
  