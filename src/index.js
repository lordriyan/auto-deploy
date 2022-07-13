const { Octokit } = require("@octokit/core");
const child_process = require('child_process');
const fs = require('fs');

const repo = require("../config/repositories.json");

var ps;

async function main() {
    
    // Check if folder temp exist
    if (!fs.existsSync('temp')) fs.mkdirSync('temp');

    // Check update for each repo
    console.log('Checking update for ' + repo.repo);
    const octokit = new Octokit({ auth: repo.token })
    let new_sha = await octokit.request(`GET /repos/${repo.username}/${repo.repo}/branches/main`)
    new_sha = new_sha.data.commit.sha;

    let temp_path = `temp/${repo.username}.${repo.repo}`;
    let repo_path = `temp/repos/${repo.username}/${repo.repo}`;

    // Check if temp file exists, create if not exists
    if (!fs.existsSync(temp_path)) fs.writeFileSync(temp_path, '');

    // Read temp file
    let temp_sha = fs.readFileSync(temp_path, 'utf8');

    if (temp_sha != new_sha) { // New commit detected
        console.log('New commit detected for ' + repo.repo);

        // Kill process if exists
        if (ps) {
            console.log('Killing process for ' + repo.repo);
            ps.kill();
        }

        // Check if repo folder exists
        try {
            
            if (!fs.existsSync(repo_path))
                child_process.execSync(`git clone https://${repo.username}:${repo.token}@github.com/${repo.username}/${repo.repo}.git ${repo_path}`);
            else
                child_process.execSync(`cd ${repo_path} && git pull origin main --rebase`);

        } catch (error) {

            console.log(error);

        }


        // Run build script
        // ps = child_process.spawn(`cd ${repo_path} && yarn install && yarn start`);
        ps = child_process.spawn('cmd.exe', ['start', 'cmd.exe', `/K cd ${repo_path} && yarn install && yarn start`]);

        ps.stdout.on('data', (data) => {
            console.log(`${data}`);
        });

        ps.stderr.on('data', (data) => {
            console.error(`${data}`);
        });

        ps.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        // Update temp file
        fs.writeFileSync(temp_path, new_sha);

    } else
        console.log('No new update detected for ' + repo.repo);


    setTimeout(() => main(), 5000);

}

console.clear(); main();
