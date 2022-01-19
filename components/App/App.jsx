import React, { useEffect, useRef, useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { PageLayout, Title, Message, Footer } from "./App.styles";
import { v4 as uuid } from "uuid";
import * as UAParser from "ua-parser-js"
import useLocalStorage from "use-local-storage";

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

const CREATE_POLL = gql`
  mutation CreatePoll($id: ID!, $question: String!, $answers: String!, $timestamp: String!) {
    createPoll(id: $id, question: $question, answers: $answers, timestamp: $timestamp) {
      id
      question
      answers
      timestamp
    }
  }
`;

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
  const [isAdmin] = useLocalStorage("admin", "");
  const [question, setQuestion] = useState("Title");
  const [answers, setAnswers] = useState(["", "", "", "", ""]);
  const [userId] = useLocalStorage("userId", uuid());
  const updateCacheCreatePoll = (
    cache,
    {
      data: {
        createPoll: { id, question, answers },
      },
    }
  ) => {
    const { polls } = cache.readQuery({
      query: CREATE_POLL,
    });

    const updatedData = [
      ...polls,
      { id, question, answers, __typename: "Poll" },
    ];

    cache.writeQuery({
      query: GET_DATA_POINTS,
      data: { polls: updatedData },
    });
  };

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
  const [createPoll] = useMutation(
    CREATE_POLL,
    {
      update: updateCacheCreatePoll,
    }
  );
  const [createDataPoint, { data: createData }] = useMutation(
    CREATE_DATA_POINT,
    {
      update: updateCacheCreate,
    }
  );
  const [updateDataPoint] = useMutation(SET_DATA_POINT);
  const [deleteDataPoint] = useMutation(
    DELETE_DATA_POINT,
    { update: updateCacheDelete }
  );
  const [pointValue, setPointValue] = useState(null);
  const oldValue = useRef(pointValue);

  const deleteItem = (id) => {
    if (pointValue === "") return;

    deleteDataPoint({ variables: { id } }).then(console.log).catch(console.warn);
  };

  const updateItem = (value) => {
    updateDataPoint({
      variables: {
        id: userId,
        timestamp: new Date().toLocaleString(),
        value: value.toString()
      }
    }).then(console.log).catch(console.warn);
  }

  const count = (choice) => {
    if (!data) return

    return data?.dataPoints?.filter(({ value }) => value === choice)?.length || 0
  }

  const submitPoll = (event) => {
    event.preventDefault();

    createPoll({
      variables: {
        id: uuid(),
        question,
        answers: answers.toLocaleString(),
        timestamp: new Date().toLocaleString()
      }
    }).then(console.log).catch(console.warn)
  }

  const updateAnswer = (key, value) => {
    const newAnswers = [...answers]
    newAnswers.splice(key, 1, value)
    setAnswers(newAnswers)
  }

  useEffect(() => {
    getDataPoints().then(console.log);
    getPolls().then(console.log);
  }, []);

  useEffect(() => {
    if (!data) return

    if (data?.dataPoints.length === 0 || data?.dataPoints.findIndex(({id: dataId}) => userId === dataId) === -1) {
      const ua = new UAParser().getUA();

      createDataPoint({
        variables: { id: userId, ua, value: "-1", timestamp: new Date().toLocaleString() },
      }).then(console.log);
    }
  }, [data]);

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
      <form style={{ display: "flex", flexFlow: "column" }} onSubmit={(event) => submitPoll(event)}>
        <input type={"text"} value={question} onChange={(event) => setQuestion(event.target.value)} disabled={!isAdmin} style={{marginBottom: "1rem"}}/>
        {answers.map((answer, index) => {
          return (
            <div style={{padding: "0.8rem 0"}}>
              <input type={"text"} value={answers[index]} onChange={(event) => updateAnswer(index, event.target.value)} disabled={!isAdmin} style={{marginRight: "0.3rem"}}/>
              <button onClick={() => updateItem(index)}>{index}</button> [{count(index.toString())}]
            </div>
            )
        })}
        {isAdmin && <input type={"submit"} value={"Submit"} style={{marginTop: "1rem"}} />}
      </form>
      <ul>
        {data && data?.dataPoints.map(({ id, ua, value}, index) => {
          return (
            <li key={`datapoint_${index}`}>
              <pre>Browser: {JSON.stringify(new UAParser().getBrowser(ua))}</pre>
              <pre>OS: {JSON.stringify(new UAParser().getOS(ua))}</pre>
              <pre>Device: {JSON.stringify(new UAParser().getDevice(ua))}</pre>
              <pre>{value}</pre>
              {isAdmin && <button onClick={() => deleteItem(id)}>X</button>}
            </li>
          )
        })}
      </ul>
      <pre>{JSON.stringify(polls, null, 2)}</pre>
      <Footer>
        SS2022 - Mobile Media - Leibniz FH
      </Footer>
    </PageLayout>
  );
};

export default App;
