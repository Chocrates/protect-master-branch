# protect-master-branch 
A GitHub App built with [Probot](https://github.com/probot/probot) that automatically protects the master branch upon the creation of new repositories

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

### Install the GitHub app with Probot
* Navigate to https://localhost:3000 and follow the instructions to install this app and get the authentication set up

### Install the GitHub app manually
* [Create a new GitHub app](https://github.com/settings/apps/new)
* Pick a name for the app
* Write a description of what your GitHub App is going to do
* Add a homepage URL  
  * Use your GitHub repository if applicable  
* Input a Webhook URL  
  * Navigate to [smee.io](https://smee.io) and get a webhook proxy url  
* Pick a webhook secret  
  * Pick a long alpha numeric password, optionally grab a random string from [GRC's Perfect Password Utility](https://www.grc.com/passwords.htm)
* Set the following permission from [app.yml]  
  * Administration : Read & Write  
  * Contents : Read-only  
  * Issues : Read & write  
  * Metadata : Read-only  

* Subscribe to the following events
  * Push
  * Repository
* Click Create Github App
* Generate a private key
  * On the new page, scroll to the bottom and click Generate a private key
* Create the .env file: 
```
WEBHOOK_PROXY_URL=<smee.io webhook from earlier>
APP_ID=<GitHub App ID from the current page>
PRIVATE_KEY=<Private Key you just generated, make sure to collapse it down to a single line insernting \\n characters for the newlines>
WEBHOOK_SECRET=<The secret you generated earlier>
```

## Getting Help
* Come chat with us in [Gitter](https://gitter.im/protect-master-branch/community) if you need help setting up your application
* Browse Issues to see if your problem has been addressed or is currently known
* Create a new issue so the community can help you through your issue and put a fix together

## Contributing

If you have suggestions for how my-second-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions. Please see [Contributing](CONTRIBUTING.md) for details on how to contribute to the project

## Maintainers
Chris McIntosh <j.chris.mcintosh@gmail.com> is the current maintainer.  


## License

[Public Domain](LICENSE.md) © 2019 Public 
