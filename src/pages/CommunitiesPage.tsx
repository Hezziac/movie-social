/** [CommunitiesPage.tsx]
 *
 * * A top-level page component that displays the 'Community Groups'.
 * * * * SOURCE ATTRIBUTION:
 * This component's layout and the integration of the 'CommunityList' were 
 * based on the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * * * * CUSTOMIZATION:
 * I customized the visual presentation, including the specific Tailwind CSS 
 * typography and the "Social.Cine" branding colors (purple-to-pink gradient) 
 * to align with my project's movie-centric theme.
 */

import { CommunityList } from "../components/CommunityList";

export const CommunitiesPage = () => {
  return (
    <div className="pt-20">
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent hyphens-auto">
        <span>Community</span>
        <span>.Groups</span>
      </h2>
      <CommunityList />
    </div>
  );
};