module.exports = app => {
  app.log('Yay, the app was loaded!')

  app.on('repository.created', async context => {
    app.log('Received Repo Created Event')
      // get branches, if master doesnt exist, create it
      
//      app.log('Getting master SHA')
//      res = await context.github.gitdata.getRef({
//        owner: context.payload.repository.owner.login,
//        repo: context.payload.repository.name,
//        ref: `heads/${context.payload.repository.default_branch}`
//      })

//      debugger
//      sha = res.data.object.sha

//      app.log('Creating default branch')
//      res = await context.github.gitdata.createRef({
//        owner: context.payload.repository.owner.login,
//        repo: context.payload.repository.name,
//        ref: `heads/{context.payload.repository.default_branch}`,
//        sha: sha
//      })
    let {user,repo,owner,default_branch} = getInfoFromContext(context)

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

    res = await context.github.repos.updateBranchProtection(defaultBranchProtection)
    app.log(JSON.stringify(res))

    var issue = { 
      owner: owner,
      repo: repo,
      title: buildIssueTitle(user), 
      body: buildIssuePayload()
    }
    app.log(`Creating an issue to notify ${user}`)
    var res = await context.github.issues.create(issue)
    return
  })
}

var getInfoFromContext = (context) => {
  const user = context.payload.sender.login
  const repo = context.payload.repository.name 
  const owner = context.payload.repository.owner.login 
  const default_branch = context.payload.repository.default_branch
  return { user, repo, owner, default_branch} 
}

var buildIssueTitle = (user) => {
  return `Thank you @${user}, for creating a repository!`
}

var buildIssuePayload = () => {
  return `The master branch has been protected so it cannot be directly committed to.  
  Please take a look at [the git flow documentation](https://guides.github.com/introduction/flow/) for an example of a good way to get your code into master.  
  Welcome to GitHub!` 
}
