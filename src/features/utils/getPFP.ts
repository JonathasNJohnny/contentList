import { useAuth } from "../../authentication";

const localImages = import.meta.glob("../../imgs/*.png", {
  eager: true,
  import: "default",
});

const localPFPs: Record<string, string> = {};

Object.entries(localImages).forEach(([path, image]) => {
  const fileName = path.split("/").pop()?.replace(".png", "");
  if (fileName) {
    localPFPs[fileName] = image as string;
  }
});

export function useActualPFP(number?: string) {
  const { user } = useAuth();

  return localPFPs[number || user?.pfp || ""] || user?.pfp;
}
