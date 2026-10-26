const http = require("http");

// Synthetic SSE envelopes matching the proxy's existing quota regression fixtures.
http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/codex/responses") {
    res.writeHead(501).end();
    return;
  }
  const account = req.headers["chatgpt-account-id"];
  req.resume();
  req.on("end", () => {
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    const failed = account === "acc_stream_replay_owner";
    if (!failed && account !== "acc_stream_replay_replacement") {
      res.end('data: {"type":"error","code":"unexpected_synthetic_account"}\n\n');
      return;
    }
    const response = failed
      ? { id: "resp_owner_quota", status: "failed", error: {
          code: "usage_limit_reached", message: "usage limit reached",
        }, usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } }
      : { id: "resp_replay_ok", status: "completed",
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } };
    res.end(`data: ${JSON.stringify({ type: failed ? "response.failed" : "response.completed", response })}\n\n`);
  });
}).listen(process.env.PORT);
