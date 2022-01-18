import { ApolloServer, gql } from "apollo-server-micro";
import {
  createDbConnection,
  createRecord,
  deleteRecord,
  readAllRecords,
  updateRecord,
  createPoll,
  updatePoll,
  deletePoll
} from "../../database";

const typeDefs = gql`
  type DataPoint {
    id: ID
    value: String
    id: String
    browser: String
    os: String
    type: String
    model: String
    cpu: String
    gpu: String
    timestamp: String
  }
  
  type Poll {
    id: ID
    question: String
    answers: [Answer]
    count: String
  }
  
  type Answer {
    answer: String
    counts: Int
  }

  type Query {
    dataPoints: [DataPoint]
    polls: [Poll]
  }

  type Mutation {
    createDataPoint(id: ID!, timestamp: String!, value: String, type: String!, browser: String, os: String, model: String, cpu: String, gpu: String): DataPoint
    updateDataPoint(id: ID!, timestamp: String!, value: String, type: String, browser: String, os: String, model: String, cpu: String, gpu: String): DataPoint
    deleteDataPoint(id: ID!): DataPoints
    
    createPoll(id: ID!, question: String!, answers: [Answer]): Poll
    updatePoll(id: ID!, question: String!, answers: [Answer]): Poll
    deletePoll(id: ID!): Poll
  }
`;

const resolvers = {
  Query: {
    dataPoints: async () => {
      const { client, db } = await createDbConnection();

      const allRecords = await readAllRecords(db);
      client.close();

      return allRecords;
    },
  },

  Mutation: {
    createDataPoint: async (parent, args) => {
      const { client, db } = await createDbConnection();

      await createRecord(db, args);
      client.close();

      return args;
    },

    updateDataPoint: async (parent, args) => {
      const { client, db } = await createDbConnection();

      const { id, value, timestamp } = args;

      await updateRecord(db, id, value, timestamp);
      client.close();

      return args;
    },

    deleteDataPoint: async (parent, args) => {
      const { client, db } = await createDbConnection();

      const { id } = args;

      await deleteRecord(db, id);
      client.close();

      return args;
    },

    createPoll: async (parent, args) => {
      const { client, db } = await createDbConnection();

      await createPoll(db, args);
      client.close();

      return args;
    },

    updatePoll: async (parent, args) => {
      const { client, db } = await createDbConnection();

      await updatePoll(db, args);
      client.close();

      return args;
    },

    deletePoll: async (parent, args) => {
      const { client, db } = await createDbConnection();

      await deletePoll(db, args);
      client.close();

      return args;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const handler = server.createHandler({ path: "/api/graphql-data" });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
