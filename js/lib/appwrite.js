import { Client, Account, Databases, Storage, Query, ID } from 'https://cdn.jsdelivr.net/npm/appwrite@latest/+esm';

const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("68fe2fae00030619f0a5");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage, Query, ID };

