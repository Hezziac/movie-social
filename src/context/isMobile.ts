/* [isMobile.ts]
 * * Utility function to detect if the user is accessing the app via a mobile device.
 * * * Note on AI Usage: 
 * This implementation was suggested by GitHub Copilot to resolve conflicts between 
 * mouse-wheel scrolling and touch-gesture zooming. It allows the app to 
 * conditionally enable or disable heavy gesture listeners to improve performance 
 * on desktop and prevent bugs on mobile.
 */
export const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };