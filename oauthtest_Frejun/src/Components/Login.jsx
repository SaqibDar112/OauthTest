import { useState, useEffect } from 'react';
import { FrejunOAuth } from '@frejun/oauth';

const oauth = new FrejunOAuth({
  clientId: "####",
  clientSecret: "**********",
});

const Login = () => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh_token") || "");
  const [status, setStatus] = useState("");
  const [authCode, setAuthCode] = useState("");

  const isLoggedIn = !!accessToken;

  useEffect(() => {
    oauth.on('tokens', (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setStatus("Logged in successfully!");
    });

    oauth.on('authCode', (data) => {
      setAuthCode(data.code);
      setStatus("authCode event fired — code: " + data.code.slice(0, 15) + "...");
      console.log("Full auth code:", data.code);
      console.log("Email:", data.email);
    });

    
    oauth.on('tokensRefreshed', (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setStatus("Tokens refreshed!");
    });
    
    oauth.on('error', (err) => {
      console.error(err);
      setStatus("Error: " + err.message);
    });
  }, []);
  
  const handleCreateTokens = async () => {
    if (!authCode) {
      setStatus("No auth code yet — click 'No tokens popup' first");
      return;
    }
    try {
      setStatus("createTokens() called — exchanging code...");
      await oauth.createTokens(authCode); // fires 'tokens' event on success
      setAuthCode(""); // clear after use
    } catch (err) {
      setStatus("createTokens() error: " + err.message);
    }
  };
  const handleLogin = () => {
    setStatus("Opening popup...");
    oauth.openAuthPopup();
  };

  const handleVerify = async () => {
    try {
      setStatus("Verifying token...");
      const result = await oauth.verifyToken(accessToken);
      setStatus(result.is_valid ? "Token verified" : "Invalid Token");
    } catch (error) {
      setStatus("Verify error: " + error.message);
    }
  };

  const getAuthUrl = async () => {
    const res = oauth.getAuthorizationUrl()
    console.log(res)
  };

  const noTokensPopup = () => {
    oauth.openAuthPopup({
      generateTokens: false
    })
  }


  const handleRefresh = async () => {
    try {
      setStatus("Refreshing token...");
      await oauth.refreshTokens(refreshToken);
    } catch (err) {
      setStatus("Refresh error: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      setStatus("Logging out...");
      await oauth.disconnect(refreshToken);
      localStorage.clear();
      setAccessToken("");
      setRefreshToken("");
      setStatus("Logged out.");
    } catch (err) {
      setStatus("Logout error: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>FreJun OAuth</h2>

      <div style={{ marginBottom: "16px" }}>
        <strong>Status:</strong> {status || "Idle"}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <strong>Logged in:</strong> {isLoggedIn ? "Yes" : "No"}
      </div>

      {accessToken && (
        <div style={{ marginBottom: "16px", wordBreak: "break-all", maxWidth: "600px" }}>
          <strong>Access Token:</strong>
          <div style={{ fontSize: "12px", color: "#555" }}>{accessToken.slice(0, 40)}...</div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {!isLoggedIn && (
          <button onClick={handleLogin}>Login with FreJun</button>
        )}

        {authCode && (
          <button onClick={handleCreateTokens}>createTokens() — Exchange Code</button>
        )}

        {isLoggedIn && (
          <>
            <button onClick={handleVerify}>Verify Token</button>
            <button onClick={handleRefresh}>Refresh Token</button>
            <button onClick={handleLogout}>Logout</button>
            <button onClick={getAuthUrl}> Get Auth URL</button>
            <button onClick={noTokensPopup}>No tokens popup</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;