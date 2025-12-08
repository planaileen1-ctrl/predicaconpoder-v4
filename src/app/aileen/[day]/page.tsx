"use client";

import { use } from "react";
import AileenDiaPage from "./AileenDiaPage";

export default function Page({ params }: { params: Promise<{ day: string }> }) {
  const { day } = use(params);

  return (
    <AileenDiaPage params={{ day }} />
  );
}
