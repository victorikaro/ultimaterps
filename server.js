const express = require('express');
const { ExpressPeerServer } = require('peer');

const app = express();

// The hosting provider (like Render) sets the PORT environment variable
const port = process.env.PORT || 9000;

app.get('/', (req, res) => {
  res.send('Signaling server for Ultimate RPS is live.');
});

// Create an HTTP server from the Express app
const server = app.listen(port, () => {
  console.log(`Listening for connections on port ${port}`);
});

// Create the PeerJS server, configuring the path
const peerServer = ExpressPeerServer(server, {
  path: '/myapp', // This path must match the client-side configuration
});

// Mount the PeerJS server on the /peerjs path
app.use('/peerjs', peerServer);
