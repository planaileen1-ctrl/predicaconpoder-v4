"use client";

import { use } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import ContenidoAdminDia from "../ContenidoAdminDia";

export default function Page({ params }: { params: Promise<{ day: string }> }) {
  const { day } = use(params); // << CORRECTO EN NEXT 15

  return (
    <AuthGuard>
      <ContenidoAdminDia day={day} />
    </AuthGuard>
  );
}
