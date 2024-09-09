const { execSync } = require('child_process');

function cloneRepo(repoUrl, projectPath) {
    try {
        execSync(`git clone ${repoUrl} ${projectPath}`, { stdio: 'inherit' });
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
}

module.exports = {
    cloneRepo
};