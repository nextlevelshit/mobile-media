import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider
} from "@apollo/client";
import { App } from "../components";
import React from "react";

const Home = ({ host, protocol }) => {
  const uri = `${protocol}://${host}/api/graphql-data`;

  const client = new ApolloClient({
    uri,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network"
      }
    }
  });

  debugger

  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
};

export const getServerSideProps = async ({ req, query }) => {
  const host = req?.headers?.host;

  // Use https if we're on prod
  const protocol = host === "localhost:3000" ? "http" : "https";

  return { props: { host, protocol } };
};

export default Home;
