import { useEffect } from "react";
import { useLazyQuery } from "@apollo/react-hooks";
import { gql } from "apollo-boost";
import { DataPointList } from "../";

import { PageLayout, Title, Message, Footer } from "./App.styles";

export const GET_DATA_POINTS = gql`
  query DataPoints {
    dataPoints {
      id
      browser
      os
      type
      model
      cpu
      gpu
      timestamp
    }
  }
`;

export const GET_POLLS = gql`
  query Polls {
    polls {
      id
      timestamp
      question
      answers
    }
  }
`;

const App = () => {
  const [getDataPoints, { called, loading, error, data }] = useLazyQuery(
    GET_DATA_POINTS
  );
  const [getPolls, { data: polls }] = useLazyQuery(
    GET_POLLS
  );

  useEffect(() => {
    getDataPoints();
    getPolls();
  }, []);

  if ((called && loading) || !data) {
    return <PageLayout />;
  }

  if (error) {
    console.log(error);
    return (
      <PageLayout>
        <Message type="error">There was an error. Check the console.</Message>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <pre>{JSON.stringify(polls, null, 2)}</pre>
      <DataPointList data={data} />
      <Footer>
        SS2022 - Mobile Media - Leibniz FH
      </Footer>
    </PageLayout>
  );
};

export default App;
