---
layout: default
title: Testing Locally
nav_order: 3
---

# Testing Locally
*The following assumes you have git installed and it is your first time testing the project. App is launched on [http://localhost:3000/](http://localhost:3000/)*
```
git clone https://github.com/balwillSFDC/sfmc-my-custom-acitivty
npm install
npm start
```

When testing locally, you are not able to interact with journey builder as you would if the app was iframed into the platform. For example, when you run locally, you'll notice there's no "Save" or "Cancel" button like you would expect in the platform, this is because those buttons are part of Journey Builder's UI and not the custom activity's - the two interact with each other using postmonger (ex. if you press "cancel" a message is triggered from JB -> custom activity to close the acivity). 

In any case, a "mock" jb object ```jb``` is setup in the code so if you run locally, you can open the browser console and run ```jb.ready()```. This will instantiate the jb object. After doing so, if you populate the fields, you can run ```jb.save()``` and you'll see what the save payload looks like.

## Inspecting inArguments in the Logs

When Journey Builder invokes the **save** lifecycle the server now logs a preview of the inArguments that were received. Look for log lines similar to the following in your terminal output:

```
[2025-09-30T10:23:42.089Z] [INFO] Save lifecycle received inArguments. | meta={"correlationId":"<id>","inArgumentKeys":["message","mobilePhoneAttribute"]}
[2025-09-30T10:23:42.089Z] [INFO] Save lifecycle inArguments preview. | meta={"correlationId":"<id>","inArgumentsPreview":{"message":"Thanks for your purchase!","mobilePhoneAttribute":"***1234"}}
```

The preview masks sensitive values (such as phone numbers) but confirms that data from the Data Extension reached the custom activity. If you see a warning that no inArguments were received, double-check the activity configuration inside Journey Builder.
