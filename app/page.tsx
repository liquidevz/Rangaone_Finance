import { HomeClient } from "@/components/home-client-wrapper"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "RangaOne Finance - Investment Advisory",
  description: "Grow Your Portfolio, Not your worries"
}

export default function Home() {
  return <HomeClient />
}