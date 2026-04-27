const axios = require('axios');
const db = require('../db');

exports.analyzeRepo = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send({ message: "URL is required" });

    try {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) return res.status(400).send({ message: "Invalid GitHub URL." });

        const owner = match[1];
        const repo = match[2].replace('.git', '');

        const branchesRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`);
        const branches = branchesRes.data;

        const branchData = await Promise.all(branches.map(async (branch) => {
            try {
                const commitsRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch.name}&per_page=15`);
                return {
                    name: branch.name,
                    commits: commitsRes.data.map(c => ({
                        sha: c.sha,
                        message: c.commit.message,
                        author: c.commit.author.name,
                        date: c.commit.author.date
                    }))
                };
            } catch (err) {
                return { name: branch.name, commits: [] };
            }
        }));

        res.status(200).send({ owner, repo, branches: branchData });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch GitHub data" });
    }
};

exports.syncRepo = async (req, res) => {
    const { url, projectId, userId } = req.body;
    if (!url || !projectId) return res.status(400).send({ message: "URL and Project ID required" });

    try {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) return res.status(400).send({ message: "Invalid GitHub URL." });

        const owner = match[1];
        const repo = match[2].replace('.git', '');

        // 1. Fetch data from GitHub
        const branchesRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`);
        const branches = branchesRes.data;

        for (const branch of branches) {
            // Check if branch exists locally for this project
            const [localBranch] = await new Promise((resolve) => {
                db.query("SELECT id FROM branches WHERE project_id = ? AND name = ?", [projectId, branch.name], (err, results) => {
                    resolve(results || []);
                });
            });

            let branchId;
            if (!localBranch) {
                const result = await new Promise((resolve) => {
                    db.query("INSERT INTO branches (project_id, name, user_id) VALUES (?, ?, ?)", [projectId, branch.name, userId], (err, res) => {
                        resolve(res);
                    });
                });
                branchId = result.insertId;
            } else {
                branchId = localBranch.id;
            }

            // 2. Fetch and Sync Commits
            const commitsRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch.name}&per_page=20`);
            const githubCommits = commitsRes.data;

            for (const c of githubCommits) {
                // Check if commit exists by SHA
                const [localCommit] = await new Promise((resolve) => {
                    db.query("SELECT id FROM commits WHERE branch_id = ? AND sha = ?", [branchId, c.sha], (err, results) => {
                        resolve(results || []);
                    });
                });

                if (!localCommit) {
                    db.query(
                        "INSERT INTO commits (branch_id, sha, message, author, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        [branchId, c.sha, c.commit.message, c.commit.author.name, userId, new Date(c.commit.author.date)]
                    );
                }
            }
        }

        res.status(200).send({ message: "GitHub Intel Synchronized successfully!" });
    } catch (error) {
        console.error('Sync Error:', error.message);
        res.status(500).send({ message: "Synchronization failed", error: error.message });
    }
};
