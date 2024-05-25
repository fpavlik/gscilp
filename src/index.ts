import { IConfig } from "./interfaces/IConfig";
import * as fs from 'fs';
import * as path from 'path';
import { JWT } from 'google-auth-library';
import { IKeys } from "./interfaces/IKeys";
import { GoogleApis, google } from 'googleapis';
import { XMLParser } from 'fast-xml-parser'


export class GSCILP {
    googleKeyPath!: string;
    googleInstance!: GoogleApis;
    linksPerDayLimit!:number;
    linksToUpdate!: string[];
    delayPerRequest!: number;
    sitemapPath?: string;

    constructor(config: IConfig) {
        this.googleKeyPath = config.googleKeyPath;
        this.linksPerDayLimit = config.linksPerDayLimit || 200;
        this.delayPerRequest = config.delayPerRequest || 0;
        if (config.sitemapPath) {
            console.log('Sitemap was provided')
            this.parseSitemap(config.sitemapPath);
        } else {
            console.log('Links array was provided')
            this.linksToUpdate = config.linksToUpdate || [];
        }
    }

    parseSitemap(sitemapPath: string): void {
        console.log('Begin parsing sitemap');
        const parser = new XMLParser();
        const xml = fs.readFileSync(path.join(__dirname, sitemapPath));
        this.linksToUpdate = parser.parse(xml).urlset.url.map((url: any) => url.loc);
    }

    initGoogle(): void {
        try {
            console.log('Initializing Google instance');

            const keys: IKeys = JSON.parse(fs.readFileSync(path.join(__dirname, this.googleKeyPath)).toString());
    
            const client = new JWT({
                email: keys.client_email,
                key: keys.private_key,
                scopes: ['https://www.googleapis.com/auth/webmasters', 'https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/indexing'],
            });
    
            google.options({
                auth: client
            });
    
            this.googleInstance = google;

            console.log('Google was successfully initialized');
        } catch (error) {
            console.log("🚀 ~ GSCILP ~ initGoogle ~ error:", error);
        }
    }

    async checkWebsitesList(): Promise<void> {
        if (!this.googleInstance) {
            this.initGoogle();
        }

        try {
            const searchconsole = this.googleInstance.searchconsole('v1');
            const resSiteList = await searchconsole.sites.list({});
            console.log("Allowed resources: ", resSiteList.data);
        } catch (error) {
            console.log("🚀 ~ GSCILP ~ checkWebsitesList ~ error:", error);
        }
    }

    validateLinks(): void {
        const result = [];
        for (let i = 0; i < this.linksToUpdate.length; i++) {
            const link = this.linksToUpdate[i];
            try {
                new URL(link);
                result.push(link);
            } catch (error) {
                console.log('Invalid link:', link);
                continue;
            }
        }
        this.linksToUpdate = result;
    }

    cutExtraLinks(): void {
        // we have to limit amount of links because of Google API quota (default 200)
        // linksPerDayLimit will help you
        // https://developers.google.com/webmaster-tools/limits
        this.linksToUpdate = this.linksToUpdate.slice(0, this.linksPerDayLimit)
    }

    async delay(ms: number): Promise<any> {
        // if you have increased daily quota you still have to pay attention to RPM quota (default 600)
        // delayPerRequest will help you
        // https://developers.google.com/webmaster-tools/limits
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async sendLinks() {
        if (!this.googleInstance) {
            this.initGoogle()
        }

        this.cutExtraLinks();

        this.validateLinks();

        console.log('Begin sending links')

        const indexing = this.googleInstance.indexing('v3');

        let counter = 0;

        for await (const link of this.linksToUpdate) {
            try {
                const res = await indexing.urlNotifications.publish({
                    requestBody: {
                        url: link,
                        type: 'URL_UPDATED'
                    }
                })
                if (res.status !== 200) {
                    console.log("Error while sending request to Google: ", res)
                } else {
                    console.log(`Link '${link}' was updated`);
                    counter++;
                }
            } catch (error) {
                console.log("🚀 ~ GSCILP ~ sendLinks ~ error:", error)
            }
            this.delayPerRequest || await this.delay(this.delayPerRequest);
        }

        console.log(`${counter}/${this.linksToUpdate.length} links was updated`);
    }
}

