export type ServerData = {
  address: string;
  port: string;
  id: string;
  alterId: string;
  level: string;
  clientSecurity: string;
  //stream settings
  network: string;
  host: string;
  path: string;
  serverSecurity: string;
  tlsServerName: string;
};
// types.ts
export const TAGS = {
  Android: 'Android',
  MacOS: 'MacOS',
  Windows: 'Windows',
};
export type TagsEnum = keyof typeof TAGS;

export type InstallData = {
  /**
   * Version of app
   */
  version: string;
  /**
   * Path to Blender on computer
   */
  path: string;
  /**
   * Is it Release, Beta, etc?
   */
  type: string;
  /**
   * Maybe not needed? Maybe if versions have modules others don't?
   */
  tags: TagsEnum[];
};
