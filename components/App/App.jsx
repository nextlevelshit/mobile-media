import React, { useEffect, useRef, useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { PageLayout, Title, Message, Footer } from "./App.styles";
import { v4 as uuid } from "uuid";
import * as UAParser from "ua-parser-js"

export const GET_DATA_POINTS = gql`
  query DataPoints {
    dataPoints {
      id
      ua
      value
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
    createDataPoint(id: $id, value: $value, timestamp: $timestamp, ua: $ua) {
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

  const [getDataPoints, { called, loading, error, data }] = useLazyQuery(
    GET_DATA_POINTS
  );
  const [getPolls, { data: polls }] = useLazyQuery(
    GET_POLLS
  );
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

  const [ua, setUa] = useState(null)
  const time = new Date().toLocaleString();
  const [pointValue, setPointValue] = useState(null);
  const oldValue = useRef(pointValue);
  const [id, setId] = useState(uuid());

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

  const updateItem = (value) => {
    updateDataPoint({
      variables: {
        id,
        timestamp: new Date().toLocaleString(),
        value
      }
    }).then(console.log).catch(console.warn);
  }

  useEffect(() => {
    getDataPoints();
    getPolls();
  }, []);

  useEffect(() => {
    if (!data) return

    if (data?.dataPoints.length === 0 || data?.dataPoints.findIndex(({id: dataId}) => id === dataId) === -1) {
      const ua = new UAParser().getUA();

      createDataPoint({
        variables: { id, ua, value: "-1", timestamp: new Date().toLocaleString() },
      }).then(console.log);
    }
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
      <input type={"text"} ref={oldValue} onChange={(e) => updateItem(e.target.value)}/>
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
