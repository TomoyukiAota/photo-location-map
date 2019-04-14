const fs = require('fs');
const logger = require('./package-test-logger');

class PackageTestUtil {
  printItemsInDirectory(directory) {
    logger.info("-----------------------------------------------");
    logger.info(`Following items exist in "${directory}":`)
    fs.readdirSync(directory).forEach(file => {
      logger.info(`  ${file}`);
    })
    logger.info("-----------------------------------------------");
  }
}

module.exports = new PackageTestUtil();
