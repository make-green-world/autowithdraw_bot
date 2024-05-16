const execSync = require('child_process').execSync;

function executeRebase() {
    execSync('yarn execute:execute:mainnet');
    console.log("Rebase executed");    
    setTimeout(executeRebase, 1000 * 60 * 10);
}

executeRebase();