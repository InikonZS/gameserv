import { Db, MongoClient } from 'mongodb';

export class DatabaseService {
  public db: Db;

  constructor() {
    this.db = null;
  }

  start(url: string) {
    return new Promise((resolve, reject) => {
      let mongo = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        tlsAllowInvalidHostnames: true,
        tlsAllowInvalidCertificates: true,
      });

      mongo.connect().then(() => {
        this.db = mongo.db('chessmate');
        console.log('Connected to database.');
        resolve(true);
      });
    });
  }
}

export const databaseService = new DatabaseService();