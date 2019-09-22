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

