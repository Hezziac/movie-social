/** [CommunitiesPage.tsx]
 *
 * * A top-level page component that displays the 'Top Picks' communities.
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
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        <span>Top</span>
        <span>.Picks</span>
      </h2>
      <CommunityList />
    </div>
  );
};