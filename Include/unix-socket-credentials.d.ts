/*Nice Lib!.. TS created by edge team - so check carefully before adaptation */

declare module "unix-socket-credentials"
{
    export function getCredentials(client_socket, callback: (err: Error, res: { uid; pid; gid; }) => any);
    export function getCredentialsSync(client_socket): { uid; pid; gid; };
}