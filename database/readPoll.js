const readPoll = db => {
  const p = new Promise((resolve, reject) => {
    db.collection(process.env.COL_POLL)
      .find({})
      .toArray((error, results) => {
        if (error) {
          reject({ origin: "readPoll", error });
          return;
        }

        resolve(results);
      });
  });

  p.catch(error => console.log("Error in readPoll:", error));
  return p;
};

export default readPoll;
