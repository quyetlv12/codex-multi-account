const http = require("http");

// Synthetic contract from tool-mmo's entitlement parser and workspace identity tests.
http.createServer((req, res) => {
  if (req.method !== "GET" || req.url !== "/backend-api/accounts/check/v4-2023-04-27") {
    res.writeHead(501).end();
    return;
  }
  const fixture = req.headers["x-fixture-case"];
  if (fixture === "unavailable") {
    res.writeHead(503, { "Content-Type": "text/html" }).end("<html>unavailable</html>");
    return;
  }
  if (fixture === "redirect") {
    res.writeHead(302, { Location: "/must-not-follow" }).end();
    return;
  }
  const entitlement = {
    subscription_plan: "chatgptplusplan",
    has_active_subscription: true,
    payment_date: "2030-01-31",
  };
  if (fixture === "direct") entitlement.expires_at = "2030-02-28T00:00:00Z";
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ accounts: { default: {
    account: { account_id: "synthetic-account" }, entitlement,
  } } }));
}).listen(process.env.PORT);
