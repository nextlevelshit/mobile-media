const createPoll = (db, {...newPoll}) => {
  const p = new Promise((resolve, reject) => {

    console.log(newPoll);

    db.collection(process.env.COL_POLL).insertOne(
      newPoll,
      (error, results) => {
        if (error) {
          reject({ origin: "createPoll", error });
          return;
        }

        resolve(true);
      }
    );
  });

  p.catch(error => console.log("Error in createPoll:", error));
  return p;
};

export default createPoll;
