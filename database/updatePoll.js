const updatePoll = (db, args) => {
  const p = new Promise((resolve, reject) => {
    const newPoll = { $set: args };
    const query = { id: id };

    db.collection(process.env.COL_POLL).updateOne(
      query,
      newPoll,
      (error, results) => {
        if (error) {
          reject({ origin: "updatePoll", error });
          return;
        }

        resolve(true);
      }
    );
  });

  p.catch(error => console.log("Error in updatePoll:", error));
  return p;
};

export default updatePoll;
