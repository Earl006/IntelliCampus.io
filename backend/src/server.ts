import app from "./app";

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server time: ${new Date().toLocaleString('en-US', { timeZone: process.env.TZ })}`);

});