
import { Session, Series } from "./types";

export const createInitialSession = (): Session => ({
  id: `temp-session-${Date.now()}`,
  name: "Sesión 1",
  series: [createInitialSeries()]
});

export const createInitialSeries = (): Series => ({
  id: `temp-series-${Date.now()}`,
  name: "Serie 1",
  exercises: []
});
