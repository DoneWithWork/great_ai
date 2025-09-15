import Image from "next/image";

export default function Home() {
  return <div>{process.env["DATABASE_URL"]}</div>;
}
