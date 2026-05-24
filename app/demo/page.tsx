import { DemoPage } from "@/components/demo/demo-page";
import { existsSync } from "fs";
import path from "path";

export default function Page() {
  const videoPath = path.join(process.cwd(), "public", "videos", "conceptkid-demo.mp4");
  const posterPath = path.join(process.cwd(), "public", "images", "conceptkid-demo-poster.png");

  return <DemoPage hasDemoVideo={existsSync(videoPath)} hasDemoPoster={existsSync(posterPath)} />;
}
