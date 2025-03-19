import React from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function GoogleSignInButton() {
  const handleSuccess = (credentialResponse) => {
    console.log("Google login success:", credentialResponse);
    // Send credentialResponse.credential to your backend for verification.
  };

  const handleError = () => {
    console.log("Google login failed");
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
