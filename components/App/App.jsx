import React, { useEffect, useRef, useState } from "react";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { PageLayout, Title, Message, Footer } from "./App.styles";
import { v4 as uuid } from "uuid";
import * as UAParser from "ua-parser-js"
import useLocalStorage from "use-local-storage";
import useInterval from "../../util/useInterval";

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
  const [poll, setPoll] = useState({title: "Waiting is not a crime", answers: [[], []], timestamp: "..."});
  const [isAdmin] = useLocalStorage("admin", "");
  const [question, setQuestion] = useState("Title");
  const [answers, setAnswers] = useState(["", "", "", "", ""]);
  const [userId] = useLocalStorage("userId", uuid());
  const [points, setPoints] = useState([]);
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

    const updatedPolls = [
      ...polls,
      { id, question, answers, __typename: "Poll" },
    ];

    cache.writeQuery({
      query: GET_POLLS,
      data: { polls: updatedPolls },
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

  const [getDataPoints, { called, loading, error, data, refetch }] = useLazyQuery(
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

    return points?.filter(({ value }) => value === choice.toString())?.length || 0
  }

  const submitPoll = (event) => {
    event.preventDefault();

    const variables = {
      id: uuid(),
      question,
      answers: answers.toLocaleString(),
      timestamp: new Date().toLocaleString()
    };

    createPoll({
      variables
    }).then(console.log).catch(console.warn)
  }

  const updateAnswer = (key, value) => {
    const newAnswers = [...answers]
    newAnswers.splice(key, 1, value)
    setAnswers(newAnswers)
  }

  useEffect(() => {
    getDataPoints().then(console.log);
  }, []);

  useEffect(() => {
    if (data?.hasOwnProperty("dataPoints")) setPoints(data.dataPoints);
  }, [data]);

  useEffect(() => {
    if (points.length === 0 || points?.findIndex(({id: dataId}) => userId === dataId) === -1) {
      const ua = new UAParser().getUA();

      createDataPoint({
        variables: { id: userId, ua, value: "-1", timestamp: new Date().toLocaleString() },
      }).then(console.log);
    }
  }, [points]);

  useInterval(() => {
    if (error) return;

    refetch().then(console.warn);

    getPolls().then(({ data: { polls } }) => {
      const p = [...polls].sort((a, b) => {
        return Date.parse(b.timestamp) - Date.parse(a.timestamp)
      }).pop();

      const nextPoll = {
        title: p?.question,
        answers: p?.answers?.split(","),
        timestamp: p?.timestamp
      };

      if (nextPoll.timestamp === poll.timestamp) return

      console.log(">> new poll:", nextPoll, poll);
      setPoll(nextPoll);
    });
  }, 997);

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
      <article>
        <header>
          <Title>{poll?.title}</Title>
        </header>
        <section>
          {poll?.answers?.map((answer, index) => {
            const votes = count(index);
            return <div style={{display: "flex", marginBottom: "1rem", alignItems: "center"}}>
              <button style={{padding: "1rem 2rem", marginRight: "2rem", fontWeight: "bold", fontSize: "2rem"}} onClick={() => updateItem(index)}>{index}</button>
              <div style={{fontSize: "2rem", marginBottom: "1rem"}}>{answer} <span style={{display: "inline-flex", backgroundColor: "purple", width: votes * 12 + "rem", padding: "0.3rem 0", color: "purple"}}>{votes}</span></div>
            </div>;
          })}
        </section>
      </article>

      {isAdmin && <>
        <form style={{ display: "flex", flexFlow: "column" }} onSubmit={(event) => submitPoll(event)}>
          <input type={"text"} value={question} onChange={(event) => setQuestion(event.target.value)} disabled={!isAdmin} style={{marginBottom: "1rem"}}/>
          {answers.map((answer, index) => {
            return (
              <div style={{padding: "0.8rem 0"}} key={`answer_${index}`}>
                <input type={"text"} value={answers[index]} onChange={(event) => updateAnswer(index, event.target.value)} disabled={!isAdmin} style={{marginRight: "0.3rem"}}/>
              </div>
            )
          })}
          <input type={"submit"} value={"Submit"} style={{marginTop: "1rem"}} />
        </form>
        <ul>
          {points && points.map(({ id, ua, value}, index) => {
            return (
              <li key={`datapoint_${index}`}>
                <pre>{id}</pre>
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
      </>}
      <Footer>
        SS2022 - Mobile Media - Leibniz FH
      </Footer>
    </PageLayout>
  );
};

export default App;
