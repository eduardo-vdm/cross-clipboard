const express = require('express');
const app = express();

app.use(express.json()); // Needed to parse JSON body

const sessionRoutes = require('./routes/session');
app.use('/api', sessionRoutes);

// Start the server
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
