/** [CommunityPage.tsx]
 *
 * * A routing page component that captures the community ID from the URL 
 * and renders the corresponding CommunityDisplay.
 * * * * SOURCE ATTRIBUTION:
 * This component's structure and use of 'useParams' for dynamic routing 
 * were followed from:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 */

import { useParams } from "react-router";
import { CommunityDisplay } from "../components/CommunityDisplay";

export const CommunityPage = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="pt-20">
      <CommunityDisplay communityId={Number(id)} />
    </div>
  );
};