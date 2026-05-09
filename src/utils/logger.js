const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, "smtp.log");

function write(level, args) {
    const message = args
        .map(a => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
        .join(" ");

    const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;

    fs.appendFile(logFile, line, () => {});
}

module.exports = {
    log: (...args) => {
        console.log(...args);
        write("INFO", args);
    },
    warn: (...args) => {
        console.warn(...args);
        write("WARN", args);
    },
    error: (...args) => {
        console.error(...args);
        write("ERROR", args);
    },
};