// src/pages/EmergencyLogoutPage.tsx

import { supabase } from "../supabase-client";

export function EmergencyLogoutPage() {

  const handleLogout = async () => {
    try {
      console.log("Attempting to sign out...");
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error logging out:", error.message);
      } else {
        console.log("Sign out successful.");
      }

      // After a successful logout, use window.location.replace to
      // force a clean redirect to the home page, breaking the loop.
      window.location.replace("/");

    } catch (error) {
      console.error("An unexpected error occurred during logout:", error);
      // In case of an error, still try to replace the location to break the loop
      window.location.replace("/");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Stuck in a Loop?</h1>
      <p>Click the button below to force a logout and break the redirect.</p>
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: "red",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          marginTop: "1rem"
        }}
      >
        Force Logout
      </button>
    </div>
  );
}