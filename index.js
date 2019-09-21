module.exports = app => {
  app.log('Yay, the app was loaded!')
  app.on('repository.edited', async context => {
    app.log('Received Repo Edited Event')
    if('default_branch' in context.payload.changes){
      // branch is null here, not sure yet of a great way of handling this.  Need to do some thinking
      let {user,repo,owner,default_branch, _b} = getInfoFromContext(context)
      let branch = getChangedBranch(context)
      app.log('Default_branch change, updating branch protections')
      await updateDefaultBranchProtections(context,owner,repo,default_branch)
      app.log(`Removing branch protection for ${branch}`)
      await removeBranchProtection(context,owner,repo,branch)
      app.log(`Creating an issue to notify ${user}`)
      await notifyOwner(context,owner,repo,user,default_branch)
    } else {
      app.log('Not a default_branch change, ignoring')
    }
  })

  app.on('create', async context => {
    app.log('Received Branch Created Event')
    let {user,repo,owner,default_branch, branch} = getInfoFromContext(context)
  
    var branches = await listBranches(context,owner,repo)

    if(defaultBranchExists(branches,default_branch) && branch === default_branch) { 
      app.log(`Adding ${default_branch} protections`)
      await updateDefaultBranchProtections(context,owner,repo,default_branch)
      app.log(`Creating an issue to notify ${user}`)
      await notifyOwner(context,owner,repo,user,default_branch)
      return
    } else {
      app.log('Default_branch does not exist or this is not the default_branch, skipping')
    }
  })
}

var listBranches = async (context,owner,repo) => {
  var res = await context.github.repos.listBranches({
    owner: owner,
    repo: repo
  })
  return res.data
}

var notifyOwner = async (context,owner,repo,user, default_branch) => {
  var issue = { 
    owner: owner,
    repo: repo,
    title: buildIssueTitle(user), 
    body: buildIssuePayload(default_branch)
  }
  var res = await context.github.issues.create(issue)
}

var removeBranchProtection = async (context,owner,repo,branch) => {
    var protection = {
      owner: owner,
      repo: repo,
      branch: branch
    }

  var res = await context.github.repos.removeBranchProtection(protection)
}

var updateDefaultBranchProtections = async (context,owner,repo,default_branch) => {
  var defaultBranchProtection = {
    owner: owner,
    repo: repo,
    branch: default_branch,
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
  }

  var res = await context.github.repos.updateBranchProtection(defaultBranchProtection)
}

var defaultBranchExists = (branches, default_branch = 'master') => {
  return branches.filter(b => b.name === default_branch).length === 1
}

var getInfoFromContext = (context) => {
  const user = context.payload.sender.login
  const repo = context.payload.repository.name 
  const owner = context.payload.repository.owner.login 
  const default_branch = context.payload.repository.default_branch
  const branch = context.payload.ref
  return { user, repo, owner, default_branch, branch} 
}

var getChangedBranch = (context) => {
  return context.payload.changes.default_branch.from
}

var buildIssueTitle = (user) => {
  return `Thank you @${user}, for creating a repository!`
}

var buildIssuePayload = (default_branch) => {
  return `The ${default_branch} branch has been protected so it cannot be directly committed to.  
  Please take a look at [the git flow documentation](https://guides.github.com/introduction/flow/) for an example of a good way to get your code into master.  
  Welcome to GitHub!

  Protections that have been added:  
  * All commits require a reviewed pull request
  * Administrators are subject to protection enforcement
  * No users currently are bypassed` 
}
