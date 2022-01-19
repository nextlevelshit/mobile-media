import React, { useEffect, useRef, useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import { gql } from "apollo-boost";

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

const CREATE_DATA_POINT = gql`
  mutation CreateDataPoint($id: ID!, $value: String!, $ua: String!, $timestamp: String!) {
    createDataPoint(id: $id, value: $value, timestamp: $timestamp) {
      id
      value
      ua
      timestamp
    }
  }
`;

const SET_DATA_POINT = gql`
  mutation UpdateDataPoint($id: ID!, $value: String!, $timestamp: String!) {
    updateDataPoint(id: $id, value: $value, timestamp: $timestamp) {
      id
      value
      timestamp
    }
  }
`;

const DELETE_DATA_POINT = gql`
  mutation DeleteDataPoint($id: ID!) {
    deleteDataPoint(id: $id) {
      id
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
  const [ua, setUa] = useState(null)
  const time = new Date().toLocaleString();
  const [pointValue, setPointValue] = useState(null);
  const oldValue = useRef(pointValue);

  const updateCacheCreate = (
    cache,
    {
      data: {
        createDataPoint: { id, timestamp, value, ua },
      },
    }
  ) => {
    const { dataPoints } = cache.readQuery({
      query: GET_DATA_POINTS,
    });

    const updatedData = [
      ...dataPoints,
      { id, timestamp, value, ua, __typename: "DataPoint" },
    ];

    cache.writeQuery({
      query: GET_DATA_POINTS,
      data: { dataPoints: updatedData },
    });
  };

  const updateCacheDelete = (
    cache,
    {
      data: {
        deleteDataPoint: { id },
      },
    }
  ) => {
    const { dataPoints } = cache.readQuery({
      query: GET_DATA_POINTS,
    });

    const updatedData = dataPoints.reduce((a, b) => {
      if (b.id === id) return a;

      const newItem = b;
      return [...a, newItem];
    }, []);

    cache.writeQuery({
      query: GET_DATA_POINTS,
      data: { dataPoints: updatedData },
    });
  };

  const [createDataPoint, { data: createData }] = useMutation(
    CREATE_DATA_POINT,
    {
      update: updateCacheCreate,
    }
  );

  const [updateDataPoint, { data: updateData }] = useMutation(SET_DATA_POINT);

  const [deleteDataPoint, { data: deleteData }] = useMutation(
    DELETE_DATA_POINT,
    { update: updateCacheDelete }
  );

  const saveChange = e => {
    if (oldValue.current === pointValue) return;
    if (pointValue === "") return;

    if (oldValue.current === "") {
      createDataPoint({
        variables: { id, value: pointValue, timestamp: timestamp.toString() },
      });
      return;
    }

    console.log(timestamp, typeof timestamp);

    updateDataPoint({
      variables: { id, value: pointValue, timestamp: timestamp.toString() },
    }).then(console.log);

    oldValue.current = pointValue;
  };

  const deleteItem = () => {
    if (pointValue === "") return;

    deleteDataPoint({ variables: { id } });
  };

  useEffect(() => {
    getDataPoints();
    getPolls();
  }, []);

  useEffect(() => {
    debugger
  }, [data])

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
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(polls, null, 2)}</pre>
      {/*<DataPointList data={data} />*/}
      <Footer>
        SS2022 - Mobile Media - Leibniz FH
      </Footer>
    </PageLayout>
  );
};

export default App;
