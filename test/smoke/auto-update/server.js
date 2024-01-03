const express = require('express');
const { join } = require('path');

const app = express();
const port = 9000;

app.use('/release', express.static(join(__dirname, '../../../dist')));

// Parse JSON requests
app.use(express.json());

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
