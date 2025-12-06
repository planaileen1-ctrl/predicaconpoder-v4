"use client";

import { useParams } from "next/navigation";
import LecturaReader from "./reader";

export default function LecturaDetailPage() {
  // Tomamos el bookId desde la URL en el CLIENTE
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;

  // Si por alguna razón no hay id válido
  if (!bookId || Array.isArray(bookId)) {
    return <p className="text-white p-6">Libro no encontrado.</p>;
  }

  return <LecturaReader bookId={bookId} />;
}
