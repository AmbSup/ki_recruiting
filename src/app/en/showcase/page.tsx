import { ShowcasePageInner } from "../../showcase/page";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function EnShowcasePage() {
  return <ShowcasePageInner lang="en" />;
}
