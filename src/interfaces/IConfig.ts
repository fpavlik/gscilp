export interface IConfig {
    googleKeyPath: string;
    sitemapPath?: string;
    linksToUpdate?: string[];
    linksPerDayLimit?: number;
    delayPerRequest?: number;
}