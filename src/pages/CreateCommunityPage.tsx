/** [CreateCommunityPage.tsx]
 * 
 * * A page-level wrapper component that provides the layout context for 
 * the 'CreateCommunity' form.
 * * * * SOURCE ATTRIBUTION:
 * This component's structure was implemented based on:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 */

import { CreateCommunity } from "../components/CreateCommunity";

export const CreateCommunityPage = () => {
  return (
    <div className="pt-20">
      <CreateCommunity />
    </div>
  );
};