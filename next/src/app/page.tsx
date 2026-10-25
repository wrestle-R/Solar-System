import Observatory from "@/components/observatory";
const initialTime = Date.now();
export default function Home() {
  return <Observatory initialTime={initialTime} />;
}
