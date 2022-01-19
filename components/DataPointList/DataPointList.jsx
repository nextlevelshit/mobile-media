import { DataPoint } from "./components";
import { ListContainer } from "./DataPointList.styles";
import React from "react";

const DataPointList = ({ data }) => {
  if (!data) return null;

  const { dataPoints } = data;

  const dataNotEmpty = dataPoints.length !== 0;

  const lastId = dataNotEmpty
    ? parseInt(dataPoints[dataPoints.length - 1].id)
    : 0;

  return (
    <ListContainer>
      {dataNotEmpty && dataPoints.map(item => <DataPoint key={item.id} {...item} />)}
    </ListContainer>
  );
};

export default DataPointList;
