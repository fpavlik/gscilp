# GSCILpP
GSCILpP - Google Search Console Indexing Link Publisher - is a tool to automatically or semi-automatically updating your URLs in search console using Google API. 

## !!! ATTENTION !!!
Before use make sure you understand how Google API quota works. You can find limits [here](https://developers.google.com/webmaster-tools/limits).
To apply for more quota go to Google Cloud Console > APIs & Services > Web Search Indexing API >  Quotas & System Limits choose needed quota nad click "EDIT QUOTAS"

Note: this package need access to scopes: 
```
'https://www.googleapis.com/auth/webmasters'
'https://www.googleapis.com/auth/webmasters.readonly'
'https://www.googleapis.com/auth/indexing'
```

##  Preparing
First of all you will need to create a Service Account Key:

1. Enable the API in the [Google Cloud Console](https://console.developers.google.com/apis/api/searchconsole.googleapis.com)
2. Create a Service Account in the [Google Developers Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
3. For this newly created Service Account, navigate to 'Keys', create a new key, and save the JSON file somewhere secure. Your Node.js application will use these credentials to access the API .
4. Add the email address of this newly created Service Account as an owner in the [Google Search Console](https://search.google.com/search-console/users)

Note: Only a **verified owner** of the property can perform this step.

thanks @fusebit for this instruction. Origin [repo](https://github.com/fusebit/google-searchconsole-nodejs)

## Basic usage

```ts
import { GSCILpP } from 'gscilpp';

const gscilppSitemap = new GSCILpP({
    googleKeyPath: '/path/to/key/file.json',
    sitemapPath: '../sitemap.xml'
});

// OR

const gscilppLinks = new GSCILpP({
    googleKeyPath: '/path/to/key/file.json',
    linksToUpdate: ['link1', 'link2', ..., 'link-n']
});

gscilppSitemap.sendLinks();
gscilppLinks.sendLinks();
```
This examples will update up to 200 links by default from sitemap (1 option) or from array of links (2 ooption).

Note: you can provide only one link source (sitemap or array), if provided both will used sitemap.

## Config
```ts
const config: IConfig = {
    googleKeyPath: '/path/to/key/file.json', // path to your key
    linksPerDayLimit: 200, //default 200 link per day - it's a default Google quota
    delayPerRequest: 0, //default 0 in ms - can be set to avoid 600 rpm Google quota
    sitemapPath: '/path/to/key/file.xml', // if provided will parse sitemap and convert it to links array
    // or
    linksToUpdate: ['link1', 'link2', ..., 'link-n'], //can provide regular array of links to update them
} 
```

## Methods
After initialization you will have access to this list of methods:

### parseSitemap
```ts
// will parse provided sitemap and save it in gscilp.linksToUpdate property. 
// No need to call - will be called in init
gscilp.parseSitemap() 
```

### initGoogle
```ts
// will init google instanse with provided key and save it in gscilp.googleInstance
// No need to call will be checked before sending
gscilp.initGoogle() 
```

### checkWebsitesList
```ts
// Optional method to ensure you have access to right account. 
// Will show in console for what resources this key have access
gscilp.checkWebsitesList() 
```

### validateLinks
```ts
// Method will call before sending links. 
// And will remove bad links from gscilp.linksToUpdate
gscilp.validateLinks() 
```

### cutExtraLinks
```ts
// If provided more than linksPerDayLimit (default 200) will cut all extra links 
// Called before sending links 
gscilp.cutExtraLinks() 
```

### delay
```ts
// Optional method. Needed to avoid reaching rpm quota. 
// if provided config.delayPerRequest !== 0 in ms 
// for each request will be delay 
gscilp.delay() 
```

### sendLinks
```ts
// Will send links to google api from gscilp.linksToUpdate
gscilp.sendLinks() 
```


## PS
Future plans to implement cron job for big sitemaps (more than 200 links) and local storage. So you can run it and it will update all links from sitemap in some amount of days
Feel fre to contribute and create issues.

If you want to help - it will be great to implement a good logger :)
