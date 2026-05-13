# FleetNexus Load Tests

Run these with the k6 binary against a seeded environment.

```bash
k6 run -e API_URL=http://localhost:4000/api tests/load/lead-submissions.k6.js
k6 run -e API_URL=http://localhost:4000/api tests/load/auth-bursts.k6.js
k6 run -e API_URL=http://localhost:4000/api -e SOCKET_URL='ws://localhost:4000/socket.io/?EIO=4&transport=websocket' tests/load/websocket-connections.k6.js
```

The lead submission test defaults to 100 concurrent VUs and verifies sanitized,
successful lead responses without lead loss. The websocket test opens concurrent
Socket.IO transport connections to exercise multi-instance Redis room fanout.
