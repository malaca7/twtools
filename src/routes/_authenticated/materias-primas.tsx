import { createFileRoute } from "@tanstack/react-router";
import { MateriasPrimasPage } from "./producoes.materias-primas";

export const Route = createFileRoute("/_authenticated/materias-primas")({
  component: MateriasPrimasPage,
});
