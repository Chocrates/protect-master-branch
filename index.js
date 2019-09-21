/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')

  app.on('repository.created', async context => {
    app.log('Received Repo Created Event')
      var issue = { 
        owner: context.payload.repository.owner.login, 
        repo: context.payload.repository.name, 
        title: `Thank you @${context.payload.sender.login}, for creating a repository!`, 
        body: `The master branch has been protected so it cannot be directly committed to.\nPlease take a look at [the git flow documentation](https://guides.github.com/introduction/flow/) for an example of a good way to get your code into master.\nWelcome to GitHub!` 
      }
      app.log(`Creating an issue ${JSON.stringify(issue)}`)
      //debugger;
      var res = await context.github.issues.create(issue)
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

    var defaultBranchProtection = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      branch: `${context.payload.repository.default_branch}`,
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
    return
  })
}
