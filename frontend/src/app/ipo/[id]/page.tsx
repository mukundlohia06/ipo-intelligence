import { redirect } from "next/navigation";

export default function IpoForwardPage({ params }: { params: { id: string } }) {
  redirect(`/ipos/${params.id}`);
}
