// import { JSONSchemaType } from 'ajv';
// import Store from 'electron-store';
//
// export type ServerData = {
//   address: { type: 'string' };
//   port: { type: 'string' };
//   id: { type: 'string' };
//   alterId: { type: 'string' };
//   level: { type: 'string' };
//   clientSecurity: { type: 'string' };
//   //stream settings
//   network: { type: 'string' };
//   host: { type: 'string' };
//   path: { type: 'string' };
//   serverSecurity: { type: 'string' };
//   tlsServerName: { type: 'string' };
// };
//
// export type SchemaType = {
//   servers: ServerData[];
// };
//
// const schema: JSONSchemaType<SchemaType> = {
//   type: 'object',
//   properties: {
//     servers: {
//       type: 'array',
//       items: {
//         type: 'object',
//         properties: {
//           address: { type: 'string' },
//           port: { type: 'string' },
//           id: { type: 'string' },
//           alterId: { type: 'string' },
//           level: { type: 'string' },
//           clientSecurity: { type: 'string' },
//           //stream settings
//           network: { type: 'string' },
//           host: { type: 'string' },
//           path: { type: 'string' },
//           serverSecurity: { type: 'string' },
//           tlsServerName: { type: 'string' },
//         },
//       },
//     },
//   },
// };
// const store = new Store<SchemaType>({ schema });
//
// export default store;
