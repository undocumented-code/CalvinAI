const repl = require('repl');
const calvin = require(".");

const x = repl.start('calvin> ')
x.context.speak = calvin.say;
x.context.go = calvin.processTranscription;
x.context.exit = () => {
    calvin.clean();
    process.exit(0);
}