app = (app => {
    app.log("Yay, the app was loaded!");

    // Handle the somewhat unlikely case that the default branch is updated
    app.on("repository.edited", async context => {
        app.log("Received Repo Edited Event");
        if ("default_branch" in context.payload.changes) {
            let {user: user, repo: repo, owner: owner, defaultBranch: defaultBranch} = getInfoFromContext(context);
            let branch = getChangedBranch(context);

            app.log("Default_branch change, updating branch protections");
            await updateDefaultBranchProtection(context, owner, repo, defaultBranch);

            app.log(`Removing branch protection for ${branch}`);
            await removeBranchProtection(context, owner, repo, branch);

            app.log(`Creating an issue to notify ${user}`);
            await notifyOwner(context, owner, repo, user, defaultBranch);
        } else {
            app.log("Not a defaultBranch change, ignoring");
        }
    });

    // Handle the branch created event
    app.on("create", async context => {
        app.log("Received Branch Created Event");
        let {user: user, repo: repo, owner: owner, defaultBranch: defaultBranch, branch: branch} = getInfoFromContext(context);
        var branches = await listBranches(context, owner, repo);

        // Only update the branch protections when the default branch is created
        if (defaultBranchExists(branches, defaultBranch) && branch === defaultBranch) {
            app.log(`Adding ${defaultBranch} protections`);
            await updateDefaultBranchProtection(context, owner, repo, defaultBranch);
            app.log(`Creating an issue to notify ${user}`);
            await notifyOwner(context, owner, repo, user, defaultBranch);
        } else {
            app.log("Default_branch does not exist or this is not the defaultBranch, ignoring");
        }
    });
});

var listBranches = async (context, owner, repo) => {
    var res = await context.github.repos.listBranches({
        owner: owner,
        repo: repo
    });
    return res.data;
};

var notifyOwner = async (context, owner, repo, user, defaultBranch) => {
    var issue = {
        owner: owner,
        repo: repo,
        title: buildIssueTitle(user),
        body: buildIssuePayload(defaultBranch)
    }
    await context.github.issues.create(issue)
};

var removeBranchProtection = async (context, owner, repo, branch) => {
    var protection = {
        owner: owner,
        repo: repo,
        branch: branch
    };
    await context.github.repos.removeBranchProtection(protection);
};

var updateDefaultBranchProtection = async (context, owner, repo, defaultBranch) => {
    var defaultBranchProtection = {
        owner: owner,
        repo: repo,
        branch: defaultBranch,
        enforce_admins: true,
        restrictions: {
            users: [],
            teams: []
        },
        required_pull_request_reviews: {
            dismiss_stale_review: true,
            require_code_owner_review: true
        },
        required_status_checks: null
    };
    await context.github.repos.updateBranchProtection(defaultBranchProtection);
};

var defaultBranchExists = (branches, defaultBranch = "master") => {
    return branches.filter(b => b.name === defaultBranch).length === 1;
};

var getInfoFromContext = context => {
    const user = context.payload.sender.login;
    const repo = context.payload.repository.name;
    const owner = context.payload.repository.owner.login;
    const defaultBranch = context.payload.repository.default_branch;
    const branch = context.payload.ref;
    return {
        user: user,
        repo: repo,
        owner: owner,
        defaultBranch: defaultBranch,
        branch: branch
    };
};

var getChangedBranch = context => {
    return context.payload.changes.default_branch.from;
};

var buildIssueTitle = user => {
    return `Thank you @${user}, for creating a repository!`;
};

var buildIssuePayload = defaultBranch => {
    return `The ${defaultBranch} branch has been protected so it cannot be directly committed to.  \n  Please take a look at [the git flow documentation](https://guides.github.com/introduction/flow/) for an example of a good way to get your code into master.  \n  Welcome to GitHub!\n\n  Protections that have been added:  \n  * All commits require a reviewed pull request\n  * Administrators are subject to protection enforcement\n  * No users currently are bypassed`;
};


// This isn't strictly neccesary for the app but it does allow us to test them easier
// In the future we should probably refactor these into another class
app.listBranches = listBranches;

app.notifyOwner = notifyOwner;

app.removeBranchProtection = removeBranchProtection;

app.updateDefaultBranchProtection = updateDefaultBranchProtection;

app.defaultBranchExists = defaultBranchExists;

app.getInfoFromContext = getInfoFromContext;

app.getChangedBranch = getChangedBranch;

app.buildIssueTitle = buildIssueTitle;

app.buildIssuePayload = buildIssuePayload;

module.exports = app;
