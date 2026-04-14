import { useState, useEffect } from 'react';
import { FrejunOAuth } from '@frejun/oauth';

const oauth = new FrejunOAuth({
  clientId: "******",
  clientSecret: "*****",
});

const BACKEND = "http://localhost:8000";

const Login = () => {
  const [accessToken, setAccessToken]   = useState(localStorage.getItem("access_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh_token") || "");
  const [authCode, setAuthCode]         = useState("");
  const [status, setStatus]             = useState("");

  const isLoggedIn = !!accessToken;

  useEffect(() => {
    // only used to capture the code from popup
    oauth.on('authCode', (data) => {
      setAuthCode(data.code);
      setStatus("authCode received — click 'Create Tokens' to exchange via backend");
    });

    oauth.on('error', (err) => {
      setStatus("Error: " + err.message);
    });

    return () => oauth.destroy();
  }, []);

  // opens popup, gets code only — no token generation on frontend
  const handleOpenPopup = () => {
    setStatus("Opening popup...");
    oauth.openAuthPopup({ generateTokens: false });
  };

  // sends code to backend → backend calls oauth.createTokens(code)
  const handleCreateTokens = async () => {
    try {
      setStatus("Exchanging code via backend...");
      const res = await fetch(`${BACKEND}/auth/create-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode })
      });
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setAuthCode("");
      setStatus("Logged in! org: " + data.org_identifier);
    } catch (err) {
      setStatus("create-tokens error: " + err.message);
    }
  };

  const handleVerify = async () => {
    try {
      setStatus("Verifying via backend...");
      const res = await fetch(`${BACKEND}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken })
      });
      const data = await res.json();
      setStatus(data.is_valid ? "Token Verified" : "Not valid");
    } catch (err) {
      setStatus("verify error: " + err.message);
    }
  };

  const handleRefresh = async () => {
    try {
      setStatus("Refreshing via backend...");
      const res = await fetch(`${BACKEND}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setStatus("Tokens refreshed!");
    } catch (err) {
      setStatus("refresh error: " + err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      setStatus("Disconnecting via backend...");
      const res = await fetch(`${BACKEND}/auth/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const data = await res.json();
      localStorage.clear();
      setAccessToken("");
      setRefreshToken("");
      setStatus("Disconnected: " + data.message);
    } catch (err) {
      setStatus("disconnect error: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>FreJun OAuth</h2>

      <div style={{ marginBottom: "12px" }}>
        <strong>Status:</strong> {status || "Idle"}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Logged in:</strong> {isLoggedIn ? "Yes" : "No"}
      </div>

      {accessToken && (
        <div style={{ marginBottom: "12px", fontSize: "12px" }}>
          <strong>Access Token:</strong> {accessToken.slice(0, 40)}...
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {!isLoggedIn && !authCode && (
          <button onClick={handleOpenPopup}>Login with FreJun</button>
        )}

        {authCode && (
          <button onClick={handleCreateTokens}>Create Tokens (via backend)</button>
        )}

        {isLoggedIn && (
          <>
            <button onClick={handleVerify}>Verify Token</button>
            <button onClick={handleRefresh}>Refresh Token</button>
            <button onClick={handleDisconnect}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
