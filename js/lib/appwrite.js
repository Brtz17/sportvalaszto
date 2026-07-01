import { Client, Account, Databases, Storage, Query, ID, Functions } from 'https://cdn.jsdelivr.net/npm/appwrite@latest/+esm';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

export { client, account, databases, storage, functions, Query, ID };